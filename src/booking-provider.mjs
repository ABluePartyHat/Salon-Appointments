import { services } from './data.mjs';

// Provider boundary: replace these methods with a booking provider's server-backed
// availability and reservation endpoints. Never place secret API keys in this file.
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function bookingWindow(now = new Date()) {
  const min = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const max = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 60);
  return { min: localDate(min), max: localDate(max) };
}
export function validateDate(value, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Please choose an appointment date.';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime()) || localDate(date) !== value) return 'Please choose a valid date.';
  const { min, max } = bookingWindow(now);
  if (value < min || value > max) return 'Please choose a date from tomorrow through the next 60 days.';
  if ([0, 1].includes(date.getDay())) return 'The studio is closed Sunday and Monday. Please choose Tuesday–Saturday.';
  return '';
}
export function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
export function timeLabel(minutes) {
  const hour = Math.floor(minutes / 60);
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}
export function availableTimes(serviceId, value, now = new Date()) {
  const service = services.find(s => s.id === serviceId && !s.consultation);
  if (!service || validateDate(value, now)) return [];
  const date = new Date(`${value}T12:00:00`);
  const close = date.getDay() === 6 ? 17 * 60 : 18 * 60;
  // Illustrative availability only. Exclude one rotating sample slot.
  return [540, 600, 660, 750, 810, 870, 930, 990]
    .filter((start, i) => start + service.minutes <= close && i !== date.getDate() % 5)
    .map(timeLabel);
}
export function validateBooking(booking, now = new Date()) {
  if (!services.some(s => s.id === booking.service && !s.consultation)) return 'Please choose a service.';
  const dateError = validateDate(booking.date, now);
  if (dateError) return dateError;
  if (!availableTimes(booking.service, booking.date, now).includes(booking.time)) return 'Please choose one of the available appointment times.';
  if (!booking.firstName?.trim() || !booking.lastName?.trim()) return 'Please enter your first and last name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email || '')) return 'Please enter a valid email address.';
  if (!/^[+0-9() .-]{7,25}$/.test(booking.phone || '') || (booking.phone.match(/\d/g) || []).length < 7) return 'Please enter a valid phone number.';
  if (!booking.policy) return 'Please acknowledge the sample booking policies.';
  return '';
}
export const bookingProvider = {
  mode: 'demo',
  getAvailableTimes: availableTimes,
  async confirm(booking) {
    const error = validateBooking(booking);
    if (error) throw new Error(error);
    // No network request, payment, storage, or reminders. Keep demo unambiguous.
    return { status: 'preview-complete', booked: false, paymentCollected: false };
  },
};
