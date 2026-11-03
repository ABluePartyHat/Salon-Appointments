import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const production = path.join(root, 'dist');
const localTest = path.join(root, '.local-booking-test');

await import('./build.mjs');
await rm(localTest, { recursive: true, force: true });
await mkdir(localTest, { recursive: true });
await cp(production, localTest, { recursive: true });

async function replaceExactlyOnce(filename, before, after) {
  const content = await readFile(filename, 'utf8');
  const occurrences = content.split(before).length - 1;
  if (occurrences !== 1) throw new Error(`Expected one local-test replacement in ${filename}; found ${occurrences}.`);
  await writeFile(filename, content.replace(before, after), 'utf8');
}

// Keep the local harness in the same safe, submissions-paused state as production.
// Never enable live bookings through a build-only testing convenience.
const book = path.join(localTest, 'book.html');
await replaceExactlyOnce(
  book,
  '<body data-page="book">',
  '<body data-page="book" data-local-booking-test="true"><div class="local-test-banner" role="status"><strong>LOCAL DEVELOPMENT TEST</strong><span>Booking submissions remain disabled. This page is for inspecting the booking interface only.</span></div>',
);
await replaceExactlyOnce(
  book,
  'Appointment requests are temporarily paused.',
  'Appointment requests are temporarily paused (local test).',
);

const css = path.join(localTest, 'styles.css');
const stylesheet = await readFile(css, 'utf8');
await writeFile(css, `${stylesheet}\n.local-test-banner{position:relative;z-index:50;display:flex;justify-content:center;gap:18px;flex-wrap:wrap;padding:11px 20px;background:#7a241d;color:#fff;font-size:12px;letter-spacing:.02em}.local-test-banner strong{letter-spacing:.12em}.local-test-banner span{opacity:.92}\n`, 'utf8');

console.log('Built local-only booking harness in .local-booking-test/. Production and local harness both keep submissions disabled.');
