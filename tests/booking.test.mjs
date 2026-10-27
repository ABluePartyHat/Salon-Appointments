import test from 'node:test';
import assert from 'node:assert/strict';
import {
  localDate,
  timeLabel,
  formatDate,
  slotLabel,
  bookingProvider,
  PendingSubmissionStore,
  PENDING_SUBMISSION_KEY,
  SingleFlight,
  UNCERTAIN_MESSAGE,
} from '../src/booking-provider.mjs';
import { services } from '../src/data.mjs';
import { bookingLaunch } from '../src/data.mjs';
import { LatestAvailabilityRequest, retainedAvailableTime } from '../src/booking-flow-v2.js';
import { formatDurationMinutes, formatDurationRange } from '../src/duration.mjs';

test('booking display helpers format local dates and times', () => {
  assert.equal(localDate(new Date(2026, 0, 2)), '2026-01-02');
  assert.equal(timeLabel(540), '9:00 AM'); assert.equal(timeLabel(720), '12:00 PM'); assert.equal(timeLabel(810), '1:30 PM');
  assert.match(formatDate('2026-09-10'), /September 10, 2026/);
  assert.equal(slotLabel('09:30'), '9:30 AM');
  assert.equal(slotLabel('17:00'), '5:00 PM');
  assert.equal(slotLabel('25:00'), '');
});

test('service catalog has exact length pricing, provisional ranges, and add-on rules', () => {
  assert.equal(services.length, 13);
  assert.deepEqual(services.find(service => service.name === 'Blowout').prices, { short: 25, medium: 32.5, long: 40 });
  assert.deepEqual(services.find(service => service.name === 'Balayage').durations.long, [240, 300]);
  assert.deepEqual(services.filter(service => service.addOn).map(service => service.name), ['Ampoule Treatment', 'Hair Mask Treatment']);
  for (const service of services) {
    assert.deepEqual(Object.keys(service.prices), ['short', 'medium', 'long']);
    assert.deepEqual(Object.keys(service.durations), ['short', 'medium', 'long']);
  }
});

test('availability requests multiple services and hair length and accepts a 6 PM start', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl;
  globalThis.fetch = async url => {
    requestedUrl = String(url);
    return new Response(JSON.stringify({ ok: true, date: '2026-10-14', slots: ['09:00', '09:30', '18:00', '09:00'] }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  };
  try {
    assert.deepEqual(await bookingProvider.getAvailableTimes('2026-10-14', ['haircut', 'full-hair-color'], 'medium'), [
      { value: '09:00', label: '9:00 AM' },
      { value: '09:30', label: '9:30 AM' },
      { value: '18:00', label: '6:00 PM' },
    ]);
    const url = new URL(requestedUrl);
    assert.equal(url.pathname, '/api/availability');
    assert.deepEqual([...url.searchParams], [
      ['date', '2026-10-14'],
      ['services', 'haircut,full-hair-color'],
      ['hairLength', 'medium'],
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('availability rejects HTTP errors and malformed response contracts', async () => {
  const originalFetch = globalThis.fetch;
  const cases = [
    new Response('{', { status: 200 }),
    new Response(JSON.stringify({ ok: true, date: '2026-10-15', slots: ['09:00'] }), { status: 200 }),
    new Response(JSON.stringify({ ok: true, date: '2026-10-14', slots: ['invalid'] }), { status: 200 }),
    new Response('{}', { status: 503 }),
  ];
  try {
    for (const response of cases) {
      globalThis.fetch = async () => response;
      await assert.rejects(bookingProvider.getAvailableTimes('2026-10-14', ['haircut'], 'short'), /Availability/);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('availability changes retain only a time returned by the latest response', () => {
  const latest = [{ value: '09:30', label: '9:30 AM' }, { value: '18:00', label: '6:00 PM' }];
  assert.equal(retainedAvailableTime('09:30', latest), '09:30');
  assert.equal(retainedAvailableTime('09:00', latest), '');
});

test('outdated availability responses cannot replace the latest request', () => {
  const requests = new LatestAvailabilityRequest();
  const first = requests.begin();
  const second = requests.begin();
  assert.equal(requests.isCurrent(first), false);
  assert.equal(requests.isCurrent(second), true);
  requests.invalidate();
  assert.equal(requests.isCurrent(second), false);
});

test('appointment durations use human-readable hours and minutes', () => {
  assert.equal(formatDurationMinutes(30), '30 min');
  assert.equal(formatDurationMinutes(45), '45 min');
  assert.equal(formatDurationMinutes(60), '1h');
  assert.equal(formatDurationMinutes(90), '1h 30m');
  assert.equal(formatDurationMinutes(120), '2h');
  assert.equal(formatDurationRange([135, 180]), '2h 15m – 3h');
  assert.equal(formatDurationRange([180, 240]), '3h – 4h');
});

test('the source-controlled launch gate defaults to submissions disabled', () => {
  assert.equal(bookingLaunch.submissionsEnabled, true);
  assert.equal(Object.isFrozen(bookingLaunch), true);
});

const bookingDraft = Object.freeze({
  name: 'Example Customer', email: 'customer@example.com', phone: '',
  services: ['haircut', 'full-hair-color'], hairLength: 'medium',
  date: '2026-10-22', time: '18:00', notes: '',
});

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
}

test('successful Pending booking sends only the required Worker payload', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({
      ok: true, bookingId: 'booking-123', status: 'Pending', estimatedPrice: 115,
      estimatedDurationMin: 135, estimatedDurationMax: 180, reservedMinutes: 180, duplicate: false,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const store = new PendingSubmissionStore(memoryStorage(), () => 'uuid-v4');
    const { payload } = store.begin(bookingDraft);
    const result = await bookingProvider.submitBooking(payload);
    assert.equal(result.status, 'Pending');
    assert.equal(result.bookingId, 'booking-123');
    assert.equal(request.url, 'https://salon-booking-api.pino-raul2.workers.dev/api/bookings');
    assert.equal(request.options.method, 'POST');
    assert.deepEqual(JSON.parse(request.options.body), { requestId: 'uuid-v4', ...bookingDraft });
    assert.equal('estimatedPrice' in JSON.parse(request.options.body), false);
  } finally { globalThis.fetch = originalFetch; }
});

test('duplicate Pending acknowledgment is a successful recovery', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    ok: true, bookingId: 'same-booking', status: 'Pending', duplicate: true,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  try {
    const result = await bookingProvider.submitBooking({ requestId: 'same-id', ...bookingDraft });
    assert.equal(result.duplicate, true);
    assert.equal(result.bookingId, 'same-booking');
  } finally { globalThis.fetch = originalFetch; }
});

test('single-flight gate prevents a double-click from starting another request', async () => {
  const gate = new SingleFlight();
  let release;
  let calls = 0;
  const first = gate.run(async () => { calls += 1; await new Promise(resolve => { release = resolve; }); return 'done'; });
  const second = await gate.run(async () => { calls += 1; });
  assert.deepEqual(second, { ignored: true });
  assert.equal(calls, 1);
  release();
  assert.equal(await first, 'done');
});

test('HTTP 502 preserves the request ID and identical payload for explicit retry', async () => {
  const originalFetch = globalThis.fetch;
  const storage = memoryStorage();
  let idCalls = 0;
  const store = new PendingSubmissionStore(storage, () => { idCalls += 1; return 'preserved-id'; });
  const first = store.begin(bookingDraft);
  globalThis.fetch = async () => new Response(JSON.stringify({
    ok: true, bookingId: 'must-not-be-accepted', status: 'Pending', duplicate: false,
  }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  try {
    await assert.rejects(bookingProvider.submitBooking(first.payload), error => error.uncertain && error.message === UNCERTAIN_MESSAGE);
    store.markUncertain(first.payload);
    const retry = store.begin(bookingDraft);
    assert.equal(retry.retry, true);
    assert.equal(retry.payload.requestId, 'preserved-id');
    assert.deepEqual(retry.payload, first.payload);
    assert.equal(idCalls, 1);
  } finally { globalThis.fetch = originalFetch; }
});

test('changed payload after an uncertain submission cannot reuse its ID', () => {
  const store = new PendingSubmissionStore(memoryStorage(), () => 'original-id');
  store.markUncertain(store.begin(bookingDraft).payload);
  assert.throws(() => store.begin({ ...bookingDraft, notes: 'Changed after submit' }), error => error.code === 'PENDING_REQUEST_CHANGED');
});

test('session refresh recovers the unresolved payload for retry', () => {
  const storage = memoryStorage();
  const firstPage = new PendingSubmissionStore(storage, () => 'refresh-id');
  firstPage.markUncertain(firstPage.begin(bookingDraft).payload);
  const refreshedPage = new PendingSubmissionStore(storage, () => 'must-not-run');
  assert.equal(refreshedPage.get().payload.requestId, 'refresh-id');
  assert.equal(refreshedPage.begin(bookingDraft).retry, true);
  assert.match(storage.getItem(PENDING_SUBMISSION_KEY), /refresh-id/);
});
