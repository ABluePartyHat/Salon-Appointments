import { services, bookingLaunch } from './data.mjs';
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
  const recovery = $('#booking-recovery');
  const recoveryMessage = $('#booking-recovery-message');
  const pendingStore = new PendingSubmissionStore(sessionStorage);
  const submissionGate = new SingleFlight();
  const submissionsEnabled = bookingLaunch.submissionsEnabled === true;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let step = 0;
  let loadingAvailability = false;
  let availableTimesForDate = [];
  let availabilitySequence = 0;

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
    $('#summary-service').textContent = selected.length ? selected.map(service => service.name).join(', ') : 'Choose one or more services';
    $('#summary-length').textContent = length ? `${length[0].toUpperCase()}${length.slice(1)}` : 'Choose your hair length';
    $('#summary-date').textContent = dateInput.value ? formatDate(dateInput.value) : 'A day for you';
    $('#summary-time').textContent = slotLabel(value('time')) || 'Choose an available time';
    $('#summary-duration').textContent = selected.length && length ? `${total.min}–${total.max} min (estimate)` : '—';
    $('#summary-price').textContent = selected.length && length ? `${formatMoney(total.price)} estimate` : '—';
  }

  function clearTimes() {
    availableTimesForDate = [];
    timeOptions.replaceChildren();
    timeOptions.removeAttribute('aria-busy');
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
  }

  async function renderTimes({ quiet = false } = {}) {
    const date = dateInput.value;
    const ids = selectedServiceIds();
    const length = value('hairLength');
    if (!date || !ids.length || !length) { clearTimes(); summary(); return []; }
    const sequence = ++availabilitySequence;
    const selectedTime = value('time');
    clearTimes();
    timeOptions.setAttribute('aria-busy', 'true');
    const loading = document.createElement('p');
    loading.className = 'availability-status';
    loading.textContent = 'Checking real availability…';
    timeOptions.append(loading);
    try {
      const times = await bookingProvider.getAvailableTimes(date, ids, length);
      if (sequence !== availabilitySequence) return [];
      renderTimeChoices(times, selectedTime);
      $('#time-date-label').textContent = `Live availability for ${formatDate(date)}`;
      summary();
      return times;
    } catch (error) {
      if (sequence === availabilitySequence) {
        clearTimes();
        if (!quiet) throw error;
        errorMessage.textContent = error.message;
      }
      return [];
    } finally {
      if (sequence === availabilitySequence) timeOptions.removeAttribute('aria-busy');
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
      const serviceError = validServices();
      if (serviceError) { errorMessage.textContent = serviceError; $('input[name="services"]', panels[0])?.focus(); return false; }
      if (!value('hairLength')) { errorMessage.textContent = 'Choose your hair length to see estimates.'; $('input[name="hairLength"]', panels[0])?.focus(); return false; }
    }
    if (step === 1 && !/^\d{4}-\d{2}-\d{2}$/.test(dateInput.value)) {
      errorMessage.textContent = 'Please choose an appointment date.'; dateInput.focus(); return false;
    }
    if (step === 2 && !availableTimesForDate.some(slot => slot.value === value('time'))) {
      errorMessage.textContent = 'Please choose an available time.'; $('input', panels[2])?.focus(); return false;
    }
    if (step === 3) {
      for (const input of $$('input[required]', panels[3])) {
        input.value = input.value.trim();
        if (!input.checkValidity() || !input.value) {
          input.reportValidity(); input.focus(); errorMessage.textContent = 'Please complete your contact details.'; return false;
        }
      }
      const phone = field('phone');
      if (phone.value && !phone.checkValidity()) { phone.reportValidity(); phone.focus(); errorMessage.textContent = 'Please enter a valid phone number or leave it blank.'; return false; }
    }
    return true;
  }

  function validateSubmission() {
    const serviceError = validServices();
    if (serviceError || !value('hairLength') || !dateInput.value || !value('time') || !value('firstName').trim() || !value('lastName').trim() || !field('email').checkValidity()) {
      errorMessage.textContent = serviceError || 'Please complete every required booking field before submitting.';
      return false;
    }
    return true;
  }

  async function nextStep(button) {
    if (loadingAvailability || !checkCurrent()) return;
    if (step === 1) {
      loadingAvailability = true;
      button.disabled = true;
      errorMessage.textContent = 'Checking real availability…';
      try { await renderTimes(); } catch (error) { errorMessage.textContent = error.message; return; }
      finally { loadingAvailability = false; button.disabled = false; }
    }
    showStep(Math.min(4, step + 1));
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
    else showRecovery('The booking details now differ from the unresolved request, which may already exist. Retry the original request after restoring its details, or explicitly start over before submitting new details.');
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
    renderTimeChoices([{ value: payload.time, label: slotLabel(payload.time) }], payload.time);
    $('#time-date-label').textContent = `Previously selected time for ${formatDate(payload.date)}`;
    showStep(4, false);
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
    if (result.duplicate) {
      const duplicateNote = document.createElement('p');
      duplicateNote.textContent = 'This was a safe recovery of your earlier request; no second booking was created.';
      details.append(duplicateNote);
    }
    success.hidden = false;
    success.querySelector('h2').focus?.();
  }

  async function submit() {
    if (!submissionsEnabled) {
      submitButton.disabled = true;
      errorMessage.textContent = 'Final submission is temporarily disabled during the controlled integration review.';
      return;
    }
    await submissionGate.run(async () => {
      if (!validateSubmission()) return;
      submitButton.disabled = true;
      errorMessage.textContent = '';
      let payload;
      try {
        const currentDraft = draft();
        const pending = pendingStore.get();
        let retry = false;
        if (pending) {
          if (!sameBookingDraft(pending.payload, currentDraft)) {
            showRecovery('The previous request may already exist. Your edited details cannot use its request ID. Resolve that request before submitting a new one.');
            errorMessage.textContent = 'Resolve the unresolved request before submitting changed booking details.';
            return;
          }
          payload = pending.payload;
          retry = true;
        } else {
          errorMessage.textContent = 'Rechecking availability before submitting…';
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
        submitButton.disabled = false;
      }
    });
  }

  $$('.next-step', form).forEach(button => button.addEventListener('click', () => { void nextStep(button); }));
  $$('.prev-step', form).forEach(button => button.addEventListener('click', () => showStep(Math.max(0, step - 1))));
  form.addEventListener('input', updatePendingWarning);
  form.addEventListener('change', event => {
    errorMessage.textContent = '';
    summary();
    updatePendingWarning();
    if (['date', 'services', 'hairLength'].includes(event.target.name)) void renderTimes({ quiet: true });
  });
  form.addEventListener('submit', event => { event.preventDefault(); void submit(); });
  $('#discard-pending').addEventListener('click', () => {
    pendingStore.clear();
    recovery.hidden = true;
    submitButton.textContent = submissionsEnabled ? 'Submit Request ↗' : 'Submissions Paused ↗';
    submitButton.disabled = !submissionsEnabled;
    errorMessage.textContent = 'The saved retry was resolved locally. The earlier request may still have reached the salon; contact the salon before sending another if you are unsure.';
  });

  const requested = new URLSearchParams(location.search).get('service');
  const selectedInput = $$('input[name="services"]', form).find(input => input.value === requested);
  if (selectedInput) selectedInput.checked = true;
  if (!restorePending()) showStep(0, false);
  if (!submissionsEnabled) submitButton.disabled = true;
}
