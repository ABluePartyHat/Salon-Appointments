import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

try {
  await import('./build-local-booking-test.mjs');
} catch (error) {
  console.error('LOCAL DEVELOPMENT TEST build failed. The server was not started.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const root = fileURLToPath(new URL('../.local-booking-test/', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.xml': 'application/xml', '.txt': 'text/plain' };

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    let filename = path.resolve(root, `.${pathname === '/' ? '/book.html' : pathname}`);
    if (!filename.startsWith(root)) { response.writeHead(403); response.end('Forbidden'); return; }
    if ((await stat(filename)).isDirectory()) filename = path.join(filename, 'index.html');
    const data = await readFile(filename);
    response.writeHead(200, {
      'Content-Type': types[path.extname(filename)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
    });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end('Page not found');
  }
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error('LOCAL DEVELOPMENT TEST could not start: 127.0.0.1:4174 is already in use.');
    console.error('Stop the other local server with Ctrl+C, then run this command again.');
  } else {
    console.error(`LOCAL DEVELOPMENT TEST server error: ${error.message}`);
  }
  process.exitCode = 1;
});

function shutdown() {
  console.log('\nStopping LOCAL DEVELOPMENT TEST server...');
  server.close(error => {
    if (error) {
      console.error(`Could not stop the local server cleanly: ${error.message}`);
      process.exitCode = 1;
    }
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

server.listen(4174, '127.0.0.1', () => {
  console.log('LOCAL DEVELOPMENT TEST: http://127.0.0.1:4174/book.html');
  console.log('This server uses the live Worker. It never submits automatically.');
  console.log('The server will keep running until you press Ctrl+C.');
});
