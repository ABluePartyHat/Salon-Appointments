import { business, services, bookingLaunch } from './data.mjs';
import { arrow, eyebrow } from './components.mjs';

const money = value => Number.isInteger(value) ? `$${value}` : `$${value.toFixed(2)}`;
const duration = range => `${range[0]}–${range[1]} min`;

function hairIllustration(length) {
  const paths = {
    short: '<path d="M24 19c0-8 5-13 12-13s12 5 12 13v7c-3-2-5-5-6-9-4 4-10 6-18 6Z"/><path d="M27 25v3c0 6 4 11 9 11s9-5 9-11v-5"/>',
    medium: '<path d="M22 20C22 11 28 6 36 6s14 5 14 14v22l-7-4V19c-3 3-9 6-18 6v17l-5 3Z"/><path d="M27 25v4c0 6 4 10 9 10s9-4 9-10v-7"/>',
    long: '<path d="M21 21C21 11 27 6 36 6s15 5 15 15v34l-8-6V20c-4 4-10 6-19 6v23l-7 6Z"/><path d="M27 26v4c0 6 4 10 9 10s9-4 9-10v-7"/>',
  };
  return `<svg viewBox="0 0 72 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths[length]}</svg>`;
}

function serviceChoice(service) {
  return `<label class="booking-service"><input type="checkbox" name="services" value="${service.id}"><span class="check-dot" aria-hidden="true"></span><span class="booking-service-name"><strong>${service.name}${service.addOn ? ' <em>Add-on</em>' : ''}</strong><small>Short ${money(service.prices.short)} · Medium ${money(service.prices.medium)} · Long ${money(service.prices.long)}</small></span></label>`;
}

export function bookingPage() { return `
<section class="page-intro container booking-intro">${eyebrow('MAKE A LITTLE TIME FOR YOU')}<h1>Your next chapter<br>starts <em>here.</em></h1><p>Build an appointment request and view real start-time availability.</p></section>
<section class="container booking-section">
  <div class="booking-demo-note"><span class="status-dot"></span><p><strong>Live integration testing is in progress.</strong> You can browse services, estimates, and live availability, but final submission is temporarily paused. No appointment request will be sent.</p></div>
  <div class="booking-layout"><div>
    <ol class="booking-progress" aria-label="Booking steps">${['Services', 'Date', 'Time', 'Your details', 'Review'].map((label, index) => `<li data-progress="${index}" ${index === 0 ? 'aria-current="step"' : ''}><span>${index + 1}</span>${label}</li>`).join('')}</ol>
    <form id="booking-form">
      <div class="booking-panel" data-step="0">
        <div class="panel-heading">${eyebrow('01 / YOUR SERVICES')}<h2>What are we creating?</h2><p>Choose one or more services, then tell us your hair length.</p></div>
        <fieldset class="booking-services"><legend class="field-label">Services</legend>${services.map(serviceChoice).join('')}</fieldset>
        <p class="fine-print">Ampoule Treatment and Hair Mask Treatment are add-ons and require at least one regular service.</p>
        <fieldset class="hair-length"><legend class="field-label">Hair length</legend><div class="hair-length-grid">${['short', 'medium', 'long'].map(length => `<label class="hair-length-option"><input type="radio" name="hairLength" value="${length}"><span>${hairIllustration(length)}<strong>${length[0].toUpperCase()}${length.slice(1)}</strong></span></label>`).join('')}</div></fieldset>
        <button class="button button-primary next-step" type="button">Choose a Date ${arrow}</button>
      </div>
      <div class="booking-panel" data-step="1" hidden>
        <div class="panel-heading">${eyebrow('02 / YOUR DATE')}<h2>A day just for you.</h2><p>Choose a date to ask the studio’s live availability service.</p></div>
        <label class="field-label" for="appointment-date">Appointment date</label><input class="date-input" id="appointment-date" name="date" type="date" required>
        <p class="fine-print">The booking system determines business hours, blocked dates, booking windows, and occupied times.</p>
        <div class="panel-actions"><button class="button button-text prev-step" type="button">← Back</button><button class="button button-primary next-step" type="button">Check Times ${arrow}</button></div>
      </div>
      <div class="booking-panel" data-step="2" hidden>
        <div class="panel-heading">${eyebrow('03 / YOUR TIME')}<h2>Find your little window.</h2><p id="time-date-label">Choose a date to retrieve live availability</p></div>
        <fieldset><legend class="field-label">Available start times</legend><div class="time-grid" id="time-options" aria-live="polite"></div></fieldset>
        <p class="fine-print">These are real available start times returned by the studio system. Selecting one does not reserve it.</p>
        <div class="panel-actions"><button class="button button-text prev-step" type="button">← Back</button><button class="button button-primary next-step" type="button">Your Details ${arrow}</button></div>
      </div>
      <div class="booking-panel" data-step="3" hidden>
        <div class="panel-heading">${eyebrow('04 / A LITTLE ABOUT YOU')}<h2>Let’s get acquainted.</h2><p>Share the details the studio should use to follow up on your request.</p></div>
        <div class="form-grid"><label>First name<input name="firstName" autocomplete="given-name" maxlength="60" required></label><label>Last name<input name="lastName" autocomplete="family-name" maxlength="60" required></label><label>Email address<input name="email" type="email" autocomplete="email" maxlength="120" required></label><label>Phone number <span class="optional-label">Optional</span><input name="phone" type="tel" autocomplete="tel" pattern="[+0-9() .-]{7,25}"></label></div>
        <label class="full-field">Anything you’d like me to know?<textarea name="notes" rows="4" maxlength="2000" placeholder="Your hair goals, recent color or treatments, and any access needs…"></textarea></label>
        <p class="fine-print">Your details are sent securely to the salon booking service when you submit.</p>
        <div class="panel-actions"><button class="button button-text prev-step" type="button">← Back</button><button class="button button-primary next-step" type="button">Review Your Visit ${arrow}</button></div>
      </div>
      <div class="booking-panel" data-step="4" hidden>
        <div class="panel-heading">${eyebrow('05 / REVIEW')}<h2>Your visit at a glance.</h2><p>Review your selections. Prices and durations are estimates only.</p></div>
        <div class="booking-policy"><h3>Request first. Approval follows.</h3><p>When submissions open, your request will be marked Pending Approval. Your appointment will not be confirmed until Gladys reviews and approves it.</p></div>
        <div id="booking-recovery" class="booking-recovery" hidden><strong>Unresolved request found</strong><p id="booking-recovery-message"></p><button id="discard-pending" class="button button-text" type="button">Resolve by starting over</button></div>
        <div class="panel-actions"><button class="button button-text prev-step" type="button">← Back</button><button id="submit-booking" class="button button-primary" type="submit"${bookingLaunch.submissionsEnabled ? '' : ' disabled'}>${bookingLaunch.submissionsEnabled ? 'Submit Request' : 'Submissions Paused'} ${arrow}</button></div>
        <p class="submission-note" id="submission-launch-note">${bookingLaunch.submissionsEnabled ? 'Submitting a request does not confirm an appointment.' : 'Final submission is disabled during the controlled integration review.'}</p>
      </div>
      <p id="booking-error" class="form-error" role="alert"></p>
    </form>
    <section id="booking-success" class="booking-confirmation" hidden aria-live="polite"><div class="confirmation-symbol" aria-hidden="true">✓</div><p class="eyebrow">REQUEST RECEIVED</p><h2>Request Received — Pending Approval</h2><p>Your request was received by the salon and is waiting for manual review. This is not a confirmed appointment.</p><div id="confirmation-details"></div><a class="button button-outline" href="./index.html">Return Home ${arrow}</a></section>
  </div>
  <aside class="booking-summary" aria-label="Booking estimate"><div class="summary-top"><span class="eyebrow">YOUR VISIT, ESTIMATED</span><h2>A visit with Gladys</h2></div><dl><div><dt>Services</dt><dd id="summary-service">Choose one or more services</dd></div><div><dt>Hair length</dt><dd id="summary-length">Choose your hair length</dd></div><div><dt>Date</dt><dd id="summary-date">A day for you</dd></div><div><dt>Time</dt><dd id="summary-time">Choose an available time</dd></div><div><dt>Estimated duration</dt><dd id="summary-duration">—</dd></div></dl><div class="summary-total"><span>Estimated total</span><strong id="summary-price">—</strong></div><p class="fine-print">All prices and durations shown here are estimates. The booking service calculates the authoritative estimates.</p><div class="summary-personal"><span aria-hidden="true">✳</span><p>Requests remain Pending Approval<br>until manually approved.</p></div></aside>
  </div>
</section>`; }
