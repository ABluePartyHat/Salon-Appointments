import crypto from 'node:crypto';
import { google } from 'googleapis';
import { DateTime } from 'luxon';
import { Firestore, FieldValue, Timestamp } from '@google-cloud/firestore';
import { bookingConfig, services } from './booking-config.mjs';

// Single server-side source of truth for scheduling rules. Google does not
// expose Appointment Schedule rules through the Calendar API, so mirror them
// here and keep all slot generation behind this backend.
const config = {
  ...bookingConfig,
  calendarId: process.env.GOOGLE_CALENDAR_ID,
  sheetId: process.env.GOOGLE_SHEET_ID || '',
  sheetRange: process.env.GOOGLE_SHEET_RANGE || 'Bookings!A:K',
  allowedOrigin: process.env.ALLOWED_ORIGIN || '*',
};

if (!config.calendarId) console.warn('GOOGLE_CALENDAR_ID is not configured; booking API requests will fail safely.');
const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/spreadsheets'] });
const calendar = google.calendar({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });
const firestore = process.env.GOOGLE_CLOUD_PROJECT ? new Firestore() : null;
const localLocks = new Map();

function json(res, status, body) {
  res.set('Access-Control-Allow-Origin', config.allowedOrigin);
  res.set('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

function parseDate(value) {
  const date = DateTime.fromISO(value, { zone: config.timeZone });
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && date.isValid && date.toISODate() === value ? date : null;
}

function parseTime(value) {
  const clock = /^(\d{1,2}):(\d{2})$/.exec(value || '');
  if (clock) {
    const hour = Number(clock[1]);
    const minute = Number(clock[2]);
    return hour < 24 && minute < 60 ? { hour, minute } : null;
  }
  const match = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(value || '');
  if (!match) return null;
  let hour = Number(match[1]) % 12 + (match[3] === 'PM' ? 12 : 0);
  const minute = Number(match[2]);
  return minute < 60 ? { hour, minute } : null;
}

function dateTime(date, time) {
  const parsed = parseTime(time);
  return parsed && date.set({ hour: parsed.hour, minute: parsed.minute, second: 0, millisecond: 0 });
}

function labelTime(date) { return date.toFormat('h:mm a'); }

function validateWindow(date) {
  const today = DateTime.now().setZone(config.timeZone).startOf('day');
  if (!date || date < today || date > today.plus({ days: config.maximumAdvanceBookingDays })) return 'Please choose a valid date in the booking window.';
  if (!availabilityWindows(date).length) return 'The studio is closed on that day.';
  if (date.hasSame(today, 'day') && DateTime.now().setZone(config.timeZone).plus({ minutes: config.minimumAdvanceNoticeMinutes }) >= date.endOf('day')) return 'Please choose another date.';
  return '';
}

function availabilityWindows(date) {
  const isoDate = date.toISODate();
  if (config.unavailableDates.includes(isoDate) || config.closedWeekdays.includes(date.weekday % 7)) return [];
  if (Object.hasOwn(config.dateOverrides, isoDate)) return config.dateOverrides[isoDate] || [];
  return config.weeklyAvailability[String(date.weekday % 7)] || [];
}

function slotsForDate(date, service) {
  const slots = [];
  const cutoff = DateTime.now().setZone(config.timeZone).plus({ minutes: config.minimumAdvanceNoticeMinutes });
  for (const [openLabel, closeLabel] of availabilityWindows(date)) {
    const open = dateTime(date, openLabel).plus({ minutes: config.bufferBeforeMinutes });
    const close = dateTime(date, closeLabel);
    const latest = close.minus({ minutes: service.minutes + config.bufferAfterMinutes });
    for (let start = open; start <= latest; start = start.plus({ minutes: config.slotIntervalMinutes })) {
      if (start > cutoff) slots.push(start);
    }
  }
  return slots;
}

async function busyRanges(start, end) {
  const response = await calendar.freebusy.query({ requestBody: { timeMin: start.toUTC().toISO(), timeMax: end.toUTC().toISO(), timeZone: config.timeZone, items: [{ id: config.calendarId }] } });
  const busy = response.data.calendars?.[config.calendarId]?.busy || [];
  return busy.map(range => ({ start: DateTime.fromISO(range.start).setZone(config.timeZone).minus({ minutes: config.bufferAfterMinutes }), end: DateTime.fromISO(range.end).setZone(config.timeZone).plus({ minutes: config.bufferBeforeMinutes }) }));
}

function overlaps(start, end, busy) { return busy.some(range => start < range.end && end > range.start); }

export const schedulingInternals = { availabilityWindows, slotsForDate, overlaps };

async function availableSlots(dateValue, serviceId) {
  const service = services[serviceId];
  const date = parseDate(dateValue);
  const error = validateWindow(date);
  if (error || !service) return { error, slots: [] };
  const possible = slotsForDate(date, service);
  if (!possible.length) return { error: '', slots: [] };
  const busy = await busyRanges(date.startOf('day').minus({ minutes: config.bufferBeforeMinutes }), date.plus({ days: 1 }).startOf('day').plus({ minutes: config.bufferAfterMinutes }));
  return { error: '', slots: possible.filter(start => !overlaps(start, start.plus({ minutes: service.minutes }), busy)).map(labelTime) };
}

async function acquireLock(key) {
  if (firestore) {
    const ref = firestore.collection('bookingLocks').doc(key);
    await firestore.runTransaction(async tx => {
      const snapshot = await tx.get(ref);
      const expiresAt = snapshot.exists ? snapshot.data().expiresAt?.toMillis?.() : 0;
      if (expiresAt > Date.now()) throw Object.assign(new Error('slot-locked'), { code: 'SLOT_UNAVAILABLE' });
      tx.set(ref, { expiresAt: Timestamp.fromMillis(Date.now() + 2 * 60 * 1000), createdAt: FieldValue.serverTimestamp() });
    });
    return () => ref.delete().catch(() => {});
  }
  if (localLocks.has(key)) throw Object.assign(new Error('slot-locked'), { code: 'SLOT_UNAVAILABLE' });
  localLocks.set(key, true);
  return () => localLocks.delete(key);
}

async function existingBooking(eventId) {
  try { return (await calendar.events.get({ calendarId: config.calendarId, eventId })).data; } catch (error) { if (error.code !== 404) throw error; return null; }
}

async function syncSheet(booking, eventId, createdAt) {
  if (!config.sheetId) return;
  await sheets.spreadsheets.values.append({ spreadsheetId: config.sheetId, range: config.sheetRange, valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS', requestBody: { values: [[booking.bookingId, `${booking.firstName} ${booking.lastName}`, booking.email, booking.phone, services[booking.service].name, booking.date, booking.time, services[booking.service].minutes, 'confirmed', eventId, createdAt]] } });
}

async function book(booking) {
  const service = services[booking.service];
  const date = parseDate(booking.date);
  const time = parseTime(booking.time);
  if (!service || !date || !time || !booking.bookingId || !booking.firstName?.trim() || !booking.lastName?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email || '') || !/^[+0-9() .-]{7,25}$/.test(booking.phone || '')) throw Object.assign(new Error('Please check your appointment details.'), { code: 'INVALID_BOOKING' });
  const dateError = validateWindow(date);
  if (dateError) throw Object.assign(new Error(dateError), { code: 'INVALID_DATE' });
  const start = dateTime(date, booking.time);
  const end = start.plus({ minutes: service.minutes });
  if (!slotsForDate(date, service).some(slot => slot.toMillis() === start.toMillis())) throw Object.assign(new Error('That appointment time is no longer available. Please select another time.'), { code: 'SLOT_UNAVAILABLE' });
  const lock = await acquireLock(crypto.createHash('sha256').update(`${booking.date}|${booking.time}`).digest('hex'));
  try {
    const eventId = crypto.createHash('sha256').update(`booking:${booking.bookingId}`).digest('hex').slice(0, 40);
    const already = await existingBooking(eventId);
    if (already) return { status: 'confirmed', bookingId: booking.bookingId, eventId: already.id };
    const busy = await busyRanges(start.minus({ minutes: config.bufferBeforeMinutes }), end.plus({ minutes: config.bufferAfterMinutes }));
    if (overlaps(start, end, busy)) throw Object.assign(new Error('That appointment time is no longer available. Please select another time.'), { code: 'SLOT_UNAVAILABLE' });
    const createdAt = DateTime.now().toUTC().toISO();
    const created = await calendar.events.insert({ calendarId: config.calendarId, sendUpdates: 'none', requestBody: { id: eventId, summary: `Appointment – ${service.name} – ${booking.firstName} ${booking.lastName}`, description: `Customer: ${booking.firstName} ${booking.lastName}\nEmail: ${booking.email}\nPhone: ${booking.phone}\nNotes: ${booking.notes || ''}`, start: { dateTime: start.toISO(), timeZone: config.timeZone }, end: { dateTime: end.toISO(), timeZone: config.timeZone }, extendedProperties: { private: { bookingId: booking.bookingId } } } });
    try { await syncSheet(booking, created.data.id, createdAt); } catch (sheetError) { console.error('Calendar booking succeeded but Sheets sync failed', sheetError); }
    return { status: 'confirmed', bookingId: booking.bookingId, eventId: created.data.id };
  } finally { await lock(); }
}

export async function api(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  try {
    if (req.method === 'GET' && req.path === '/availability') {
      const result = await availableSlots(req.query.date, req.query.service);
      return json(res, 200, { date: req.query.date, availableSlots: result.slots });
    }
    if (req.method === 'POST' && req.path === '/book') return json(res, 200, await book(req.body || {}));
    return json(res, 404, { message: 'Not found.' });
  } catch (error) {
    const status = error.code === 'SLOT_UNAVAILABLE' ? 409 : error.code === 'INVALID_BOOKING' || error.code === 'INVALID_DATE' ? 400 : 500;
    console.error(error);
    return json(res, status, { code: error.code || 'BOOKING_ERROR', message: status === 500 ? 'Booking is temporarily unavailable. Please try again.' : error.message });
  }
}
