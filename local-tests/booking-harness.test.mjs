import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = relative => readFile(path.join(root, relative), 'utf8');

test('production source and generated page are explicitly enabled', async () => {
  const [data, page, flow] = await Promise.all([
    read('src/data.mjs'), read('book.html'), read('src/booking-flow-v2.js'),
  ]);
  assert.match(data, /Object\.freeze\(\{ submissionsEnabled: true \}\)/);
  assert.doesNotMatch(page, /id="submit-booking"[^>]*disabled/);
  assert.match(page, /Submit Request/);
  assert.match(flow, /if \(!submissionsEnabled\)/);
});

test('local artifact clearly labels the real form', async () => {
  const [data, page, provider, flow] = await Promise.all([
    read('.local-booking-test/src/data.mjs'),
    read('.local-booking-test/book.html'),
    read('.local-booking-test/src/booking-provider.mjs'),
    read('.local-booking-test/src/booking-flow-v2.js'),
  ]);
  assert.match(data, /Object\.freeze\(\{ submissionsEnabled: true \}\)/);
  assert.match(page, /LOCAL DEVELOPMENT TEST/);
  assert.match(page, /Submit Test Request/);
  assert.doesNotMatch(page, /id="submit-booking"[^>]*disabled/);
  assert.match(data, /salon-booking-api\.pino-raul2\.workers\.dev\/api\/availability/);
  assert.match(data, /salon-booking-api\.pino-raul2\.workers\.dev\/api\/bookings/);
  assert.match(provider, /method: 'POST'/);
  assert.equal(flow, await read('src/booking-flow-v2.js'), 'local harness must use the actual frontend booking logic');
});

test('local harness preserves the combined selection flow and loading protections', async () => {
  const [page, flow, styles] = await Promise.all([
    read('.local-booking-test/book.html'),
    read('.local-booking-test/src/booking-flow-v2.js'),
    read('.local-booking-test/styles.css'),
  ]);
  assert.match(page, /data-step="0"[\s\S]*name="hairLength"[\s\S]*name="services"[\s\S]*Review Estimate/);
  assert.equal((page.match(/class="booking-panel" data-step=/g) || []).length, 4);
  assert.ok(page.indexOf('01 / YOUR HAIR &amp; SERVICES') < page.indexOf('02 / YOUR ESTIMATE'));
  assert.equal((page.match(/class="estimate-field"/g) || []).length, 4);
  assert.match(page, /id="continue-to-details"[^>]*disabled/);
  assert.match(page, /id="booking-loading-overlay"[^>]*hidden[^>]*role="status"/);
  assert.match(page, /Sending your booking request/);
  assert.match(page, /booking-service-duration[^>]*data-duration-(?:short|medium|long)="[^"]*\dh/);
  assert.match(flow, /Checking available appointment times\.\.\./);
  assert.match(flow, /submissionGate\.run/);
  assert.match(flow, /finally \{\s*setSubmissionLoading\(false\)/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
});

test('local harness contains no automatic booking trigger or synthetic customer payload', async () => {
  const [builder, server] = await Promise.all([
    read('scripts/build-local-booking-test.mjs'),
    read('scripts/serve-local-booking-test.mjs'),
  ]);
  assert.doesNotMatch(`${builder}\n${server}`, /submitBooking|requestId|customer@example|\/api\/bookings/);
  assert.match(server, /127\.0\.0\.1/);
  assert.match(server, /noindex, nofollow/);
  assert.match(server, /build-local-booking-test\.mjs/);
  assert.match(server, /EADDRINUSE/);
  assert.match(server, /until you press Ctrl\+C/);
});

test('local server rebuilds, announces its URL, serves the harness, and stays running', { timeout: 20000 }, async () => {
  const child = spawn(process.execPath, ['scripts/serve-local-booking-test.mjs'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  let errors = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { errors += chunk; });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out waiting for local server: ${errors}`)), 12000);
      child.stdout.on('data', () => {
        if (output.includes('http://127.0.0.1:4174/book.html')) {
          clearTimeout(timer);
          resolve();
        }
      });
      child.once('exit', code => {
        clearTimeout(timer);
        reject(new Error(`Local server exited before startup (${code}): ${errors}`));
      });
    });
    const response = await fetch('http://127.0.0.1:4174/book.html');
    assert.equal(response.status, 200);
    assert.match(await response.text(), /LOCAL DEVELOPMENT TEST/);
    assert.equal(child.exitCode, null, 'server should remain running after serving a request');
    assert.match(output, /Built local-only booking harness/);
    assert.match(output, /until you press Ctrl\+C/);

    const conflict = spawn(process.execPath, ['scripts/serve-local-booking-test.mjs'], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let conflictErrors = '';
    conflict.stderr.setEncoding('utf8');
    conflict.stderr.on('data', chunk => { conflictErrors += chunk; });
    const [conflictCode] = await once(conflict, 'exit');
    assert.equal(conflictCode, 1);
    assert.match(conflictErrors, /127\.0\.0\.1:4174 is already in use/);
  } finally {
    if (child.exitCode === null) {
      child.kill('SIGTERM');
      await once(child, 'exit');
    }
  }
});
