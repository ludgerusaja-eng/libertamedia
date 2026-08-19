import mysql, { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import crypto from 'node:crypto';
import { Article } from '../types';

export type EditorialStatus = 'DRAFT' | 'REVIEW' | 'FACT_CHECK' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
export type UserRole = 'SUPER_ADMIN' | 'MANAGING_EDITOR' | 'EDITOR' | 'REPORTER' | 'CONTRIBUTOR' | 'MODERATOR';

export interface ProductionUser { id: number; name: string; email: string; passwordHash: string; role: UserRole; isActive: boolean; }
export interface SessionRecord { id: string; userId: number; expiresAt: Date; }
export interface ArticleWriteInput { id: string; slug: string; title: string; excerpt?: string; content: string; category: string; pillar?: string; imageUrl?: string; imageCaption?: string; authorId?: number | null; status?: EditorialStatus; scheduledAt?: Date | null; publishedAt?: Date | null; isHero?: boolean; isEditorChoice?: boolean; isTrending?: boolean; }
export interface AuditContext { actorUserId?: number | null; action: string; entityType: string; entityId?: string | null; ipAddress?: string | null; userAgent?: string | null; metadata?: Record<string, unknown>; }

export class ProductionRepository {
  private readonly pool: Pool;
  constructor() {
    for (const key of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) if (!process.env[key]) throw new Error(`[ProductionRepository] Missing required environment variable: ${key}`);
    this.pool = mysql.createPool({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, port: Number(process.env.DB_PORT || 3306), connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10), waitForConnections: true, queueLimit: 0, charset: 'utf8mb4', enableKeepAlive: true, keepAliveInitialDelay: 10000 });
  }
  async healthCheck(): Promise<void> { await this.pool.query('SELECT 1'); }
  async close(): Promise<void> { await this.pool.end(); }

  private mapUser(row: RowDataPacket): ProductionUser { return { id: Number(row.id), name: String(row.name), email: String(row.email), passwordHash: String(row.password_hash), role: row.role as UserRole, isActive: Boolean(row.is_active) }; }

  async findUserById(id: number): Promise<ProductionUser | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(`SELECT id, name, email, password_hash, role, is_active FROM users WHERE id = ? LIMIT 1`, [id]);
    return rows.length ? this.mapUser(rows[0]) : null;
  }
  async findUserByEmail(email: string): Promise<ProductionUser | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(`SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1`, [email.trim().toLowerCase()]);
    return rows.length ? this.mapUser(rows[0]) : null;
  }
  async createSession(userId: number, ttlHours = 24): Promise<SessionRecord> {
    const id = crypto.randomBytes(32).toString('hex'); const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    await this.pool.query(`INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`, [id, userId, expiresAt]); return { id, userId, expiresAt };
  }
  async getSession(sessionId: string): Promise<SessionRecord | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(`SELECT id, user_id, expires_at FROM sessions WHERE id = ? AND revoked_at IS NULL AND expires_at > NOW() LIMIT 1`, [sessionId]);
    if (!rows.length) return null; await this.pool.query(`UPDATE sessions SET last_seen_at = NOW() WHERE id = ?`, [sessionId]);
    return { id: String(rows[0].id), userId: Number(rows[0].user_id), expiresAt: new Date(rows[0].expires_at) };
  }
  async revokeSession(sessionId: string): Promise<void> { await this.pool.query(`UPDATE sessions SET revoked_at = NOW() WHERE id = ?`, [sessionId]); }
  async revokeAllUserSessions(userId: number): Promise<void> { await this.pool.query(`UPDATE sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL`, [userId]); }

  async listPublishedArticles(limit = 50, offset = 0): Promise<Article[]> {
    const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit))); const safeOffset = Math.max(0, Math.trunc(offset));
    const [rows] = await this.pool.query<RowDataPacket[]>(`SELECT a.*, u.name AS author_name, u.email AS author_email, u.role AS author_role FROM articles a LEFT JOIN users u ON u.id = a.author_id WHERE a.status = 'PUBLISHED' ORDER BY a.published_at DESC, a.created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`);
    return rows.map(row => this.toArticle(row));
  }
  async findArticle(idOrSlug: string): Promise<Article | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(`SELECT a.*, u.name AS author_name, u.email AS author_email, u.role AS author_role FROM articles a LEFT JOIN users u ON u.id = a.author_id WHERE a.id = ? OR a.slug = ? LIMIT 1`, [idOrSlug, idOrSlug]);
    return rows.length ? this.toArticle(rows[0]) : null;
  }
  async saveArticle(input: ArticleWriteInput, actorUserId?: number | null): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [existing] = await connection.query<RowDataPacket[]>(`SELECT id FROM articles WHERE id = ? FOR UPDATE`, [input.id]);
      const [revisionRows] = await connection.query<RowDataPacket[]>(`SELECT COALESCE(MAX(revision_number), 0) AS revision FROM article_revisions WHERE article_id = ?`, [input.id]);
      const revisionNumber = Number(revisionRows[0].revision || 0) + 1;
      await connection.query<ResultSetHeader>(`INSERT INTO articles (id, slug, title, excerpt, content, category, pillar, image_url, image_caption, author_id, status, scheduled_at, published_at, is_hero, is_editor_choice, is_trending) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE slug=VALUES(slug), title=VALUES(title), excerpt=VALUES(excerpt), content=VALUES(content), category=VALUES(category), pillar=VALUES(pillar), image_url=VALUES(image_url), image_caption=VALUES(image_caption), author_id=VALUES(author_id), status=VALUES(status), scheduled_at=VALUES(scheduled_at), published_at=VALUES(published_at), is_hero=VALUES(is_hero), is_editor_choice=VALUES(is_editor_choice), is_trending=VALUES(is_trending)`, [input.id, input.slug, input.title, input.excerpt || '', input.content, input.category, input.pillar || 'BERITA', input.imageUrl || '', input.imageCaption || '', input.authorId ?? null, input.status || 'DRAFT', input.scheduledAt ?? null, input.publishedAt ?? null, Boolean(input.isHero), Boolean(input.isEditorChoice), Boolean(input.isTrending)]);
      await connection.query(`INSERT INTO article_revisions (article_id, editor_id, revision_number, title, excerpt, content, change_summary) VALUES (?, ?, ?, ?, ?, ?, ?)`, [input.id, actorUserId ?? null, revisionNumber, input.title, input.excerpt || '', input.content, existing.length ? 'Article updated' : 'Article created']);
      await connection.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?)`, [actorUserId ?? null, existing.length ? 'ARTICLE_UPDATED' : 'ARTICLE_CREATED', 'article', input.id, JSON.stringify({ status: input.status || 'DRAFT' })]);
      await connection.commit();
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }
  async audit(context: AuditContext): Promise<void> { await this.pool.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)`, [context.actorUserId ?? null, context.action, context.entityType, context.entityId ?? null, context.ipAddress ?? null, context.userAgent ?? null, JSON.stringify(context.metadata || {})]); }
  private toArticle(row: RowDataPacket): Article { return { id: String(row.id), title: String(row.title), slug: String(row.slug), summary: String(row.excerpt || ''), excerpt: String(row.excerpt || ''), content: String(row.content || '').split(/\n\n+/).filter(Boolean), category: row.category, pillar: row.pillar, imageUrl: String(row.image_url || ''), image: String(row.image_url || ''), imageCaption: String(row.image_caption || ''), caption: String(row.image_caption || ''), author: { name: String(row.author_name || 'Redaksi LIBERTAMEDIA'), email: String(row.author_email || ''), role: String(row.author_role || 'REPORTER'), avatar: '' }, publishedAt: row.published_at ? new Date(row.published_at).toISOString() : '', readTime: '1 Menit Baca', views: Number(row.views || 0), tags: [], commentsCount: 0, status: row.status, isHero: Boolean(row.is_hero), isHeroHeadline: Boolean(row.is_hero), isEditorChoice: Boolean(row.is_editor_choice), isEditorsPick: Boolean(row.is_editor_choice), isTrending: Boolean(row.is_trending), comments: [] } as Article; }
}
