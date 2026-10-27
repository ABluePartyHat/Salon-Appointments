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

// Production is now enabled; the local harness inherits the same source gate.

const book = path.join(localTest, 'book.html');
await replaceExactlyOnce(
  book,
  '<body data-page="book">',
  '<body data-page="book" data-local-booking-test="true"><div class="local-test-banner" role="status"><strong>LOCAL DEVELOPMENT TEST</strong><span>This page can send a real Pending booking request. Use only clearly labeled test customer data.</span></div>',
);
await replaceExactlyOnce(
  book,
  '<strong>Appointment requests are open.</strong> Choose your services and an available time, then submit a request for manual approval. Your appointment is not confirmed until the studio approves it. The studio will contact you directly; automatic confirmation emails are not currently sent.',
  '<strong>Local booking test mode.</strong> Availability and submission use the live Worker. Do not submit unless you intend to create a clearly labeled test booking.',
);
await replaceExactlyOnce(
  book,
  'id="submit-booking" class="button button-primary" type="submit">Submit Request',
  'id="submit-booking" class="button button-primary" type="submit">Submit Test Request',
);
await replaceExactlyOnce(
  book,
  'Submitting a request does not confirm an appointment.',
  'Development environment: submitting creates a real Pending request in the live booking system.',
);

const css = path.join(localTest, 'styles.css');
const stylesheet = await readFile(css, 'utf8');
await writeFile(css, `${stylesheet}\n.local-test-banner{position:relative;z-index:50;display:flex;justify-content:center;gap:18px;flex-wrap:wrap;padding:11px 20px;background:#7a241d;color:#fff;font-size:12px;letter-spacing:.02em}.local-test-banner strong{letter-spacing:.12em}.local-test-banner span{opacity:.92}\n`, 'utf8');

console.log('Built local-only booking harness in .local-booking-test/. Production and local harness both use the enabled booking gate.');
