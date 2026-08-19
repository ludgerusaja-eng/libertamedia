import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';

type JsonArticle = {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  excerpt?: string;
  content: unknown;
  category?: string;
  pillar?: string;
  image?: string;
  imageUrl?: string;
  caption?: string;
  imageCaption?: string;
  publishedAt?: string;
  status?: string;
  views?: number;
  isHero?: boolean;
  isHeroHeadline?: boolean;
  isEditorChoice?: boolean;
  isEditorsPick?: boolean;
  isTrending?: boolean;
  author?: { name?: string; email?: string; organization?: string; institution?: string };
  tags?: string[];
};

type JsonDb = {
  articles?: JsonArticle[];
  subscribers?: string[];
  settings?: Record<string, unknown>;
  pages?: Array<{ id: string; slug: string; title: string; content: string; updatedAt?: string }>;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function jsonContent(value: unknown): string {
  if (Array.isArray(value)) return value.join('\n\n');
  return typeof value === 'string' ? value : JSON.stringify(value ?? '');
}

function mapPillar(value?: string): 'BERITA' | 'OPINI' | 'CERITA' | 'GAGASAN' {
  const normalized = String(value || '').toUpperCase();
  if (normalized.includes('OPINI')) return 'OPINI';
  if (normalized.includes('CERITA')) return 'CERITA';
  if (normalized.includes('GAGASAN')) return 'GAGASAN';
  return 'BERITA';
}

function mapStatus(value?: string): 'DRAFT' | 'REVIEW' | 'FACT_CHECK' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED' {
  const normalized = String(value || '').toUpperCase();
  if (['DRAFT','REVIEW','FACT_CHECK','APPROVED','SCHEDULED','PUBLISHED','ARCHIVED'].includes(normalized)) {
    return normalized as ReturnType<typeof mapStatus>;
  }
  return 'PUBLISHED';
}

async function main() {
  const dataDir = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
  const sourcePath = process.env.JSON_SOURCE || path.join(dataDir, 'database.json');
  const raw = await fs.readFile(sourcePath, 'utf8');
  const db = JSON.parse(raw) as JsonDb;

  const pool = mysql.createPool({
    host: required('DB_HOST'),
    port: Number(process.env.DB_PORT || 3306),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
    connectionLimit: 5,
  });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Import the current public content without deleting anything already in MySQL.
    for (const article of db.articles || []) {
      const content = jsonContent(article.content);
      const status = mapStatus(article.status);
      const pillar = mapPillar(article.pillar);
      const publishedAt = article.publishedAt && !/^baru saja$/i.test(article.publishedAt)
        ? new Date(article.publishedAt)
        : null;

      await connection.query(
        `INSERT INTO articles
          (id, slug, title, excerpt, content, category, pillar, image_url, image_caption,
           status, published_at, views, is_hero, is_editor_choice, is_trending)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           slug=VALUES(slug), title=VALUES(title), excerpt=VALUES(excerpt), content=VALUES(content),
           category=VALUES(category), pillar=VALUES(pillar), image_url=VALUES(image_url),
           image_caption=VALUES(image_caption), status=VALUES(status), published_at=VALUES(published_at),
           views=VALUES(views), is_hero=VALUES(is_hero), is_editor_choice=VALUES(is_editor_choice),
           is_trending=VALUES(is_trending)`,
        [
          article.id,
          article.slug,
          article.title,
          article.excerpt || article.summary || null,
          content,
          article.category || 'Pemerintahan',
          pillar,
          article.imageUrl || article.image || null,
          article.imageCaption || article.caption || null,
          status,
          publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
          Math.max(0, Number(article.views || 0)),
          Boolean(article.isHero || article.isHeroHeadline),
          Boolean(article.isEditorChoice || article.isEditorsPick),
          Boolean(article.isTrending),
        ]
      );

      for (const tag of article.tags || []) {
        const name = String(tag).trim();
        if (!name) continue;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
        if (!slug) continue;
        await connection.query(
          `INSERT INTO tags (name, slug) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name)`,
          [name, slug]
        );
        const [rows] = await connection.query<any[]>('SELECT id FROM tags WHERE slug = ? LIMIT 1', [slug]);
        if (rows[0]) {
          await connection.query(
            `INSERT IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)`,
            [article.id, rows[0].id]
          );
        }
      }
    }

    for (const email of db.subscribers || []) {
      if (email) await connection.query('INSERT IGNORE INTO subscribers (email) VALUES (?)', [email]);
    }

    if (db.settings) {
      await connection.query(
        `INSERT INTO site_settings (id, data) VALUES (1, ?)
         ON DUPLICATE KEY UPDATE data=VALUES(data), updated_at=CURRENT_TIMESTAMP`,
        [JSON.stringify(db.settings)]
      );
    }

    for (const page of db.pages || []) {
      await connection.query(
        `INSERT INTO pages (id, slug, title, content, updated_at)
         VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
         ON DUPLICATE KEY UPDATE slug=VALUES(slug), title=VALUES(title), content=VALUES(content), updated_at=VALUES(updated_at)`,
        [page.id, page.slug, page.title, page.content, page.updatedAt ? new Date(page.updatedAt) : null]
      );
    }

    await connection.commit();
    console.log(`Migration completed: ${(db.articles || []).length} articles, ${(db.subscribers || []).length} subscribers, ${(db.pages || []).length} pages.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[migrate_json_to_mysql] FAILED:', error instanceof Error ? error.message : error);
  process.exit(1);
});
