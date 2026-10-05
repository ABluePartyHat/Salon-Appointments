import test from 'node:test';
import assert from 'node:assert/strict';

delete process.env.BOOKING_SCHEDULE_JSON;
delete process.env.BUSINESS_HOURS_JSON;
const { bookingConfig } = await import('./booking-config.mjs');

test('default schedule is closed Sunday through Tuesday', () => {
  assert.deepEqual(bookingConfig.weeklyAvailability[0], []);
  assert.deepEqual(bookingConfig.weeklyAvailability[1], []);
  assert.deepEqual(bookingConfig.weeklyAvailability[2], []);
});

test('default schedule is Wednesday through Friday 9–6 and Saturday 8–6', () => {
  for (const day of [3, 4, 5]) assert.deepEqual(bookingConfig.weeklyAvailability[day], [['09:00', '18:00']]);
  assert.deepEqual(bookingConfig.weeklyAvailability[6], [['08:00', '18:00']]);
});
