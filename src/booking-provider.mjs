import { services, business } from './data.mjs';

// Provider boundary: replace these methods with a booking provider's server-backed
// availability and reservation endpoints. Never place secret API keys in this file.
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
export function timeLabel(minutes) {
  const hour = Math.floor(minutes / 60);
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}
export const bookingProvider = {
  mode: 'google-calendar',
  async getAvailableTimes(serviceId, value) {
    const service = services.find(s => s.id === serviceId && !s.consultation);
    if (!service || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return [];
    const response = await fetch(`${business.bookingApiBaseUrl}/availability?service=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(value)}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Availability is temporarily unavailable. Please try again.');
    const payload = await response.json();
    return Array.isArray(payload.availableSlots) ? payload.availableSlots : [];
  },
  async confirm(booking) {
    const response = await fetch(`${business.bookingApiBaseUrl}/book`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(booking) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(payload.message || 'This time is no longer available. Please choose another.'); error.code = payload.code; throw error; }
    return payload;
  },
};
