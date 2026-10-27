import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PendingSubmissionStore } from '../src/booking-provider.mjs';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
}
const draft = {
  name:'Test Client', email:'test@example.com', phone:'0000000000',
  services:['haircut'], hairLength:'short', date:'2026-11-05',
  time:'09:00', notes:''
};

test('uncertain booking retries preserve the original request ID', () => {
  const store = new PendingSubmissionStore(memoryStorage(), () => 'request-uuid');
  const first = store.begin(draft);
  store.markUncertain(first.payload);
  const retry = store.begin({...draft});
  assert.equal(retry.retry, true);
  assert.equal(retry.payload.requestId, first.payload.requestId);
});

test('changed booking cannot replace an unresolved request', () => {
  const store = new PendingSubmissionStore(memoryStorage(), () => 'request-uuid');
  store.begin(draft);
  assert.throws(() => store.begin({...draft, time:'10:00'}), /unresolved submission/);
  assert.equal(store.get().payload.time, '09:00');
});

test('recovery UI restores rather than discards uncertain request', () => {
  const flow = readFileSync(new URL('../src/booking-flow-v2.js', import.meta.url), 'utf8');
  const start = flow.indexOf("$('#discard-pending').addEventListener('click'");
  assert.ok(start >= 0);
  const handler = flow.slice(start, flow.indexOf('\n  });', start));
  assert.match(handler, /restorePending\(\)/);
  assert.doesNotMatch(handler, /pendingStore\.clear\(\)/);
  const template = readFileSync(new URL('../src/booking-page-v2.mjs', import.meta.url), 'utf8');
  assert.match(template, /Restore original request/);
});
