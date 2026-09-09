import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const names = ['index', 'services', 'portfolio', 'about', 'new-clients', 'contact', 'book'];

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
  assert.equal(schema.address, undefined, 'unconfirmed address must not appear in structured data');
  assert.equal(schema.aggregateRating, undefined, 'sample reviews must not become SEO ratings');
});
