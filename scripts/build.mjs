import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { business, pageMeta, services } from '../src/data.mjs';
import { header, footer, esc } from '../src/components.mjs';
import { pages } from '../src/pages.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
await mkdir(dist, { recursive: true });
const schema = {
  '@context': 'https://schema.org', '@type': 'HairSalon', name: business.name,
  url: business.origin, description: pageMeta.home[1], sameAs: [business.instagram],
  founder: { '@type': 'Person', name: business.stylist },
  hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Hair services', itemListElement: services.map(s => ({ '@type': 'Service', name: s.name, serviceType: s.category, description: s.description })) },
  // Only add actual local details after confirmation. No fictional reviews or ratings.
  ...(business.contactConfirmed ? { telephone: business.phone, email: business.email } : {}),
  ...(business.locationConfirmed ? { address: { '@type': 'PostalAddress', streetAddress: business.address, addressLocality: business.locality, addressRegion: business.region, postalCode: business.postalCode } } : {}),
};
const json = JSON.stringify(schema).replace(/</g, '\\u003c');
for (const [page, render] of Object.entries(pages)) {
  const filename = page === 'home' ? 'index.html' : `${page}.html`;
  const [title, description] = pageMeta[page];
  const url = `${business.origin}/${page === 'home' ? '' : filename}`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#faf8f4"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${url}"><meta property="og:type" content="website"><meta property="og:site_name" content="${business.name}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preconnect" href="https://images.pexels.com"><link rel="preconnect" href="https://images.unsplash.com"><link rel="icon" href="./favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="./styles.css"><script type="application/ld+json">${json}</script><script type="module" src="./src/client.js"></script></head><body data-page="${page}">${header(page)}<main id="main">${render()}</main>${footer()}<noscript><div class="noscript-note">Booking and interactive gallery tools need JavaScript. You can still explore services and contact information using the navigation.</div></noscript></body></html>\n`;
  // Generated static HTML stays usable on any basic host; source of truth is src/.
  await writeFile(path.join(root, filename), html, 'utf8');
  await writeFile(path.join(dist, filename), html, 'utf8');
}
await mkdir(path.join(dist, 'src'), { recursive: true });
for (const name of ['client.js', 'data.mjs', 'booking-provider.mjs']) await copyFile(path.join(root, 'src', name), path.join(dist, 'src', name));
for (const name of ['styles.css', 'favicon.svg']) await copyFile(path.join(root, name), path.join(dist, name));
const urls = Object.keys(pages).filter(p => p !== 'book').map(p => `${business.origin}/${p === 'home' ? '' : `${p}.html`}`);
await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${url}</loc></url>`).join('')}</urlset>\n`);
await writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${business.origin}/sitemap.xml\n`);
console.log(`Built ${Object.keys(pages).length} static pages in dist/. No runtime dependencies.`);
