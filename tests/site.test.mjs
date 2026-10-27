import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { portfolio, categories } from '../src/data.mjs';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const names = ['index', 'services', 'portfolio', 'about', 'new-clients', 'contact', 'book'];

test('portfolio uses every supplied local image with complete metadata', async () => {
  assert.equal(portfolio.length, 13);
  assert.equal(new Set(portfolio.map(item => item.image)).size, portfolio.length);
  for (const item of portfolio) {
    assert.match(item.image, /^\.\/assets\/portfolio\/[a-z0-9-]+\.jpg$/);
    assert.ok(item.title && item.alt && item.category && item.categories.length);
    await access(path.resolve(root, item.image));
  }
  for (const category of categories.filter(category => category !== 'All')) assert.ok(portfolio.some(item => item.categories.includes(category)), `${category} filter is empty`);
});

for (const name of names) test(`${name}: complete static page, valid links, unique IDs and SEO`, async () => {
  const html = await readFile(path.join(root, `${name}.html`), 'utf8');
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
  assert.match(html, /<title>[^<]+<\/title>/);
  assert.match(html, /name="description" content="[^"]+"/);
  assert.match(html, /<main id="main">/);
  assert.ok(!html.includes('Miro'));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size, 'duplicate element IDs');
  for (const [, href] of html.matchAll(/href="(\.[^"]+)"/g)) {
    const [filename, hash] = href.split('?')[0].split('#');
    const target = path.resolve(root, filename);
    await access(target);
    if (hash) assert.ok((await readFile(target, 'utf8')).includes(`id="${hash}"`), `missing anchor ${href}`);
  }
  for (const [, attributes] of html.matchAll(/<img\s([^>]+)>/g)) assert.match(attributes, /alt="[^"]*"/);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(schema['@type'], 'HairSalon');
  assert.equal(schema.address.addressLocality, 'Miami');
  assert.equal(schema.telephone, '+13054503223');
  assert.equal(schema.aggregateRating, undefined, 'sample reviews must not become SEO ratings');
});

test('booking page uses only the Phase 3 Worker API and keeps Pending approval explicit', async () => {
  const html = await readFile(path.join(root, 'book.html'), 'utf8');
  const styles = await readFile(path.join(root, 'styles.css'), 'utf8');
  const client = await readFile(path.join(root, 'src', 'booking-ui.js'), 'utf8');
  const provider = await readFile(path.join(root, 'src', 'booking-provider.mjs'), 'utf8');
  const flow = await readFile(path.join(root, 'src', 'booking-flow-v2.js'), 'utf8');
  const data = await readFile(path.join(root, 'src', 'data.mjs'), 'utf8');
  assert.match(html, /name="services"/);
  assert.match(html, /name="hairLength"/);
  assert.match(html, /data-step="0"[\s\S]*name="hairLength"[\s\S]*name="services"[\s\S]*Review Estimate/);
  assert.equal((html.match(/class="booking-panel" data-step=/g) || []).length, 4);
  assert.ok(html.indexOf('01 / YOUR HAIR &amp; SERVICES') < html.indexOf('02 / YOUR ESTIMATE'));
  for (const [label, id] of [['Hair length', 'review-length'], ['Services', 'review-services'], ['Estimated duration', 'review-duration'], ['Estimated price', 'review-price']]) {
    assert.match(html, new RegExp(`<div class="estimate-field"><dt>${label}</dt><dd id="${id}">`));
  }
  assert.match(styles, /estimate-summary-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles, /estimate-field\{display:flex;[^}]*flex-direction:column;[^}]*align-items:flex-start/);
  assert.match(html, /id="continue-to-details"[^>]*disabled/);
  assert.match(html, /id="booking-loading-overlay"[^>]*hidden[^>]*role="status"/);
  assert.match(html, /Request Received — Pending Approval/);
  assert.match(html, /not a confirmed appointment/i);
  assert.match(html, /id="submit-booking"[^>]*disabled/);
  assert.match(html, /Submissions Paused/);
  assert.match(html, /Final submission is disabled during the controlled integration review/);
  assert.doesNotMatch(client, /fetch\s*\(|\.confirm\s*\(/);
  assert.match(data, /salon-booking-api\.pino-raul2\.workers\.dev\/api\/availability/);
  assert.match(data, /salon-booking-api\.pino-raul2\.workers\.dev\/api\/bookings/);
  assert.match(provider, /method:\s*['"]POST['"]/);
  assert.match(flow, /sessionStorage/);
  assert.match(data, /submissionsEnabled:\s*false/);
  assert.match(flow, /if \(!submissionsEnabled\)/);
  assert.doesNotMatch(flow, /searchParams.*submissionsEnabled|localStorage.*submissionsEnabled|sessionStorage.*submissionsEnabled/);
  assert.doesNotMatch(`${provider}\n${flow}`, /(?:['"`])(?:\.\.\/)?api\//, 'must not use the legacy local api backend');
  assert.doesNotMatch(`${provider}\n${flow}`, /firestore|API_SHARED_SECRET|APPS_SCRIPT_URL/i);
  assert.doesNotMatch(html, /(?:src|href)="\/(?!\/)/, 'root-relative assets break the /Salon-Appointments/ base path');
});
