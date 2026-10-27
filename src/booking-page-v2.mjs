import { services, bookingLaunch } from './data.mjs';
import { arrow, eyebrow } from './components.mjs';
import { formatDurationRange } from './duration.mjs';

const money = value => Number.isInteger(value) ? `$${value}` : `$${value.toFixed(2)}`;

function hairIllustration(length) {
  const paths = {
    short: '<path d="M24 19c0-8 5-13 12-13s12 5 12 13v7c-3-2-5-5-6-9-4 4-10 6-18 6Z"/><path d="M27 25v3c0 6 4 11 9 11s9-5 9-11v-5"/>',
    medium: '<path d="M22 20C22 11 28 6 36 6s14 5 14 14v22l-7-4V19c-3 3-9 6-18 6v17l-5 3Z"/><path d="M27 25v4c0 6 4 10 9 10s9-4 9-10v-7"/>',
    long: '<path d="M21 21C21 11 27 6 36 6s15 5 15 15v34l-8-6V20c-4 4-10 6-19 6v23l-7 6Z"/><path d="M27 26v4c0 6 4 10 9 10s9-4 9-10v-7"/>',
  };
  return `<svg viewBox="0 0 72 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths[length]}</svg>`;
}

function serviceChoice(service) {
  return `<label class="booking-service"><input type="checkbox" name="services" value="${service.id}"><span class="check-dot" aria-hidden="true"></span><span class="booking-service-name"><strong>${service.name}${service.addOn ? ' <em>Add-on</em>' : ''}</strong><small>Short ${money(service.prices.short)} · Medium ${money(service.prices.medium)} · Long ${money(service.prices.long)}</small><small class="booking-service-duration" data-duration-short="${formatDurationRange(service.durations.short)}" data-duration-medium="${formatDurationRange(service.durations.medium)}" data-duration-long="${formatDurationRange(service.durations.long)}">Estimated duration</small></span></label>`;
}

export function bookingPage() { return `
<section class="page-intro container booking-intro">${eyebrow('MAKE A LITTLE TIME FOR YOU')}<h1>Your next chapter<br>starts <em>here.</em></h1><p>Build an appointment request and view real start-time availability.</p></section>
<section class="container booking-section">
  <div class="booking-demo-note"><span class="status-dot"></span><p><strong>Live integration testing is in progress.</strong> You can browse services, estimates, and live availability, but final submission is temporarily paused. No appointment request will be sent.</p></div>
  <div class="booking-layout">
    <div>
      <ol class="booking-progress" aria-label="Booking steps">${['Hair length &amp; services', 'Estimate', 'Date &amp; time', 'Your details'].map((label, index) => `<li data-progress="${index}" ${index === 0 ? 'aria-current="step"' : ''}><span>${index + 1}</span>${label}</li>`).join('')}</ol>
      <form id="booking-form">
        <div class="booking-panel" data-step="0">
          <div class="panel-heading">${eyebrow('01 / YOUR HAIR &amp; SERVICES')}<h2>Let’s plan your visit.</h2><p>Choose your hair length, then select one or more services.</p></div>
          <fieldset class="hair-length"><legend class="field-label">Hair length</legend><div class="hair-length-grid">${['short', 'medium', 'long'].map(length => `<label class="hair-length-option"><input type="radio" name="hairLength" value="${length}"><span>${hairIllustration(length)}<strong>${length[0].toUpperCase()}${length.slice(1)}</strong></span></label>`).join('')}</div></fieldset>
          <div class="combined-services-heading"><h3>What are we creating?</h3><p>Choose one or more services for your visit.</p></div>
          <fieldset class="booking-services"><legend class="field-label">Services</legend>${services.map(serviceChoice).join('')}</fieldset>
          <p class="fine-print">Ampoule Treatment and Hair Mask Treatment are add-ons and require at least one regular service.</p>
          <button class="button button-primary next-step" type="button">Review Estimate</button>
        </div>
        <div class="booking-panel" data-step="1" hidden>
          <div class="panel-heading">${eyebrow('02 / YOUR ESTIMATE')}<h2>Your visit, thoughtfully planned.</h2><p>Review the estimated price and time before choosing an appointment.</p></div>
          <div class="estimate-review" aria-live="polite"><dl class="estimate-summary-grid"><div class="estimate-field"><dt>Hair length</dt><dd id="review-length">—</dd></div><div class="estimate-field"><dt>Services</dt><dd id="review-services">—</dd></div><div class="estimate-field"><dt>Estimated duration</dt><dd id="review-duration">—</dd></div><div class="estimate-field"><dt>Estimated price</dt><dd id="review-price">—</dd></div></dl><p>These are planning estimates. The booking service remains authoritative.</p></div>
          <div class="panel-actions"><button class="button button-text prev-step" type="button">← Back</button><button class="button button-primary next-step" type="button">Choose Date & Time</button></div>
        </div>
        <div class="booking-panel" data-step="2" hidden>
          <div class="panel-heading">${eyebrow('03 / DATE & TIME')}<h2>Find your little window.</h2><p>Choose a date to retrieve live appointment times.</p></div>
          <label class="field-label" for="appointment-date">Appointment date</label><input class="date-input" id="appointment-date" name="date" type="date" required>
          <p class="fine-print">The booking system determines business hours, blocked dates, booking windows, and occupied times.</p>
          <fieldset class="availability-fieldset"><legend class="field-label">Available start times</legend><p id="time-date-label" class="time-date-label">Choose a date to retrieve live availability</p><div class="time-grid" id="time-options" aria-live="polite" aria-atomic="true"></div></fieldset>
          <p class="fine-print">Selecting a returned time does not reserve it.</p>
          <div class="panel-actions"><button class="button button-text prev-step" type="button">← Back</button><button id="continue-to-details" class="button button-primary next-step" type="button" disabled aria-describedby="time-selection-help">Your Details</button></div>
          <p class="submission-note" id="time-selection-help">Choose an available time to continue.</p>
        </div>
        <div class="booking-panel" data-step="3" hidden>
          <div class="panel-heading">${eyebrow('04 / YOUR DETAILS')}<h2>Let’s get acquainted.</h2><p>Share the details the studio should use to follow up on your Pending Approval request.</p></div>
          <div class="form-grid"><label>First name<input name="firstName" autocomplete="given-name" maxlength="60" required></label><label>Last name<input name="lastName" autocomplete="family-name" maxlength="60" required></label><label>Email address<input name="email" type="email" autocomplete="email" maxlength="120" required></label><label>Phone number <span class="optional-label">Optional</span><input name="phone" type="tel" autocomplete="tel" pattern="[+0-9() .-]{7,25}"></label></div>
          <label class="full-field">Anything you’d like me to know?<textarea name="notes" rows="4" maxlength="2000" placeholder="Your hair goals, recent color or treatments, and any access needs…"></textarea></label>
          <p class="fine-print">Your details are sent securely to the salon booking service only when submission is enabled and you submit.</p>
          <div class="booking-policy"><h3>Request first. Approval follows.</h3><p>When submissions open, your request will be marked Pending Approval. Your appointment will not be confirmed until Gladys reviews and approves it.</p></div>
          <div id="booking-recovery" class="booking-recovery" hidden><strong>Unresolved request found</strong><p id="booking-recovery-message"></p><button id="discard-pending" class="button button-text" type="button">Resolve by starting over</button></div>
          <div class="panel-actions"><button class="button button-text prev-step" type="button">← Back</button><button id="submit-booking" class="button button-primary" type="submit"${bookingLaunch.submissionsEnabled ? '' : ' disabled'}>${bookingLaunch.submissionsEnabled ? 'Submit Request' : 'Submissions Paused'} ${arrow}</button></div>
          <p class="submission-note" id="submission-launch-note">${bookingLaunch.submissionsEnabled ? 'Submitting a request does not confirm an appointment.' : 'Final submission is disabled during the controlled integration review.'}</p>
        </div>
        <p id="booking-error" class="form-error" role="alert"></p>
      </form>
      <section id="booking-success" class="booking-confirmation" hidden aria-live="polite"><div class="confirmation-symbol" aria-hidden="true">✓</div><p class="eyebrow">REQUEST RECEIVED</p><h2 tabindex="-1">Request Received — Pending Approval</h2><p>Your request was received by the salon and is waiting for manual review. This is not a confirmed appointment.</p><div id="confirmation-details"></div><a class="button button-outline" href="./index.html">Return Home</a></section>
    </div>
    <aside class="booking-summary" aria-label="Booking estimate"><div class="summary-top"><span class="eyebrow">YOUR VISIT, ESTIMATED</span><h2>A visit with Gladys</h2></div><dl><div><dt>Services</dt><dd id="summary-service">Choose one or more services</dd></div><div><dt>Hair length</dt><dd id="summary-length">Choose your hair length</dd></div><div><dt>Date</dt><dd id="summary-date">A day for you</dd></div><div><dt>Time</dt><dd id="summary-time">Choose an available time</dd></div><div><dt>Estimated duration</dt><dd id="summary-duration">—</dd></div></dl><div class="summary-total"><span>Estimated total</span><strong id="summary-price">—</strong></div><p class="fine-print">All prices and durations shown here are estimates. The booking service calculates the authoritative estimates.</p><div class="summary-personal"><span aria-hidden="true">✳</span><p>Requests remain Pending Approval<br>until manually approved.</p></div></aside>
    <div id="booking-loading-overlay" class="booking-loading-overlay" hidden role="status" aria-live="assertive" aria-atomic="true"><div class="booking-loading-card"><span class="booking-spinner" aria-hidden="true"></span><h2>Sending your booking request</h2><p>Please keep this page open while we check your appointment and submit your request.</p><small class="booking-loading-status">Processing is underway…</small></div></div>
  </div>
</section>`; }
