import test from 'node:test';
import assert from 'node:assert/strict';

// A deterministic, in-memory simulation of the expected Apps Script transaction.
// This does NOT test the deployed Worker or Apps Script implementation.
class SimulatedBookingStore {
  constructor() { this.rows = []; this.queue = Promise.resolve(); }
  async submit(request) {
    const previous = this.queue;
    let release;
    this.queue = new Promise(resolve => { release = resolve; });
    await previous;
    try {
      const existing = this.rows.find(row => row.requestId === request.requestId);
      if (existing) return { ok: true, bookingId: existing.id, duplicate: true };
      const end = request.start + request.minutes;
      if (this.rows.some(row => row.status !== 'Declined' && request.start < row.end && end > row.start)) {
        return { ok: false, error: 'CONFLICT' };
      }
      const id = 'booking-' + (this.rows.length + 1);
      this.rows.push({ id, requestId: request.requestId, start: request.start, end, status: 'Pending' });
      return { ok: true, bookingId: id, duplicate: false };
    } finally { release(); }
  }
}
const request = (requestId, start = 570) => ({ requestId, start, minutes: 60 });

test('simulation: simultaneous identical request IDs create one row', async () => {
  const store = new SimulatedBookingStore();
  const results = await Promise.all(Array.from({length: 20}, () => store.submit(request('same-id'))));
  assert.equal(store.rows.length, 1);
  assert.equal(new Set(results.map(r => r.bookingId)).size, 1);
  assert.equal(results.filter(r => r.duplicate).length, 19);
});

test('simulation: concurrent overlapping different IDs cannot both succeed', async () => {
  const store = new SimulatedBookingStore();
  const results = await Promise.all([store.submit(request('a', 570)), store.submit(request('b', 600))]);
  assert.equal(results.filter(r => r.ok).length, 1);
  assert.equal(store.rows.length, 1);
});

test('simulation: adjacent reservations do not conflict', async () => {
  const store = new SimulatedBookingStore();
  const results = await Promise.all([store.submit(request('a', 570)), store.submit(request('b', 630))]);
  assert.equal(results.filter(r => r.ok).length, 2);
});

test('simulation: declined reservation releases slot', async () => {
  const store = new SimulatedBookingStore();
  await store.submit(request('a'));
  store.rows[0].status = 'Declined';
  assert.equal((await store.submit(request('b'))).ok, true);
});
