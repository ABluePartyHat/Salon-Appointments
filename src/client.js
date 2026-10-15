import { portfolio, services, business } from './data.mjs';
import { initBooking } from './booking-ui.js';

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

initBooking();
