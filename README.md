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
- `src/pages.mjs`: Home, Services, Portfolio, About, New Clients, and Contact page rendering.
- `src/booking-page.mjs`: the multi-step booking request interface.
- `src/client.js`: accessible mobile navigation, portfolio filters, lightbox, and comparison slider.
- `src/booking-ui.js` / `src/booking-flow.js`: browser entry point and booking, recovery, and submission UI state.
- `src/booking-provider.mjs`: validated Cloudflare Worker transport and session-backed idempotency helpers.
- `styles.css`: shared brand palette, typography, layout, responsive styles, reduced-motion support.

`npm run build` renders complete HTML pages to the project root and `dist/`; edit the source modules instead of generated `.html` files. Publish `dist/` on any static host. Sites configuration lives in `.openai/hosting.json`.

## Booking integration — Phase 3

The booking flow supports multiple service selections, one hair-length choice, live start-time availability, estimated price/duration totals, and Pending booking requests. It uses these public Worker endpoints:

```text
GET https://salon-booking-api.pino-raul2.workers.dev/api/availability?date=YYYY-MM-DD&services=ID,ID&hairLength=short|medium|long
POST https://salon-booking-api.pino-raul2.workers.dev/api/bookings
```

The Cloudflare Worker remains authoritative for availability, prices, durations, and reservations. The UI refetches availability whenever date, services, or hair length changes and rejects responses that do not match the expected contract.

Submission uses a browser-generated UUID and never sends frontend price or duration estimates. An unresolved network/5xx result is retained in `sessionStorage`; explicit retries reuse the identical payload and request ID, while edited details are blocked until the earlier request is explicitly resolved. Only a valid HTTP 200 response with a booking ID and `Pending` status is presented as received. Pending never means confirmed.

### Temporary submission gate

Public form submission is disabled in source while the live integration is reviewed. Services, estimates, hair-length selection, and availability remain usable. The gate does not read browser storage or URL parameters.

After a successful controlled test and explicit approval, change `bookingLaunch.submissionsEnabled` in `src/data.mjs` from `false` to `true`, then run `npm run build` and `npm test` before publishing. This client-side gate is a release control, not a security boundary: the public Worker endpoint can still be called directly unless equivalent server-side restrictions are configured.

### Local-only booking test

The committed production gate stays `false`. To create a separate, ignored test artifact that uses the real booking UI and Worker transport:

```sh
npm run test:local-booking
npm run start:local-booking-test
```

The start command regenerates the local artifact from the latest source, then keeps a server running at `http://127.0.0.1:4174/book.html` until you press Ctrl+C. The page is labeled **LOCAL DEVELOPMENT TEST** and is served only on loopback with `no-store` and `noindex` headers. Its copied `data.mjs` enables submission without modifying production source, root HTML, or `dist/`. If port 4174 is already occupied or the local build fails, startup exits with a clear error instead of serving stale files.

First use the form only through the availability step to verify that the real browser origin is accepted. Do not submit unless the booking is explicitly intended as a live, clearly labeled test. No build step or automated test sends a booking request.

## Before opening live booking

1. Replace inspiration photographs with Gladys's own portfolio, professional portrait, and genuine before/after pairs. The current slider is deliberately labeled as a same-photo visual demonstration.
2. Replace sample testimonials with verified client reviews and confirm professional training. No invented certification or rating appears in structured data.
3. Confirm prices, durations, hours, deposits, cancellation terms, adjustments, guests/children rules, and payment methods.
4. Supply the real address, phone, email, parking, and accessibility details. Set the corresponding confirmation flags in `business`, replace the map placeholder with the studio's map, and set the real website origin for metadata.
5. Complete a controlled staging review of the Worker integration before activating public submissions.

HairSalon JSON-LD intentionally omits unconfirmed address, contact information, sample offers, and review ratings. All pages have unique titles, descriptions, canonical URLs, semantic headings, and image alt text. The build creates a sitemap and robots.txt. Photography and Google Fonts currently load from external CDNs; self-host these assets if needed.

## Photography sources

The portfolio uses Gladys's supplied original client-work photographs from `assets/portfolio/`. Remaining non-portfolio placeholders are limited to the hero and stylist portrait:

- [Mathilde Langevin — brunette hair / hero](https://www.pexels.com/photo/back-view-of-woman-with-brown-hair-13543276/)
- Portrait placeholder retained from the original site's [Unsplash image](https://images.unsplash.com/photo-1487412720507-e7ab37603c6f).

## Repository audit and deployment

- Service content is defined in `src/data.mjs`; services-page and booking-page markup is rendered from `src/pages.mjs` and `src/booking-page.mjs`.
- Booking behavior is in `src/booking-flow.js`; the Worker transport and retry state helpers are in `src/booking-provider.mjs`.
- `styles.css` contains the shared responsive design and booking controls.
- `scripts/build.mjs` generates root HTML for GitHub Pages compatibility and an equivalent `dist/` artifact. All browser imports and assets use relative paths, so the site works beneath `/Salon-Appointments/`.
- The older `api/` directory is a previous Google Cloud Calendar/Sheets/Firestore integration attempt. It is not built, deployed, called, or modified by the frontend.
- Informational business hours still exist in `src/data.mjs` for the contact page. The booking UI no longer filters weekdays or publishes hardcoded appointment hours; only the Worker determines availability.

GitHub Pages should publish the repository root (or deploy the generated `dist/` contents without changing relative paths). Run `npm run build` before committing generated root HTML.
