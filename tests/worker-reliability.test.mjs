import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../backend/cloudflare/worker.mjs';

const env = {
  ALLOWED_ORIGIN: 'https://salon.example',
  APPS_SCRIPT_URL: 'https://script.example/exec',
  API_SHARED_SECRET: 'placeholder-not-a-real-secret',
  BOOKING_SUBMISSIONS_ENABLED: 'true'
};
const booking = {
  requestId: '12345678-1234-4234-8234-123456789abc',
  name: 'Test Client', email: 'test@example.invalid', phone: '0000000000',
  services: ['haircut'], hairLength: 'short', date: '2026-11-05', time: '09:00', notes: ''
};
function request(data = booking) {
  return new Request('https://worker.example/api/bookings', {
    method: 'POST', headers: { Origin: env.ALLOWED_ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}
async function withUpstream(handler, run) {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  try { await run(); } finally { globalThis.fetch = original; }
}
test('Worker forwards V2 payload and requestId unchanged', async () => {
  await withUpstream(async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.action, 'booking');
    assert.deepEqual(body.booking, booking);
    assert.equal(body.apiSecret, env.API_SHARED_SECRET);
    assert.ok(options.signal);
    return new Response(JSON.stringify({ ok: true, bookingId: booking.requestId, status: 'Pending', duplicate: false }));
  }, async () => {
    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 200);
  });
});
test('Worker rejects legacy requests without calling upstream', async () => {
  await withUpstream(async () => { throw Error('Unexpected upstream call'); }, async () => {
    assert.equal((await worker.fetch(request({ name: 'Legacy' }), env)).status, 400);
  });
});
test('Apps Script ok:false is uncertain for booking recovery', async () => {
  await withUpstream(async () => new Response(JSON.stringify({ ok: false, error: 'Lock timed out' })), async () => {
    assert.equal((await worker.fetch(request(), env)).status, 502);
  });
});
test('upstream timeout/error is uncertain for booking recovery', async () => {
  await withUpstream(async () => { throw new DOMException('Timed out', 'TimeoutError'); }, async () => {
    assert.equal((await worker.fetch(request(), env)).status, 502);
  });
});
test('valid upstream duplicate response is preserved', async () => {
  await withUpstream(async () => new Response(JSON.stringify({
    ok: true, bookingId: booking.requestId, status: 'Pending', duplicate: true
  })), async () => {
    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).duplicate, true);
  });
});
test('disabled booking submissions reject before upstream', async () => {
  await withUpstream(async () => { throw Error('Unexpected upstream call'); }, async () => {
    assert.equal((await worker.fetch(request(), { ...env, BOOKING_SUBMISSIONS_ENABLED: 'false' })).status, 503);
  });
});

test('explicit slot conflict returns 409 with typed code', async () => {
  await withUpstream(async () => new Response(JSON.stringify({
    ok: false, code: 'SLOT_UNAVAILABLE', error: 'That appointment time is no longer available.'
  })), async () => {
    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 409);
    assert.equal((await response.json()).code, 'SLOT_UNAVAILABLE');
  });
});
test('explicit idempotency mismatch returns 409 with typed code', async () => {
  await withUpstream(async () => new Response(JSON.stringify({
    ok: false, code: 'IDEMPOTENCY_CONFLICT'
  })), async () => {
    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 409);
    assert.equal((await response.json()).code, 'IDEMPOTENCY_CONFLICT');
  });
});
test('unknown or untyped failure remains uncertain', async () => {
  await withUpstream(async () => new Response(JSON.stringify({
    ok: false, code: 'UNEXPECTED_FAILURE'
  })), async () => {
    assert.equal((await worker.fetch(request(), env)).status, 502);
  });
});
