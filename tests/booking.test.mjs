import test from 'node:test';
import assert from 'node:assert/strict';
import { localDate, timeLabel, formatDate } from '../src/booking-provider.mjs';

test('booking display helpers format local dates and times', () => {
  assert.equal(localDate(new Date(2026, 0, 2)), '2026-01-02');
  assert.equal(timeLabel(540), '9:00 AM'); assert.equal(timeLabel(720), '12:00 PM'); assert.equal(timeLabel(810), '1:30 PM');
  assert.match(formatDate('2026-09-10'), /September 10, 2026/);
});
