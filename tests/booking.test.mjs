import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingWindow, validateDate, availableTimes, validateBooking, localDate, timeLabel } from '../src/booking-provider.mjs';
import { services } from '../src/data.mjs';
const now = new Date(2026, 8, 9, 23, 45);
const valid = { service: 'haircut', date: '2026-09-10', time: availableTimes('haircut', '2026-09-10', now)[0], firstName: 'Sample', lastName: 'Client', email: 'sample@example.com', phone: '(212) 555-0100', policy: true };

test('booking window uses local dates and spans month/year boundaries', () => {
  assert.deepEqual(bookingWindow(now), { min: '2026-09-10', max: '2026-11-08' });
  assert.equal(bookingWindow(new Date(2026, 11, 31, 23, 30)).min, '2027-01-01');
  assert.equal(localDate(new Date(2026, 0, 2)), '2026-01-02');
});
test('past, today, out-of-range, impossible and closed dates are rejected', () => {
  for (const date of ['', '2026-09-08', '2026-09-09', '2026-11-10', '2026-09-31', '2026-09-13', '2026-09-14', '<script>']) assert.notEqual(validateDate(date, now), '', date);
  for (const date of ['2026-09-10', '2026-09-11', '2026-09-12']) assert.equal(validateDate(date, now), '', date);
});
test('sample appointments always finish before weekday and Saturday closing', () => {
  for (const [date, close] of [['2026-09-10', 1080], ['2026-09-12', 1020]]) {
    for (const service of services.filter(s => !s.consultation)) {
      const times = availableTimes(service.id, date, now);
      assert.ok(times.length > 0);
      for (const time of times) {
        const [, h, m, period] = time.match(/(\d+):(\d+) (AM|PM)/);
        const start = (Number(h) % 12 + (period === 'PM' ? 12 : 0)) * 60 + Number(m);
        assert.ok(start + service.minutes <= close, `${service.id}: ${date} ${time}`);
      }
    }
  }
});
test('unknown service, extensions installation and closed dates expose no slots', () => {
  assert.deepEqual(availableTimes('unknown', valid.date, now), []);
  assert.deepEqual(availableTimes('extensions', valid.date, now), []);
  assert.deepEqual(availableTimes('haircut', '2026-09-13', now), []);
});
test('confirmation requires valid service, slot, contact details and policy consent', () => {
  assert.equal(validateBooking(valid, now), '');
  for (const change of [{ service: 'unknown' }, { time: '2:07 AM' }, { firstName: '  ' }, { lastName: '' }, { email: 'broken' }, { phone: '.......' }, { policy: false }]) assert.notEqual(validateBooking({ ...valid, ...change }, now), '');
});
test('slot labels handle noon and afternoon correctly', () => {
  assert.equal(timeLabel(540), '9:00 AM'); assert.equal(timeLabel(720), '12:00 PM'); assert.equal(timeLabel(810), '1:30 PM');
});
