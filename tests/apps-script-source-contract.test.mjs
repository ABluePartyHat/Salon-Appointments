import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Snapshot-backed contract checks. Copy the audited Apps Script source into
// backend/apps-script before running; no live services are invoked.
const read = name => readFileSync(new URL('../backend/apps-script/' + name, import.meta.url), 'utf8');

test('V2 booking obtains lock before ID lookup and availability recheck', () => {
  const source = read('BookingV2.js');
  const fn = source.slice(source.indexOf('function createBookingRequestV2('), source.indexOf('function testCreateBookingRequestV2('));
  const ordered = ['lock.waitLock(20000)', 'const existingActive', 'const available = getAvailabilityV2(', 'sh.appendRow('];
  let last = -1;
  for (const marker of ordered) {
    const next = fn.indexOf(marker);
    assert.ok(next > last, marker + ' must follow prior transactional step');
    last = next;
  }
  assert.match(fn, /finally\s*\{\s*lock\.releaseLock\(\)/);
  assert.match(fn, /findOriginalRequest51B_\(bookingId\)/);
  assert.match(fn, /Request ID already belongs to a different booking/);
});

test('legacy booking route is still reachable and lacks request-ID idempotency', () => {
  const code = read('Code.js');
  assert.match(code, /return json_\(\s*createBookingRequest\(booking\)/);
  const legacy = code.slice(code.indexOf('function createBookingRequest(data)'), code.indexOf('function selected_()'));
  assert.match(legacy, /Utilities\.getUuid\(\)/);
  assert.doesNotMatch(legacy, /data\.requestId/);
});

test('notification delivery starts disabled', () => {
  assert.match(read('BookingNotifications52.js'), /deliveryEnabled:\s*false/);
});
