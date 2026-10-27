import { services, bookingLaunch } from './data.mjs';
import { formatDurationRange } from './duration.mjs';
import {
  bookingProvider,
  formatDate,
  PendingSubmissionStore,
  sameBookingDraft,
  SingleFlight,
  slotLabel,
  UNCERTAIN_MESSAGE,
} from './booking-provider.mjs';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function retainedAvailableTime(selectedTime, availableTimes) {
  return availableTimes.some(slot => slot.value === selectedTime) ? selectedTime : '';
}

export class LatestAvailabilityRequest {
  constructor() { this.sequence = 0; }
  begin() { this.sequence += 1; return this.sequence; }
  isCurrent(sequence) { return sequence === this.sequence; }
  invalidate() { this.sequence += 1; }
}

export function initBooking() {
  const form = $('#booking-form');
  if (!form) return;

  form.noValidate = true;
  const panels = $$('[data-step]', form);
  const dateInput = $('#appointment-date');
  const timeOptions = $('#time-options');
  const errorMessage = $('#booking-error');
  const progress = $('.booking-progress');
  const submitButton = $('#submit-booking');
  const detailsButton = $('#continue-to-details');
  const recovery = $('#booking-recovery');
  const recoveryMessage = $('#booking-recovery-message');
  const loadingOverlay = $('#booking-loading-overlay');
  const bookingLayout = $('.booking-layout');
  const pendingStore = new PendingSubmissionStore(sessionStorage);
  const submissionGate = new SingleFlight();
  const availabilityRequests = new LatestAvailabilityRequest();
  const submissionsEnabled = bookingLaunch.submissionsEnabled === true;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const disabledStates = new Map();
  let step = 0;
  let availabilityLoading = false;
  let availabilityReady = false;
  let submissionPending = false;
  let availableTimesForDate = [];

  const today = new Date();
  dateInput.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const field = name => form.elements.namedItem(name);
  const value = name => field(name)?.value || '';
  const selectedServiceIds = () => $$('input[name="services"]:checked', form).map(input => input.value);
  const selectedServices = () => selectedServiceIds().map(id => services.find(service => service.id === id)).filter(Boolean);
  const formatMoney = amount => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);

  function draft() {
    return {
      name: `${value('firstName').trim()} ${value('lastName').trim()}`.trim(),
      email: value('email'),
      phone: value('phone'),
      services: selectedServiceIds(),
      hairLength: value('hairLength'),
      date: dateInput.value,
      time: value('time'),
      notes: value('notes'),
    };
  }

  function estimates() {
    const length = value('hairLength');
    return selectedServices().reduce((total, service) => {
      const duration = service.durations?.[length] || [0, 0];
      total.price += service.prices?.[length] || 0;
      total.min += duration[0];
      total.max += duration[1];
      return total;
    }, { price: 0, min: 0, max: 0 });
  }

  function summary() {
    const selected = selectedServices();
    const length = value('hairLength');
    const total = estimates();
    const serviceNames = selected.map(service => service.name);
    const lengthLabel = length ? `${length[0].toUpperCase()}${length.slice(1)}` : '';
    const durationLabel = selected.length && length ? formatDurationRange([total.min, total.max]) : '—';
    const priceLabel = selected.length && length ? formatMoney(total.price) : '—';
    $('#summary-service').textContent = serviceNames.join(', ') || 'Choose one or more services';
    $('#summary-length').textContent = lengthLabel || 'Choose your hair length';
    $('#summary-date').textContent = dateInput.value ? formatDate(dateInput.value) : 'A day for you';
    $('#summary-time').textContent = slotLabel(value('time')) || 'Choose an available time';
    $('#summary-duration').textContent = durationLabel;
    $('#summary-price').textContent = priceLabel;
    const reviewServices = $('#review-services');
    reviewServices.replaceChildren();
    if (serviceNames.length) {
      const list = document.createElement('ul');
      list.className = 'review-service-list';
      for (const name of serviceNames) {
        const item = document.createElement('li');
        item.textContent = name;
        list.append(item);
      }
      reviewServices.append(list);
    } else {
      reviewServices.textContent = '—';
    }
    $('#review-length').textContent = lengthLabel || '—';
    $('#review-duration').textContent = durationLabel;
    $('#review-price').textContent = priceLabel;
    for (const duration of $$('.booking-service-duration', form)) {
      const key = length ? `duration${length[0].toUpperCase()}${length.slice(1)}` : '';
      duration.textContent = length ? `Estimated duration: ${duration.dataset[key]}` : 'Estimated duration';
    }
  }

  function hasLatestTime() {
    return availabilityReady && availableTimesForDate.some(slot => slot.value === value('time'));
  }

  function syncDetailsButton() {
    detailsButton.disabled = availabilityLoading || !dateInput.value || !hasLatestTime();
    $('#time-selection-help').textContent = availabilityLoading
      ? 'Checking available appointment times…'
      : hasLatestTime() ? 'An available appointment time is selected.' : 'Choose an available time to continue.';
  }

  function clearTimes({ invalidate = false } = {}) {
    if (invalidate) availabilityRequests.invalidate();
    availabilityLoading = false;
    availabilityReady = false;
    availableTimesForDate = [];
    timeOptions.replaceChildren();
    timeOptions.removeAttribute('aria-busy');
    syncDetailsButton();
  }

  function showAvailabilityLoading() {
    timeOptions.replaceChildren();
    timeOptions.setAttribute('aria-busy', 'true');
    const loading = document.createElement('div');
    loading.className = 'availability-loading';
    loading.setAttribute('role', 'status');
    const spinner = document.createElement('span');
    spinner.className = 'booking-spinner';
    spinner.setAttribute('aria-hidden', 'true');
    const message = document.createElement('strong');
    message.textContent = 'Checking available appointment times...';
    loading.append(spinner, message);
    timeOptions.append(loading);
  }

  function renderTimeChoices(times, selectedValue = '') {
    availableTimesForDate = times;
    timeOptions.replaceChildren();
    const retainedTime = retainedAvailableTime(selectedValue, times);
    for (const time of times) {
      const label = document.createElement('label');
      label.className = 'time-option';
      const radio = document.createElement('input');
      Object.assign(radio, { type: 'radio', name: 'time', value: time.value, required: true, checked: time.value === retainedTime });
      const span = document.createElement('span');
      span.textContent = time.label;
      label.append(radio, span);
      timeOptions.append(label);
    }
    if (!times.length) {
      const message = document.createElement('p');
      message.className = 'availability-status';
      message.textContent = 'No appointments are available on this date. Please select another day.';
      timeOptions.append(message);
    }
    syncDetailsButton();
  }

  async function renderTimes() {
    const date = dateInput.value;
    const ids = selectedServiceIds();
    const length = value('hairLength');
    if (!date || !ids.length || !length) {
      clearTimes({ invalidate: true });
      summary();
      return [];
    }
    const request = availabilityRequests.begin();
    const selectedTime = value('time');
    availabilityLoading = true;
    availabilityReady = false;
    availableTimesForDate = [];
    showAvailabilityLoading();
    syncDetailsButton();
    try {
      const times = await bookingProvider.getAvailableTimes(date, ids, length);
      if (!availabilityRequests.isCurrent(request)) return [];
      availabilityLoading = false;
      availabilityReady = true;
      renderTimeChoices(times, selectedTime);
      $('#time-date-label').textContent = `Live availability for ${formatDate(date)}`;
      summary();
      return times;
    } catch (error) {
      if (!availabilityRequests.isCurrent(request)) return [];
      availabilityLoading = false;
      availabilityReady = false;
      availableTimesForDate = [];
      timeOptions.replaceChildren();
      const message = document.createElement('p');
      message.className = 'availability-status availability-error';
      message.textContent = error.message;
      timeOptions.append(message);
      syncDetailsButton();
      return [];
    } finally {
      if (availabilityRequests.isCurrent(request)) timeOptions.removeAttribute('aria-busy');
    }
  }

  function showStep(next, focus = true) {
    step = next;
    panels.forEach((panel, index) => { panel.hidden = index !== step; });
    $$('[data-progress]').forEach((item, index) => {
      if (index === step) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
      item.classList.toggle('completed', index < step);
    });
    errorMessage.textContent = '';
    summary();
    syncDetailsButton();
    if (focus) {
      const heading = $('h2', panels[step]);
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      progress.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
    }
  }

  function validServices() {
    const selected = selectedServices();
    if (!selected.length) return 'Choose at least one service to continue.';
    if (!selected.some(service => !service.addOn)) return 'Ampoule and Hair Mask Treatments are add-ons. Please choose at least one regular service.';
    return '';
  }

  function checkCurrent() {
    errorMessage.textContent = '';
    if (step === 0) {
      if (!value('hairLength')) {
        errorMessage.textContent = 'Choose your hair length to continue.';
        $('input[name="hairLength"]', panels[0])?.focus();
        return false;
      }
      const serviceError = validServices();
      if (serviceError) { errorMessage.textContent = serviceError; $('input[name="services"]', panels[0])?.focus(); return false; }
    }
    if (step === 2) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput.value)) {
        errorMessage.textContent = 'Please choose an appointment date.'; dateInput.focus(); return false;
      }
      if (availabilityLoading) { errorMessage.textContent = 'Please wait while appointment times are checked.'; return false; }
      if (!hasLatestTime()) { errorMessage.textContent = 'Please choose a time returned by the latest availability check.'; $('input[name="time"]', panels[2])?.focus(); return false; }
    }
    return true;
  }

  function validateSubmission() {
    const serviceError = validServices();
    const email = value('email').trim();
    const phone = value('phone').trim();
    if (serviceError || !value('hairLength') || !dateInput.value || !hasLatestTime() || !value('firstName').trim() || !value('lastName').trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorMessage.textContent = serviceError || 'Please complete every required booking field with valid details before submitting.';
      return false;
    }
    if (phone && !/^[+0-9() .-]{7,25}$/.test(phone)) {
      errorMessage.textContent = 'Please enter a valid phone number or leave it blank.';
      return false;
    }
    return true;
  }

  function beforeUnload(event) {
    if (!submissionPending) return;
    event.preventDefault();
    event.returnValue = '';
  }

  function blockEscape(event) {
    if (submissionPending && event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function setSubmissionLoading(active) {
    submissionPending = active;
    loadingOverlay.hidden = !active;
    bookingLayout.setAttribute('aria-busy', String(active));
    if (active) {
      disabledStates.clear();
      for (const control of $$('button, input, textarea, select', form)) {
        disabledStates.set(control, control.disabled);
        control.disabled = true;
      }
      window.addEventListener('beforeunload', beforeUnload);
      document.addEventListener('keydown', blockEscape, true);
    } else {
      for (const [control, wasDisabled] of disabledStates) control.disabled = wasDisabled;
      disabledStates.clear();
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('keydown', blockEscape, true);
      syncDetailsButton();
      if (!submissionsEnabled) submitButton.disabled = true;
    }
  }

  async function nextStep() {
    if (!checkCurrent()) return;
    showStep(Math.min(3, step + 1));
    if (step === 2 && dateInput.value && !availabilityReady && !availabilityLoading) void renderTimes();
  }

  function showRecovery(message = UNCERTAIN_MESSAGE) {
    recovery.hidden = false;
    recoveryMessage.textContent = message;
    submitButton.textContent = submissionsEnabled ? 'Retry Same Request ↗' : 'Submissions Paused ↗';
    if (!submissionsEnabled) submitButton.disabled = true;
  }

  function updatePendingWarning() {
    const pending = pendingStore.get();
    if (!pending) return;
    if (sameBookingDraft(pending.payload, draft())) showRecovery();
    else showRecovery('The booking details now differ from the unresolved request, which may already exist. Restore the original details and retry the same request, or contact the salon before making a different request.');
  }

  function restorePending() {
    const pending = pendingStore.get();
    if (!pending) return false;
    const payload = pending.payload;
    const [firstName, ...lastName] = payload.name.split(' ');
    field('firstName').value = firstName || '';
    field('lastName').value = lastName.join(' ');
    field('email').value = payload.email;
    field('phone').value = payload.phone;
    field('notes').value = payload.notes;
    dateInput.value = payload.date;
    for (const input of $$('input[name="services"]', form)) input.checked = payload.services.includes(input.value);
    const length = $$('input[name="hairLength"]', form).find(input => input.value === payload.hairLength);
    if (length) length.checked = true;
    availabilityReady = true;
    renderTimeChoices([{ value: payload.time, label: slotLabel(payload.time) }], payload.time);
    $('#time-date-label').textContent = `Previously selected time for ${formatDate(payload.date)}`;
    showStep(3, false);
    showRecovery();
    return true;
  }

  function showSuccess(result) {
    progress.hidden = true;
    form.hidden = true;
    $('.booking-summary').hidden = true;
    const success = $('#booking-success');
    const details = $('#confirmation-details');
    details.replaceChildren();
    const bookingId = document.createElement('strong');
    bookingId.textContent = `Booking ID: ${result.bookingId}`;
    details.append(bookingId, document.createElement('br'), 'Status: Pending Approval');
    if (Number.isFinite(result.estimatedDurationMin) && Number.isFinite(result.estimatedDurationMax)) {
      details.append(document.createElement('br'), `Estimated duration: ${formatDurationRange([result.estimatedDurationMin, result.estimatedDurationMax])}`);
    }
    if (Number.isFinite(result.estimatedPrice)) details.append(document.createElement('br'), `Estimated price: ${formatMoney(result.estimatedPrice)}`);
    if (result.duplicate) {
      const duplicateNote = document.createElement('p');
      duplicateNote.textContent = 'This was a safe recovery of your earlier request; no second booking was created.';
      details.append(duplicateNote);
    }
    success.hidden = false;
    success.querySelector('h2').focus();
  }

  async function submit() {
    if (!submissionsEnabled) {
      submitButton.disabled = true;
      errorMessage.textContent = 'Final submission is temporarily disabled during the controlled integration review.';
      return;
    }
    await submissionGate.run(async () => {
      setSubmissionLoading(true);
      errorMessage.textContent = '';
      let payload;
      try {
        if (!validateSubmission()) return;
        const currentDraft = draft();
        const pending = pendingStore.get();
        let retry = false;
        if (pending) {
          if (!sameBookingDraft(pending.payload, currentDraft)) {
            showRecovery('The previous request may already exist. Your edited details cannot use its request ID. Restore the original request and retry it, or contact the salon before making a different request.');
            errorMessage.textContent = 'Restore the original request before retrying; do not submit a different request until you have checked with the salon.';
            return;
          }
          payload = pending.payload;
          retry = true;
        } else {
          const times = await renderTimes();
          if (!times.some(slot => slot.value === currentDraft.time)) {
            showStep(2);
            errorMessage.textContent = 'That time is no longer available. Please choose another time.';
            return;
          }
          ({ payload } = pendingStore.begin(currentDraft));
        }
        errorMessage.textContent = retry ? 'Retrying the same request…' : 'Sending your request…';
        const result = await bookingProvider.submitBooking(payload);
        pendingStore.clear();
        showSuccess(result);
      } catch (error) {
        if (error.uncertain && payload) {
          pendingStore.markUncertain(payload);
          showRecovery();
          errorMessage.textContent = UNCERTAIN_MESSAGE;
        } else {
          if (error.definitive) pendingStore.clear();
          errorMessage.textContent = error.message;
        }
      } finally {
        setSubmissionLoading(false);
      }
    });
  }

  $$('.next-step', form).forEach(button => button.addEventListener('click', () => { void nextStep(); }));
  $$('.prev-step', form).forEach(button => button.addEventListener('click', () => showStep(Math.max(0, step - 1))));
  form.addEventListener('input', updatePendingWarning);
  form.addEventListener('change', event => {
    errorMessage.textContent = '';
    summary();
    updatePendingWarning();
    if (event.target.name === 'time') syncDetailsButton();
    if (['date', 'services', 'hairLength'].includes(event.target.name)) void renderTimes();
  });
  form.addEventListener('submit', event => { event.preventDefault(); void submit(); });
  // An uncertain submission may already have created a booking. Never erase its
  // idempotency key simply because the customer wants to change the form.
  // Restore the original request so the same request ID can be safely retried.
  $('#discard-pending').addEventListener('click', () => {
    restorePending();
    errorMessage.textContent = 'Your original request has been restored. Retry this same request to check its outcome, or contact the salon before making a different request.';
  });

  const requested = new URLSearchParams(location.search).get('service');
  const selectedInput = $$('input[name="services"]', form).find(input => input.value === requested);
  if (selectedInput) selectedInput.checked = true;
  if (!restorePending()) showStep(0, false);
  if (!submissionsEnabled) submitButton.disabled = true;
}
