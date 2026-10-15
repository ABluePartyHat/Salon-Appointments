export { initBooking } from './booking-flow.js';
import { services } from './data.mjs';
import { bookingProvider, formatDate } from './booking-provider.mjs';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function initBookingLegacy() {
  const form = $('#booking-form');
  if (!form) return;

  form.noValidate = true;
  const panels = $$('[data-step]', form);
  const dateInput = $('#appointment-date');
  const timeOptions = $('#time-options');
  const errorMessage = $('#booking-error');
  const progress = $('.booking-progress');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let step = 0;
  let loadingAvailability = false;
  let availableTimesForDate = [];

  const today = new Date();
  dateInput.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const field = name => form.elements.namedItem(name);
  const value = name => field(name)?.value || '';
  const selectedServices = () => $$('input[name="services"]:checked', form)
    .map(input => services.find(service => service.id === input.value))
    .filter(Boolean);
  const formatMoney = amount => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);

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
    const selectedTime = availableTimesForDate.find(slot => slot.value === value('time'));
    $('#summary-time').textContent = selectedTime?.label || 'Choose an available time';
    $('#summary-duration').textContent = selected.length && length ? `${total.min}–${total.max} min (estimate)` : '—';
    $('#summary-price').textContent = selected.length && length ? `${formatMoney(total.price)} estimate` : '—';
  }

  function clearTimes() {
    availableTimesForDate = [];
    timeOptions.replaceChildren();
    timeOptions.removeAttribute('aria-busy');
  }

  async function renderTimes() {
    clearTimes();
    timeOptions.setAttribute('aria-busy', 'true');
    const loading = document.createElement('p');
    loading.className = 'availability-status';
    loading.textContent = 'Checking real availability…';
    timeOptions.append(loading);
    try {
      const times = await bookingProvider.getAvailableTimes(dateInput.value);
      availableTimesForDate = times;
      timeOptions.replaceChildren();
      for (const time of times) {
        const label = document.createElement('label');
        label.className = 'time-option';
        const radio = document.createElement('input');
        Object.assign(radio, { type: 'radio', name: 'time', value: time.value, required: true });
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
      $('#time-date-label').textContent = `Live availability for ${formatDate(dateInput.value)}`;
      summary();
    } catch (error) {
      clearTimes();
      throw error;
    } finally {
      timeOptions.removeAttribute('aria-busy');
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

  function checkCurrent() {
    errorMessage.textContent = '';
    if (step === 0) {
      const selected = selectedServices();
      if (!selected.length) {
        errorMessage.textContent = 'Choose at least one service to continue.';
        $('input[name="services"]', panels[0])?.focus();
        return false;
      }
      if (!selected.some(service => !service.addOn)) {
        errorMessage.textContent = 'Ampoule and Hair Mask Treatments are add-ons. Please choose at least one regular service.';
        $('input[name="services"]', panels[0])?.focus();
        return false;
      }
      if (!value('hairLength')) {
        errorMessage.textContent = 'Choose your hair length to see estimates.';
        $('input[name="hairLength"]', panels[0])?.focus();
        return false;
      }
    }
    if (step === 1 && !/^\d{4}-\d{2}-\d{2}$/.test(dateInput.value)) {
      errorMessage.textContent = 'Please choose an appointment date.';
      dateInput.focus();
      return false;
    }
    if (step === 2 && !availableTimesForDate.some(slot => slot.value === value('time'))) {
      errorMessage.textContent = 'Please choose an available time.';
      $('input', panels[2])?.focus();
      return false;
    }
    if (step === 3) {
      for (const input of $$('input[required]', panels[3])) {
        input.value = input.value.trim();
        if (!input.checkValidity() || !input.value) {
          input.reportValidity();
          input.focus();
          errorMessage.textContent = 'Please complete your contact details.';
          return false;
        }
      }
    }
    return true;
  }

  async function nextStep(button) {
    if (loadingAvailability || !checkCurrent()) return;
    if (step === 1) {
      loadingAvailability = true;
      button.disabled = true;
      errorMessage.textContent = 'Checking real availability…';
      try {
        await renderTimes();
      } catch (error) {
        errorMessage.textContent = error.message;
        return;
      } finally {
        loadingAvailability = false;
        button.disabled = false;
      }
    }
    showStep(Math.min(4, step + 1));
  }

  $$('.next-step', form).forEach(button => button.addEventListener('click', () => { void nextStep(button); }));
  $$('.prev-step', form).forEach(button => button.addEventListener('click', () => showStep(Math.max(0, step - 1))));
  form.addEventListener('change', event => {
    if (event.target.name === 'date') clearTimes();
    errorMessage.textContent = '';
    summary();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    errorMessage.textContent = 'Please use the current booking request flow.';
  });

  const requested = new URLSearchParams(location.search).get('service');
  const selectedInput = $$('input[name="services"]', form).find(input => input.value === requested);
  if (selectedInput) selectedInput.checked = true;
  showStep(0, false);
}
