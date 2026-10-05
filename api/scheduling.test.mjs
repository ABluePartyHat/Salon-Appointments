import test from 'node:test';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';

process.env.BOOKING_SCHEDULE_JSON = JSON.stringify({
  timeZone: 'America/New_York',
  slotIntervalMinutes: 30,
  bufferBeforeMinutes: 15,
  bufferAfterMinutes: 15,
  minimumAdvanceNoticeMinutes: 120,
  maximumAdvanceBookingDays: 60,
  closedWeekdays: [],
  unavailableDates: ['2030-01-08'],
  weeklyAvailability: { 0: [], 1: [['09:00', '12:00'], ['13:00', '17:00']], 2: [['09:00', '17:00']], 3: [], 4: [], 5: [], 6: [] },
  dateOverrides: { '2030-01-09': [['10:00', '14:00']] },
});

const { schedulingInternals } = await import('./index.mjs');
const service = { minutes: 60 };

test('slot generation supports split weekly windows and before/after buffers', () => {
  const date = DateTime.fromISO('2030-01-07', { zone: 'America/New_York' });
  assert.deepEqual(schedulingInternals.slotsForDate(date, service).map(slot => slot.toFormat('HH:mm')), ['09:15', '09:45', '10:15', '10:45', '13:15', '13:45', '14:15', '14:45', '15:15', '15:45']);
});

test('unavailable dates close and date overrides replace weekly availability', () => {
  const unavailable = DateTime.fromISO('2030-01-08', { zone: 'America/New_York' });
  const overridden = DateTime.fromISO('2030-01-09', { zone: 'America/New_York' });
  assert.deepEqual(schedulingInternals.availabilityWindows(unavailable), []);
  assert.deepEqual(schedulingInternals.availabilityWindows(overridden), [['10:00', '14:00']]);
});

test('busy periods remove only overlapping slots without exposing event details', () => {
  const zone = 'America/New_York';
  const busy = [{ start: DateTime.fromISO('2030-01-07T11:45', { zone }), end: DateTime.fromISO('2030-01-07T13:15', { zone }) }];
  assert.equal(schedulingInternals.overlaps(DateTime.fromISO('2030-01-07T11:00', { zone }), DateTime.fromISO('2030-01-07T12:00', { zone }), busy), true);
  assert.equal(schedulingInternals.overlaps(DateTime.fromISO('2030-01-07T10:00', { zone }), DateTime.fromISO('2030-01-07T11:00', { zone }), busy), false);
});
