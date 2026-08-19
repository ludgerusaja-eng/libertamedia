import mysql from 'mysql2/promise';
import { DBStructure, IStorageAdapter } from './Repository';
import { SiteSettings } from '../types';

/**
 * Production storage adapter.
 * MySQL is the single source of truth. There is deliberately no JSON
 * fallback when DATABASE_TYPE=mysql: silently falling back can cause data
 * divergence and makes a failed database connection look healthy.
 */
export class MySQLStorageAdapter implements IStorageAdapter {
  private pool: mysql.Pool;

  constructor() {
    const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    for (const key of required) {
      if (!process.env[key]) throw new Error(`[MySQLStorageAdapter] Missing ${key}`);
    }

    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT || 3306),
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      charset: 'utf8mb4'
    });
  }

  public async healthCheck(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Legacy DBStructure compatibility boundary. New production code should
   * use query-specific repositories rather than loading the entire database.
   * This method intentionally reads the complete MySQL-backed structure so
   * existing routes can be migrated incrementally without JSON storage.
   */
  public async readDatabase(): Promise<DBStructure> {
    const [articles] = await this.pool.query<any[]>(
      `SELECT a.*, u.name AS author_name, u.email AS author_email, u.role AS author_role
       FROM articles a
       LEFT JOIN users u ON u.id = a.author_id
       ORDER BY COALESCE(a.published_at, a.created_at) DESC`
    );

    const [submissions] = await this.pool.query<any[]>(
      `SELECT id, title, category, author_name AS authorName, email AS authorEmail,
              institution, content, submitted_at AS submittedAt
       FROM submissions ORDER BY submitted_at DESC`
    );

    const [subscribers] = await this.pool.query<any[]>(
      `SELECT email FROM subscribers WHERE is_active = 1 ORDER BY created_at DESC`
    );

    const [settingsRows] = await this.pool.query<any[]>(
      `SELECT data FROM site_settings WHERE id = 1 LIMIT 1`
    );

    const [pages] = await this.pool.query<any[]>(
      `SELECT id, slug, title, content, updated_at AS updatedAt FROM pages ORDER BY title ASC`
    );

    const normalizedArticles = articles.map((row: any) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.excerpt || '',
      excerpt: row.excerpt || '',
      content: typeof row.content === 'string' ? row.content.split(/\n\n+/).filter(Boolean) : [],
      category: row.category,
      pillar: row.pillar,
      imageUrl: row.image_url || '',
      image: row.image_url || '',
      imageCaption: row.image_caption || '',
      caption: row.image_caption || '',
      author: {
        name: row.author_name || 'Redaksi LIBERTAMEDIA',
        email: row.author_email || '',
        role: row.author_role || 'REPORTER',
        avatar: ''
      },
      publishedAt: row.published_at ? new Date(row.published_at).toISOString() : '',
      readTime: '1 Menit Baca',
      views: Number(row.views || 0),
      tags: [],
      commentsCount: 0,
      status: row.status,
      isHero: Boolean(row.is_hero),
      isHeroHeadline: Boolean(row.is_hero),
      isEditorChoice: Boolean(row.is_editor_choice),
      isEditorsPick: Boolean(row.is_editor_choice),
      isTrending: Boolean(row.is_trending),
      comments: []
    }));

    return {
      articles: normalizedArticles as any,
      submissions: submissions as any,
      subscribers: subscribers.map((row: any) => row.email),
      settings: settingsRows.length ? (typeof settingsRows[0].data === 'string' ? JSON.parse(settingsRows[0].data) : settingsRows[0].data) : undefined,
      pages: pages as any
    };
  }

  /**
   * Compatibility writer. It writes the supported entities transactionally
   * to MySQL. No local JSON file is written.
   */
  public async writeDatabase(data: DBStructure): Promise<boolean> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const article of data.articles || []) {
        const content = Array.isArray((article as any).content)
          ? (article as any).content.join('\n\n')
          : String((article as any).content || '');
        const author = (article as any).author || {};
        const [users] = await connection.query<any[]>(
          `SELECT id FROM users WHERE email = ? LIMIT 1`,
          [author.email || 'redaksi@libertamedia.com']
        );
        const authorId = users.length ? users[0].id : null;

        await connection.query(
          `INSERT INTO articles
             (id, slug, title, excerpt, content, category, pillar, image_url,
              image_caption, author_id, status, published_at, views, is_hero,
              is_editor_choice, is_trending)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             slug=VALUES(slug), title=VALUES(title), excerpt=VALUES(excerpt),
             content=VALUES(content), category=VALUES(category), pillar=VALUES(pillar),
             image_url=VALUES(image_url), image_caption=VALUES(image_caption),
             author_id=VALUES(author_id), status=VALUES(status),
             published_at=VALUES(published_at), views=VALUES(views),
             is_hero=VALUES(is_hero), is_editor_choice=VALUES(is_editor_choice),
             is_trending=VALUES(is_trending)`,
          [
            article.id,
            article.slug,
            article.title,
            (article as any).excerpt || (article as any).summary || '',
            content,
            article.category,
            (article as any).pillar || 'BERITA',
            (article as any).imageUrl || (article as any).image || '',
            (article as any).imageCaption || (article as any).caption || '',
            authorId,
            (article as any).status || 'PUBLISHED',
            this.parseDate((article as any).publishedAt),
            Number((article as any).views || 0),
            Boolean((article as any).isHero || (article as any).isHeroHeadline),
            Boolean((article as any).isEditorChoice || (article as any).isEditorsPick),
            Boolean((article as any).isTrending)
          ]
        );
      }

      if (data.settings) {
        await connection.query(
          `INSERT INTO site_settings (id, data, updated_at) VALUES (1, ?, NOW())
           ON DUPLICATE KEY UPDATE data=VALUES(data), updated_at=NOW()`,
          [JSON.stringify(data.settings)]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  public async getSettings(): Promise<SiteSettings | null> {
    const [rows] = await this.pool.query<any[]>(`SELECT data FROM site_settings WHERE id = 1 LIMIT 1`);
    if (!rows.length) return null;
    return typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
  }

  public async saveSettings(settings: SiteSettings): Promise<boolean> {
    await this.pool.query(
      `INSERT INTO site_settings (id, data, updated_at) VALUES (1, ?, NOW())
       ON DUPLICATE KEY UPDATE data=VALUES(data), updated_at=NOW()`,
      [JSON.stringify(settings)]
    );
    return true;
  }

  private parseDate(value: unknown): Date | null {
    if (!value || value === 'Baru saja') return null;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
