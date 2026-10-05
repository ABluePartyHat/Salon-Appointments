import { portfolio, services, business } from './data.mjs';
import { bookingProvider, formatDate } from './booking-provider.mjs';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Mobile menu: native links retain normal browser navigation and history.
const toggle = $('.menu-toggle');
const menu = $('#mobile-nav');
function closeMenu(returnFocus = false) {
  menu.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open navigation');
  if (returnFocus) toggle.focus();
}
toggle?.addEventListener('click', () => {
  const opening = menu.hidden;
  menu.hidden = !opening;
  toggle.setAttribute('aria-expanded', String(opening));
  toggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !menu.hidden) closeMenu(true);
});
document.addEventListener('click', event => {
  if (!menu.hidden && !event.target.closest('.nav')) closeMenu();
});
document.addEventListener('focusin', event => {
  if (!menu.hidden && !event.target.closest('.nav')) closeMenu();
});
matchMedia('(min-width: 1001px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

// Filters and native modal dialog support pointer and keyboard interaction.
let visiblePortfolio = [...portfolio];
$$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  $$('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  const category = button.dataset.filter;
  visiblePortfolio = portfolio.filter(p => category === 'All' || p.categories.includes(category));
  $$('.gallery-grid [data-lightbox]').forEach(card => { card.hidden = !visiblePortfolio.some(p => p.id === card.dataset.lightbox); });
  $('#gallery-status').textContent = `${visiblePortfolio.length} ${visiblePortfolio.length === 1 ? 'look' : 'looks'}${category === 'All' ? '' : ` in ${category}`}`;
}));
const dialog = $('.lightbox');
if (dialog) {
  let current = 0;
  let opener;
  function displayPhoto() {
    const item = visiblePortfolio[current];
    $('#lightbox-image').src = /^https?:\/\//.test(item.image) ? `${item.image}&w=1500&q=85` : item.image;
    $('#lightbox-image').alt = item.alt;
    $('#lightbox-title').textContent = item.title;
    $('#lightbox-category').textContent = `${item.categories.join(' · ')} · ${current + 1} / ${visiblePortfolio.length}`;
    $('.lightbox-prev').disabled = visiblePortfolio.length <= 1;
    $('.lightbox-next').disabled = visiblePortfolio.length <= 1;
  }
  const move = delta => { current = (current + delta + visiblePortfolio.length) % visiblePortfolio.length; displayPhoto(); };
  $$('[data-lightbox]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    current = visiblePortfolio.findIndex(p => p.id === button.dataset.lightbox);
    if (current < 0) return;
    displayPhoto();
    dialog.showModal();
    document.body.classList.add('modal-open');
    $('.lightbox-close').focus();
  }));
  $('.lightbox-close').addEventListener('click', () => dialog.close());
  $('.lightbox-prev').addEventListener('click', () => move(-1));
  $('.lightbox-next').addEventListener('click', () => move(1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); opener?.focus(); });
}
$('.comparison-range')?.addEventListener('input', event => {
  event.target.closest('.comparison').style.setProperty('--split', `${event.target.value}%`);
  event.target.setAttribute('aria-valuetext', `${event.target.value} percent before image`);
});
$('[data-directions]')?.addEventListener('click', () => {
  if (business.locationConfirmed) {
    location.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.address}, ${business.locality}, ${business.region} ${business.postalCode}`)}`;
  } else {
    $('#directions-status').textContent = 'The studio address is not confirmed yet. Directions will be available here before live booking opens.';
  }
});

const form = $('#booking-form');
if (form) {
  form.noValidate = true;
  const demoNote = $('.booking-demo-note', form.parentElement);
  if (demoNote) demoNote.querySelector('p').textContent = 'Live availability is checked securely against the studio calendar. No Google Calendar interface or private event details are shown.';
  $('.preview-pill', form)?.replaceChildren(document.createTextNode('LIVE BOOKING · PAYMENT NOT COLLECTED'));
  $('[data-step="4"] h2', form).textContent = 'Something to look forward to.';
  const panels = $$('[data-step]', form);
  const dateInput = $('#appointment-date');
  $('.fine-print', panels[1]).textContent = 'Appointments are available Wednesday–Friday, 9:00 AM–6:00 PM, and Saturday, 8:00 AM–6:00 PM.';
  const errorMessage = $('#booking-error');
  const progress = $('.booking-progress');
  const confirmButton = $('[type=submit]', form);
  let step = 0;
  let submitting = false;
  let loadingAvailability = false;
  let availableTimesForDate = [];
  let bookingId = crypto.randomUUID();
  const today = new Date();
  dateInput.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  dateInput.addEventListener('change', () => {
    if (!dateInput.value) return;
    const weekday = new Date(`${dateInput.value}T12:00:00`).getDay();
    if (![3, 4, 5, 6].includes(weekday)) {
      dateInput.value = '';
      errorMessage.textContent = 'Appointments are available Wednesday through Saturday. Please choose another date.';
      dateInput.focus();
    }
  });
  const field = name => form.elements.namedItem(name);
  const value = name => field(name)?.value || '';
  function snapshot() {
    return {
      service: value('service'), date: value('date'), time: value('time'),
      firstName: value('firstName').trim(), lastName: value('lastName').trim(),
      email: value('email').trim(), phone: value('phone').trim(), notes: value('notes').trim(),
      firstVisit: field('firstVisit').checked, emailReminder: field('emailReminder').checked,
      smsReminder: field('smsReminder').checked, policy: field('policy').checked,
      bookingId,
    };
  }
  function summary() {
    const service = services.find(s => s.id === value('service'));
    $('#summary-service').textContent = service?.name || 'Choose your service';
    $('#summary-date').textContent = dateInput.value ? formatDate(dateInput.value) : 'A day for you';
    $('#summary-time').textContent = value('time') || 'Your perfect moment';
    $('#summary-duration').textContent = service?.duration || '—';
    $('#summary-price').textContent = service ? `$${service.price}` : '—';
  }
  async function renderTimes() {
    const times = await bookingProvider.getAvailableTimes(value('service'), dateInput.value);
    availableTimesForDate = times;
    const container = $('#time-options');
    container.replaceChildren();
    for (const time of times) {
      const label = document.createElement('label'); label.className = 'time-option';
      const radio = document.createElement('input'); Object.assign(radio, { type: 'radio', name: 'time', value: time, required: true });
      const span = document.createElement('span'); span.textContent = time;
      label.append(radio, span); container.append(label);
    }
    if (!times.length) { const p = document.createElement('p'); p.textContent = 'No appointments are available on this date. Please select another day.'; container.append(p); }
    $('#time-date-label').textContent = dateInput.value ? formatDate(dateInput.value) : 'Sample appointment times';
    summary();
  }
  function showStep(next, focus = true) {
    step = next;
    panels.forEach((panel, i) => { panel.hidden = i !== step; });
    $$('[data-progress]').forEach((item, i) => {
      if (i === step) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
      item.classList.toggle('completed', i < step);
    });
    errorMessage.textContent = '';
    summary();
    if (focus) {
      const heading = $('h2', panels[step]); heading.tabIndex = -1; heading.focus({ preventScroll: true });
      progress.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
    }
  }
  async function checkCurrent() {
    errorMessage.textContent = '';
    if (step === 0 && !value('service')) { errorMessage.textContent = 'Choose a service to continue.'; $('input', panels[0]).focus(); return false; }
    if (step === 1 && !/^\d{4}-\d{2}-\d{2}$/.test(dateInput.value)) { errorMessage.textContent = 'Please choose an appointment date.'; dateInput.focus(); return false; }
    if (step === 2 && !availableTimesForDate.includes(value('time'))) {
      errorMessage.textContent = 'Please choose an available time.'; $('input', panels[2])?.focus(); return false;
    }
    if (step === 3) {
      for (const input of $$('input[required]', panels[3])) {
        input.value = input.value.trim();
        if (!input.checkValidity() || !input.value) { input.reportValidity(); input.focus(); errorMessage.textContent = 'Please complete your contact details.'; return false; }
      }
    }
    return true;
  }
  async function nextStep() {
    if (loadingAvailability) return;
    if (!(await checkCurrent())) return;
    if (step === 1) {
      loadingAvailability = true;
      errorMessage.textContent = 'Checking availability…';
      try { await renderTimes(); } catch (error) { errorMessage.textContent = error.message; return; } finally { loadingAvailability = false; }
    }
    showStep(Math.min(4, step + 1));
  }
  $$('.next-step', form).forEach(button => button.addEventListener('click', () => { void nextStep(); }));
  $$('.prev-step', form).forEach(button => button.addEventListener('click', () => showStep(Math.max(0, step - 1))));
  form.addEventListener('change', event => {
    if (event.target.name === 'service' || event.target.name === 'date') {
      $('#time-options').replaceChildren();
      availableTimesForDate = [];
      field('policy').checked = false;
    }
    errorMessage.textContent = '';
    summary();
  });
  const requested = new URLSearchParams(location.search).get('service');
  const selected = requested === 'extensions' ? 'consultation' : requested;
  const selectedInput = $$('input[name=service]', form).find(input => input.value === selected);
  if (selectedInput) selectedInput.checked = true;
  showStep(selectedInput ? 1 : 0, false);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (step < 4) { void nextStep(); return; }
    if (submitting) return;
    const booking = snapshot();
    if (!booking.policy) { errorMessage.textContent = 'Please acknowledge the booking policies.'; field('policy').focus(); return; }
    submitting = true; confirmButton.disabled = true;
    try {
      await bookingProvider.confirm(booking);
      $('#confirmation-message').textContent = `Thank you, ${booking.firstName}. Your appointment is confirmed.`;
      const service = services.find(s => s.id === booking.service);
      $('#confirmation-details').textContent = `${service.name} · ${formatDate(booking.date)} · ${booking.time} · Starting at $${service.price}`;
      form.hidden = true; progress.hidden = true;
      const confirmation = $('#booking-confirmation'); confirmation.hidden = false; confirmation.focus();
      confirmation.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'center' });
    } catch (error) {
      if (error.code === 'SLOT_UNAVAILABLE') {
        try { await renderTimes(); } catch { availableTimesForDate = []; }
        showStep(2);
        errorMessage.textContent = error.message || 'That appointment time is no longer available. Please select another time.';
      } else errorMessage.textContent = error.message || 'Something went wrong. Please try again.';
    }
    finally { submitting = false; confirmButton.disabled = false; }
  });
  $('#restart-booking').addEventListener('click', () => {
    form.reset(); $('#time-options').replaceChildren(); availableTimesForDate = []; bookingId = crypto.randomUUID(); $('#booking-confirmation').hidden = true;
    $('#confirmation-message').textContent = ''; $('#confirmation-details').textContent = '';
    form.hidden = false; progress.hidden = false; dateInput.value = ''; showStep(0);
  });
}
