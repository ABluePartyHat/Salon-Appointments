# Gladys Cosmetology Studio

A complete seven-page, mobile-first portfolio and booking preview for Gladys Brito. Built on the existing HTML/CSS architecture with reusable JavaScript modules and a dependency-free static build. There is no browser Tailwind CDN or frontend framework runtime.

## Run locally

Requires Node.js 20 or later. No dependency installation is needed.

```sh
npm run dev
```

Open http://127.0.0.1:4173. After source changes, run `npm run build` and refresh. `npm start` serves an existing build. `npm test` checks booking rules and generated pages after building.

## Edit the site

- `src/data.mjs`: business information, service menu, portfolio images, reviews, FAQs, and page metadata.
- `src/components.mjs`: header, footer, CTAs, cards, FAQs, lightbox, and image markup.
- `src/pages.mjs`: Home, Services, Portfolio, About, New Clients, Contact, and Booking.
- `src/client.js`: accessible mobile navigation, portfolio filters, lightbox, comparison slider, booking interface.
- `src/booking-provider.mjs`: pure booking rules and the mock provider boundary.
- `styles.css`: shared brand palette, typography, layout, responsive styles, reduced-motion support.

`npm run build` renders complete HTML pages to the project root and `dist/`; edit the source modules instead of generated `.html` files. Publish `dist/` on any static host. Sites configuration lives in `.openai/hosting.json`.

## Booking integration

The preview steps are service → date → time → contact details → deposit and policy review → confirmation. Service CTAs preselect the matching service; extensions point to a consultation. Sample slots respect closed days, a 60-day window, and service duration before closing.

The demo never reserves a time, charges a card, submits contact details, persists personal information, or sends reminders. Data stays only in the page's memory. Confirmation is explicitly marked as a preview. Replace `bookingProvider.getAvailableTimes` and `bookingProvider.confirm` with a server-backed integration with Square, GlossGenius, Vagaro, Fresha, or Acuity. Adapt the availability caller to await live responses. Real reservations require server-side availability validation, payment handling, idempotency, error handling, confirmed time zone, and provider-controlled reminders. Keep secrets on the server. Alternatively, point shared booking links to a hosted provider's booking page.

## Before opening live booking

1. Replace inspiration photographs with Gladys's own portfolio, professional portrait, and genuine before/after pairs. The current slider is deliberately labeled as a same-photo visual demonstration.
2. Replace sample testimonials with verified client reviews and confirm professional training. No invented certification or rating appears in structured data.
3. Confirm prices, durations, hours, deposits, cancellation terms, adjustments, guests/children rules, and payment methods.
4. Supply the real address, phone, email, parking, and accessibility details. Set the corresponding confirmation flags in `business`, replace the map placeholder with the studio's map, and set the real website origin for metadata.
5. Connect the booking provider and replace preview disclosures only after testing live integration.

HairSalon JSON-LD intentionally omits unconfirmed address, contact information, sample offers, and review ratings. All pages have unique titles, descriptions, canonical URLs, semantic headings, and image alt text. The build creates a sitemap and robots.txt. Photography and Google Fonts currently load from external CDNs; self-host these assets if needed.

## Photography sources

The portfolio uses Gladys's supplied original client-work photographs from `assets/portfolio/`. Remaining non-portfolio placeholders are limited to the hero and stylist portrait:

- [Mathilde Langevin — brunette hair / hero](https://www.pexels.com/photo/back-view-of-woman-with-brown-hair-13543276/)
- Portrait placeholder retained from the original site's [Unsplash image](https://images.unsplash.com/photo-1487412720507-e7ab37603c6f).

## Live Google Calendar booking

The frontend now calls a separate backend at `/api`. It never calls Google APIs directly and receives only sanitized available time labels. The backend uses Google Calendar FreeBusy for availability and rechecks the selected slot immediately before inserting a Calendar event. The old Google Calendar booking-page link is not used; customers remain in the site's booking UI.

Google Calendar's supported API does not expose the rules configured for a Calendar Appointment Schedule. The public `calendar.app.google` page is therefore not queried or scraped. `BOOKING_SCHEDULE_JSON` is the one server-side source of truth and should mirror the Appointment Schedule manually. The deployable backend is in `api/` and is intended for Google Cloud Functions/Cloud Run. Set these backend environment variables:

- `GOOGLE_CALENDAR_ID` — the calendar to read and write.
- `BOOKING_SCHEDULE_JSON` — timezone, service durations, slot interval, before/after buffers, minimum notice, maximum booking window, closed weekdays, unavailable dates, weekly availability, and date-specific overrides. See `api/.env.example`. Weekly days use `0` for Sunday through `6` for Saturday. Each day may contain multiple `["HH:mm","HH:mm"]` windows. A date override replaces that day's weekly windows; an empty override closes the date.
- `ALLOWED_ORIGIN` — the exact website origin in production.
- `GOOGLE_SHEET_ID` and `GOOGLE_SHEET_RANGE` — optional; if configured, confirmed bookings are appended to the sheet after the Calendar event is created. A Sheets failure never retries or duplicates the Calendar event.

Google Cloud setup: enable Calendar API, Sheets API, and Firestore API; deploy the backend with a dedicated service account using Application Default Credentials; share the target Calendar with that service account with permission to see free/busy and create events; grant the service account access to the Sheet if Sheets sync is enabled; configure the static host's `/api` route or `bookingApiBaseUrl` to point to the backend; and deploy with HTTPS. Do not put service-account JSON, private keys, OAuth tokens, Calendar IDs intended to be private, or Sheets credentials in `src/` or `dist/`.

Firestore is used as a short-lived per-slot lock when `GOOGLE_CLOUD_PROJECT` is available, preventing duplicate concurrent bookings across backend instances. The backend also uses a deterministic booking ID/event ID so safe client retries return the existing confirmation instead of creating another event. Configure Firestore TTL cleanup for the `bookingLocks` collection if desired.
