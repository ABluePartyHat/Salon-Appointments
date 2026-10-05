const defaultWeeklyAvailability = {
  0: [],
  1: [],
  2: [],
  3: [['09:00', '18:00']],
  4: [['09:00', '18:00']],
  5: [['09:00', '18:00']],
  6: [['08:00', '18:00']],
};

function legacyWeeklyAvailability() {
  const legacy = JSON.parse(process.env.BUSINESS_HOURS_JSON || 'null');
  if (!legacy) return defaultWeeklyAvailability;
  return Object.fromEntries(Object.entries(legacy).map(([day, range]) => [day, range ? [range] : []]));
}

const defaults = {
  timeZone: process.env.BUSINESS_TIME_ZONE || 'America/New_York',
  slotIntervalMinutes: Number(process.env.APPOINTMENT_SLOT_MINUTES || 30),
  bufferBeforeMinutes: Number(process.env.APPOINTMENT_BUFFER_BEFORE_MINUTES || 0),
  bufferAfterMinutes: Number(process.env.APPOINTMENT_BUFFER_AFTER_MINUTES || process.env.APPOINTMENT_BUFFER_MINUTES || 0),
  minimumAdvanceNoticeMinutes: Number(process.env.MINIMUM_NOTICE_MINUTES || 120),
  maximumAdvanceBookingDays: Number(process.env.MAX_DAYS_AHEAD || 60),
  closedWeekdays: (process.env.UNAVAILABLE_DAYS || '').split(',').filter(Boolean).map(Number),
  unavailableDates: [],
  weeklyAvailability: legacyWeeklyAvailability(),
  dateOverrides: {},
  serviceDurations: { balayage: 210, highlights: 180, haircut: 60, color: 120, styling: 60, consultation: 30 },
};

// BOOKING_SCHEDULE_JSON is the single preferred configuration value. It may
// override any default and supports split windows and date-specific overrides.
export const bookingConfig = process.env.BOOKING_SCHEDULE_JSON
  ? { ...defaults, ...JSON.parse(process.env.BOOKING_SCHEDULE_JSON) }
  : defaults;

export const services = {
  balayage: { name: 'Signature Balayage', minutes: bookingConfig.serviceDurations.balayage, price: 180 },
  highlights: { name: 'Dimensional Highlights', minutes: bookingConfig.serviceDurations.highlights, price: 150 },
  haircut: { name: 'The Signature Cut', minutes: bookingConfig.serviceDurations.haircut, price: 65 },
  color: { name: 'Color & Gloss', minutes: bookingConfig.serviceDurations.color, price: 95 },
  styling: { name: 'The Finishing Touch', minutes: bookingConfig.serviceDurations.styling, price: 55 },
  consultation: { name: 'Let’s Talk Hair', minutes: bookingConfig.serviceDurations.consultation, price: 25 },
};
