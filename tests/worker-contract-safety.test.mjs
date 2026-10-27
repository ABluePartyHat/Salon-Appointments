import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bookingProvider } from '../src/booking-provider.mjs';

test('availability request is read-only and uses the configured Worker endpoint', async () => {
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = {url: String(url), options};
    return {ok:true, json:async()=>({ok:true,date:'2026-10-29',slots:['09:00','18:00']})};
  };
  try {
    const slots = await bookingProvider.getAvailableTimes('2026-10-29',['haircut'],'short');
    assert.deepEqual(slots.map(s=>s.value),['09:00','18:00']);
    const endpoint = new URL(captured.url);
    assert.equal(endpoint.pathname,'/api/availability');
    assert.equal(endpoint.searchParams.get('services'),'haircut');
    assert.equal(endpoint.searchParams.get('hairLength'),'short');
    assert.equal(captured.options.method ?? 'GET','GET');
  } finally { globalThis.fetch = originalFetch; }
});

test('submission transport is mocked and preserves Pending duplicate contract', async () => {
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = {url:String(url), options};
    return {status:200,ok:true,json:async()=>({ok:true,bookingId:'test-id',status:'Pending',duplicate:true})};
  };
  try {
    const payload = {requestId:'12345678-1234-4234-8234-123456789abc'};
    const result = await bookingProvider.submitBooking(payload);
    assert.equal(result.duplicate,true);
    assert.equal(new URL(captured.url).pathname,'/api/bookings');
    assert.equal(captured.options.method,'POST');
    assert.deepEqual(JSON.parse(captured.options.body),payload);
  } finally {globalThis.fetch=originalFetch;}
});

test('public submissions stay disabled in source', () => {
  const data = readFileSync(new URL('../src/data.mjs',import.meta.url),'utf8');
  assert.match(data,/submissionsEnabled:\s*false/);
});
