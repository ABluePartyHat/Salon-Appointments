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

All photos are labeled inspiration or placeholders; they do not represent Gladys's work or endorsements. Pexels images are offered under the [Pexels License](https://www.pexels.com/license/).

- [Mathilde Langevin — brunette hair / hero](https://www.pexels.com/photo/back-view-of-woman-with-brown-hair-13543276/)
- [Ron Lach — blonde waves](https://www.pexels.com/photo/back-view-of-a-woman-s-hair-9489719/)
- [Ron Lach — natural curls](https://www.pexels.com/photo/close-up-photo-of-woman-with-curly-hair-9253773/)
- [daria — chestnut waves](https://www.pexels.com/photo/elegant-long-wavy-hair-in-natural-light-38714663/)
- [Biola Visuals — long hair](https://www.pexels.com/photo/back-view-of-a-woman-with-long-wavy-hair-17740207/)
- [Rene Terp — occasion styling](https://www.pexels.com/photo/back-view-of-woman-with-wavy-blonde-hair-13788286/)
- Portrait placeholder retained from the original site's [Unsplash image](https://images.unsplash.com/photo-1487412720507-e7ab37603c6f).
