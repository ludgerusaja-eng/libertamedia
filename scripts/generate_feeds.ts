import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import mysql, { RowDataPacket } from 'mysql2/promise';

const baseUrl = (process.env.APP_URL || 'https://libertamedia.com').replace(/\/$/, '');
const distPath = path.resolve(process.cwd(), 'dist');

async function main() {
  for (const key of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
    if (!process.env[key]) throw new Error(`Missing ${key}`);
  }
  await fs.mkdir(distPath, { recursive: true });
  const pool = mysql.createPool({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, port: Number(process.env.DB_PORT || 3306), charset: 'utf8mb4' });
  try {
    const [articles] = await pool.query<RowDataPacket[]>(`SELECT slug, title, published_at AS publishedAt, updated_at AS updatedAt, excerpt FROM articles WHERE status='PUBLISHED' ORDER BY published_at DESC LIMIT 5000`);
    const esc = (value: unknown) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const urls = articles.map(a => `<url><loc>${baseUrl}/berita/${encodeURIComponent(String(a.slug))}</loc><lastmod>${new Date(a.updatedAt || a.publishedAt || Date.now()).toISOString()}</lastmod><changefreq>hourly</changefreq><priority>0.8</priority></url>`).join('');
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>${urls}</urlset>`;
    const recent = articles.filter(a => new Date(a.publishedAt || 0).getTime() >= Date.now() - 48 * 60 * 60 * 1000).slice(0, 100);
    const news = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${recent.map(a => `<url><loc>${baseUrl}/berita/${encodeURIComponent(String(a.slug))}</loc><news:news><news:publication><news:name>LIBERTAMEDIA</news:name><news:language>id</news:language></news:publication><news:publication_date>${new Date(a.publishedAt).toISOString()}</news:publication_date><news:title>${esc(a.title)}</news:title></news:news></url>`).join('')}</urlset>`;
    const rssItems = articles.slice(0, 50).map(a => `<item><title>${esc(a.title)}</title><link>${baseUrl}/berita/${encodeURIComponent(String(a.slug))}</link><guid>${baseUrl}/berita/${encodeURIComponent(String(a.slug))}</guid><pubDate>${new Date(a.publishedAt || Date.now()).toUTCString()}</pubDate><description>${esc(a.excerpt)}</description></item>`).join('');
    const rss = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>LIBERTAMEDIA</title><link>${baseUrl}</link><description>Media Untuk Semua</description><language>id-ID</language>${rssItems}</channel></rss>`;
    const robots = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${baseUrl}/sitemap.xml\n`;
    await Promise.all([
      fs.writeFile(path.join(distPath, 'sitemap.xml'), sitemap),
      fs.writeFile(path.join(distPath, 'news-sitemap.xml'), news),
      fs.writeFile(path.join(distPath, 'rss.xml'), rss),
      fs.writeFile(path.join(distPath, 'robots.txt'), robots),
    ]);
    console.log(JSON.stringify({ ok: true, articles: articles.length, recentNews: recent.length, baseUrl }));
  } finally { await pool.end(); }
}

main().catch(error => { console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) })); process.exit(1); });
