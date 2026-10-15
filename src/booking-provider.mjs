import { business } from './data.mjs';

export const PENDING_SUBMISSION_KEY = 'salon-booking-pending-request-v1';
export const UNCERTAIN_MESSAGE = "We couldn't confirm whether your request was received. Please retry the same request or contact the salon before submitting another.";

const availabilityError = 'Availability is temporarily unavailable. Please try another date or try again shortly.';
const malformedAvailabilityError = 'Availability could not be verified. Please try again shortly.';

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

export function slotLabel(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return '';
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return '';
  return timeLabel((hour * 60) + minute);
}

function validDraft(draft) {
  return draft
    && typeof draft.name === 'string' && draft.name.trim()
    && typeof draft.email === 'string' && draft.email.trim()
    && typeof draft.phone === 'string'
    && Array.isArray(draft.services) && draft.services.length
    && draft.services.every(id => typeof id === 'string' && id)
    && /^(short|medium|long)$/.test(draft.hairLength)
    && /^\d{4}-\d{2}-\d{2}$/.test(draft.date)
    && /^\d{2}:\d{2}$/.test(draft.time)
    && typeof draft.notes === 'string';
}

export function createBookingPayload(draft, requestId) {
  if (!validDraft(draft) || typeof requestId !== 'string' || !requestId) throw new TypeError('Invalid booking request.');
  return {
    requestId,
    name: draft.name.trim(),
    email: draft.email.trim(),
    phone: draft.phone.trim(),
    services: [...draft.services],
    hairLength: draft.hairLength,
    date: draft.date,
    time: draft.time,
    notes: draft.notes.trim(),
  };
}

export function sameBookingDraft(payload, draft) {
  if (!payload || !validDraft(draft)) return false;
  return JSON.stringify(payload) === JSON.stringify(createBookingPayload(draft, payload.requestId));
}

export class PendingSubmissionStore {
  constructor(storage, idFactory = () => crypto.randomUUID()) {
    this.storage = storage;
    this.idFactory = idFactory;
  }

  get() {
    try {
      const record = JSON.parse(this.storage.getItem(PENDING_SUBMISSION_KEY));
      return record?.version === 1 && record?.payload?.requestId ? record : null;
    } catch {
      return null;
    }
  }

  begin(draft) {
    const existing = this.get();
    if (existing) {
      if (!sameBookingDraft(existing.payload, draft)) {
        const error = new Error('The booking details changed after an unresolved submission. Resolve the previous request before submitting new details.');
        error.code = 'PENDING_REQUEST_CHANGED';
        throw error;
      }
      return { payload: existing.payload, retry: true };
    }
    const payload = createBookingPayload(draft, this.idFactory());
    this.save(payload, 'submitting');
    return { payload, retry: false };
  }

  save(payload, state = 'uncertain') {
    this.storage.setItem(PENDING_SUBMISSION_KEY, JSON.stringify({ version: 1, state, payload }));
  }

  markUncertain(payload) { this.save(payload, 'uncertain'); }
  clear() { this.storage.removeItem(PENDING_SUBMISSION_KEY); }
}

export class SingleFlight {
  constructor() { this.active = false; }

  async run(operation) {
    if (this.active) return { ignored: true };
    this.active = true;
    try { return await operation(); } finally { this.active = false; }
  }
}

function validBookingResponse(payload) {
  return payload?.ok === true
    && typeof payload.bookingId === 'string' && payload.bookingId.trim()
    && payload.status === 'Pending'
    && typeof payload.duplicate === 'boolean';
}

async function jsonOrNull(response) {
  try { return await response.json(); } catch { return null; }
}

export const bookingProvider = {
  async getAvailableTimes(date, serviceIds, hairLength) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Array.isArray(serviceIds) || !serviceIds.length || !/^(short|medium|long)$/.test(hairLength)) {
      throw new Error(malformedAvailabilityError);
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const url = new URL(business.availabilityApiUrl);
      url.searchParams.set('date', date);
      url.searchParams.set('services', serviceIds.join(','));
      url.searchParams.set('hairLength', hairLength);
      const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) throw new Error(availabilityError);
      const payload = await jsonOrNull(response);
      if (payload?.ok !== true || payload.date !== date || !Array.isArray(payload.slots) || payload.slots.some(slot => !slotLabel(slot))) {
        throw new Error(malformedAvailabilityError);
      }
      return [...new Set(payload.slots)].map(slot => ({ value: slot, label: slotLabel(slot) }));
    } catch (error) {
      if (error?.message === malformedAvailabilityError || error?.message === availabilityError) throw error;
      throw new Error(availabilityError);
    } finally {
      clearTimeout(timeout);
    }
  },

  async submitBooking(payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(business.bookingApiUrl, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const body = await jsonOrNull(response);
      if (response.status >= 500) {
        const error = new Error(UNCERTAIN_MESSAGE); error.uncertain = true; throw error;
      }
      if (!response.ok) {
        const error = new Error(body?.error || body?.message || 'The request could not be submitted. Please review your details and try again.');
        error.definitive = true;
        throw error;
      }
      if (!validBookingResponse(body)) {
        const error = new Error(UNCERTAIN_MESSAGE); error.uncertain = true; throw error;
      }
      return body;
    } catch (error) {
      if (error?.uncertain || error?.definitive) throw error;
      const uncertain = new Error(UNCERTAIN_MESSAGE); uncertain.uncertain = true; throw uncertain;
    } finally {
      clearTimeout(timeout);
    }
  },
};
