import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import mysql, { RowDataPacket } from 'mysql2/promise';
import helmet from 'helmet';
import sharp from 'sharp';
import sanitizeHtml from 'sanitize-html';
import { ProductionRepository } from './src/storage/ProductionRepository';
import { ProductionAuthService } from './src/services/production-auth';
import { assertPermission } from './src/security/rbac';
import { PersistentRateLimiter } from './src/services/apiRateLimit';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const distPath = path.resolve(process.cwd(), 'dist');
const uploadDir = path.join(distPath, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

for (const key of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'ADMIN_EMAIL']) {
  if (!process.env[key]) throw new Error(`[production] Missing required environment variable: ${key}`);
}
if (process.env.NODE_ENV !== 'production') throw new Error('[production] NODE_ENV must be production.');

const repository = new ProductionRepository();
const auth = new ProductionAuthService(repository);
const rateLimiter = new PersistentRateLimiter();
const pool = mysql.createPool({
  host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, port: Number(process.env.DB_PORT || 3306), connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  waitForConnections: true, queueLimit: 0, charset: 'utf8mb4', enableKeepAlive: true, keepAliveInitialDelay: 10000
});

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use('/assets', express.static(path.join(distPath, 'assets'), { maxAge: '1y', immutable: true }));
app.use('/uploads', express.static(uploadDir, { maxAge: '1d' }));

const sanitize = (value: unknown) => sanitizeHtml(String(value ?? ''), {
  allowedTags: ['p','b','i','strong','em','a','img','ul','ol','li','h1','h2','h3','h4','blockquote','code','pre','br','span'],
  allowedAttributes: { a: ['href','target','rel'], img: ['src','alt','title','width','height'], span: ['class'] },
  allowedSchemes: ['http','https','mailto'], allowProtocolRelative: false
}).trim();

function tokenFrom(req: express.Request): string {
  const value = req.headers.authorization || req.headers['x-admin-token'] || '';
  const raw = String(value);
  return raw.toLowerCase().startsWith('bearer ') ? raw.slice(7).trim() : raw.trim();
}

async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const user = await auth.authenticate(tokenFrom(req));
    if (!user) return res.status(401).json({ success: false, message: 'Sesi tidak valid atau telah kedaluwarsa.' });
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('[auth]', error);
    res.status(503).json({ success: false, message: 'Authentication service unavailable.' });
  }
}

function permission(permissionName: Parameters<typeof assertPermission>[1]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try { assertPermission((req as any).user.role, permissionName); next(); }
    catch { res.status(403).json({ success: false, message: 'Anda tidak memiliki izin untuk operasi ini.' }); }
  };
}

function rateLimit(keyFactory: (req: express.Request) => string, maxRequests: number, windowSeconds: number) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const allowed = await rateLimiter.consume(keyFactory(req), maxRequests, windowSeconds);
      if (!allowed) return res.status(429).json({ success: false, message: 'Terlalu banyak permintaan. Silakan coba lagi beberapa saat.' });
      next();
    } catch (error) {
      console.error('[rate-limit]', error);
      res.status(503).json({ success: false, message: 'Rate limit service unavailable.' });
    }
  };
}

const clientKey = (req: express.Request) => String(req.ip || req.socket.remoteAddress || 'unknown');

app.get('/api/health', async (_req, res) => {
  try { await repository.healthCheck(); res.json({ ok: true, service: 'libertamedia', database: 'ok' }); }
  catch { res.status(503).json({ ok: false, service: 'libertamedia', database: 'unavailable' }); }
});

app.post('/api/auth/login', rateLimit(clientKey, 5, 15 * 60), async (req, res) => {
  const email = String(req.body?.email || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
  const session = await auth.login(email, password);
  if (!session) return res.status(401).json({ success: false, message: 'Email atau password tidak sesuai.' });
  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [session.userId]);
  res.json({ success: true, token: session.sessionId, expiresAt: session.expiresAt.toISOString(), user: { id: session.userId, name: session.name, email: session.email, role: session.role } });
});
app.post('/api/auth/logout', async (req, res) => { await auth.logout(tokenFrom(req)); res.json({ success: true }); });
app.get('/api/auth/me', async (req, res) => {
  const user = await auth.authenticate(tokenFrom(req));
  res.json(user ? { success: true, authenticated: true, user: { id: user.userId, name: user.name, email: user.email, role: user.role }, expiresAt: user.expiresAt.toISOString() } : { success: true, authenticated: false });
});

app.get('/api/articles', async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
  let articles = await repository.listPublishedArticles(limit, (page - 1) * limit);
  const category = String(req.query.category || '');
  const q = String(req.query.q || '').toLowerCase();
  if (category && category !== 'Semua') articles = articles.filter(a => String(a.category).toLowerCase() === category.toLowerCase());
  if (q) articles = articles.filter(a => `${a.title} ${a.excerpt} ${a.author.name}`.toLowerCase().includes(q));
  res.json({ success: true, total: articles.length, pagination: { page, limit, total: articles.length, totalPages: 1 }, data: articles });
});
app.get('/api/articles/:id', async (req, res) => {
  const article = await repository.findArticle(req.params.id);
  if (!article) return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan' });
  await pool.query('UPDATE articles SET views = views + 1 WHERE id = ?', [article.id]);
  article.views = Number(article.views || 0) + 1;
  res.json({ success: true, data: article });
});

app.post('/api/articles/:id/reactions', rateLimit(clientKey, 30, 60), async (req, res) => {
  const type = String(req.body?.type || '');
  const allowed = new Set(['claps','insightful','inspiring','critical']);
  if (!allowed.has(type)) return res.status(400).json({ success: false, message: 'Jenis reaksi tidak valid.' });
  const delta = Number(req.body?.delta || 1) >= 0 ? 1 : -1;
  const article = await repository.findArticle(req.params.id);
  if (!article) return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
  await pool.query(`INSERT INTO article_reactions (article_id, reaction_type, reaction_count) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE reaction_count = GREATEST(0, reaction_count + VALUES(reaction_count))`, [article.id, type, delta]);
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT reaction_type AS type, reaction_count AS count FROM article_reactions WHERE article_id = ?`, [article.id]);
  const reactions: Record<string, number> = { claps: 0, insightful: 0, inspiring: 0, critical: 0 };
  for (const row of rows) reactions[String(row.type)] = Number(row.count);
  res.json({ success: true, reactions });
});

app.post('/api/articles', requireAuth, permission('article:create'), async (req, res) => {
  const body = req.body || {};
  if (!body.title || !body.category) return res.status(400).json({ success: false, message: 'Judul dan kategori wajib diisi.' });
  const id = String(body.id || `art-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`);
  const title = sanitize(body.title);
  const content = Array.isArray(body.content) ? body.content.map(sanitize).join('\n\n') : sanitize(body.content);
  const slug = String(body.slug || title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')).slice(0, 240);
  const status = ['DRAFT','REVIEW','FACT_CHECK','APPROVED','SCHEDULED','PUBLISHED'].includes(String(body.status)) ? String(body.status) as any : 'DRAFT';
  const publishedAt = status === 'PUBLISHED' ? new Date() : null;
  const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  await repository.saveArticle({ id, slug, title, excerpt: sanitize(body.excerpt || body.summary), content, category: sanitize(body.category), pillar: body.pillar, imageUrl: String(body.imageUrl || ''), imageCaption: sanitize(body.imageCaption), authorId: (req as any).user.userId, status, scheduledAt, publishedAt, isHero: !!body.isHero, isEditorChoice: !!body.isEditorChoice, isTrending: !!body.isTrending }, (req as any).user.userId);
  res.status(201).json({ success: true, data: await repository.findArticle(id) });
});
app.put('/api/articles/:id', requireAuth, permission('article:edit'), async (req, res) => {
  const current = await repository.findArticle(req.params.id);
  if (!current) return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan' });
  const body = req.body || {};
  const content = Array.isArray(body.content) ? body.content.map(sanitize).join('\n\n') : sanitize(body.content ?? current.content);
  const status = ['DRAFT','REVIEW','FACT_CHECK','APPROVED','SCHEDULED','PUBLISHED','ARCHIVED'].includes(String(body.status)) ? String(body.status) as any : current.status;
  await repository.saveArticle({ id: current.id, slug: String(body.slug || current.slug), title: sanitize(body.title || current.title), excerpt: sanitize(body.excerpt || body.summary || current.excerpt), content, category: sanitize(body.category || current.category), pillar: body.pillar || current.pillar, imageUrl: String(body.imageUrl || current.imageUrl || ''), imageCaption: sanitize(body.imageCaption || current.imageCaption), authorId: (req as any).user.userId, status, scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null, publishedAt: status === 'PUBLISHED' ? new Date() : null, isHero: !!body.isHero, isEditorChoice: !!body.isEditorChoice, isTrending: !!body.isTrending }, (req as any).user.userId);
  res.json({ success: true, data: await repository.findArticle(current.id) });
});
app.delete('/api/articles/:id', requireAuth, permission('article:archive'), async (req, res) => {
  await pool.query(`UPDATE articles SET status = 'ARCHIVED' WHERE id = ?`, [req.params.id]);
  await repository.audit({ actorUserId: (req as any).user.userId, action: 'ARTICLE_ARCHIVED', entityType: 'article', entityId: req.params.id, ipAddress: req.ip, userAgent: req.get('user-agent') });
  res.json({ success: true });
});

app.post('/api/articles/:id/comments', rateLimit(clientKey, 10, 60 * 60), async (req, res) => {
  const article = await repository.findArticle(req.params.id);
  if (!article) return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan' });
  const id = `comment-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const author = sanitize(req.body?.author).slice(0, 160); const content = sanitize(req.body?.content);
  if (!author || !content) return res.status(400).json({ success: false, message: 'Nama dan komentar wajib diisi.' });
  await pool.query(`INSERT INTO comments (id, article_id, author_name, content, status) VALUES (?, ?, ?, ?, 'PENDING')`, [id, article.id, author, content]);
  res.status(201).json({ success: true, data: { id, articleId: article.id, author, content, status: 'PENDING' } });
});

app.get('/api/comments', requireAuth, permission('comment:moderate'), async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT id, article_id AS articleId, author_name AS author, content, status, created_at AS createdAt, moderated_at AS moderatedAt FROM comments ORDER BY created_at DESC LIMIT 200`);
  res.json({ success: true, data: rows });
});
app.patch('/api/comments/:id', requireAuth, permission('comment:moderate'), async (req, res) => {
  const status = String(req.body?.status || '');
  if (!['APPROVED','REJECTED','SPAM','HIDDEN','DELETED'].includes(status)) return res.status(400).json({ success: false, message: 'Status moderasi tidak valid.' });
  await pool.query(`UPDATE comments SET status=?, moderated_at=NOW(), moderated_by=? WHERE id=?`, [status, (req as any).user.userId, req.params.id]);
  res.json({ success: true });
});

app.get('/api/submissions', requireAuth, permission('submission:review'), async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT id, title, category, author_name AS authorName, email AS authorEmail, institution AS authorOrg, content, submitted_at AS submittedAt, status FROM submissions ORDER BY submitted_at DESC`);
  res.json({ success: true, data: rows });
});
app.post('/api/submissions', rateLimit(clientKey, 5, 60 * 60), async (req, res) => {
  const body = req.body || {};
  if (!body.title || !body.content || !body.authorName) return res.status(400).json({ success: false, message: 'Judul, nama penulis, dan isi wajib diisi.' });
  const id = `sub-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  await pool.query(`INSERT INTO submissions (id, title, category, author_name, email, institution, content) VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, sanitize(body.title), sanitize(body.category || 'Opini'), sanitize(body.authorName), sanitize(body.authorEmail || ''), sanitize(body.authorOrg || ''), sanitize(body.content)]);
  res.status(201).json({ success: true, data: { id, ...body, submittedAt: new Date().toISOString(), status: 'SUBMITTED' } });
});
app.post('/api/submissions/:id/publish', requireAuth, permission('submission:publish'), async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM submissions WHERE id=? LIMIT 1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ success:false, message:'Naskah warga tidak ditemukan.' });
  const row = rows[0];
  if (String(row.status) === 'PUBLISHED') return res.status(409).json({ success:false, message:'Naskah sudah diterbitkan.' });
  const id = `art-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const title = sanitize(row.title);
  const slug = `${title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 210)}-${Date.now().toString().slice(-6)}`;
  await repository.saveArticle({ id, slug, title, excerpt: sanitize(String(row.content).slice(0, 220)), content: sanitize(row.content), category: sanitize(row.category || 'Opini'), pillar: 'OPINI', authorId: (req as any).user.userId, status: 'PUBLISHED', publishedAt: new Date() }, (req as any).user.userId);
  await pool.query(`UPDATE submissions SET status='PUBLISHED', reviewed_at=NOW(), reviewed_by=? WHERE id=?`, [(req as any).user.userId, req.params.id]);
  res.status(201).json({ success:true, data: await repository.findArticle(id) });
});
app.delete('/api/submissions/:id', requireAuth, permission('submission:review'), async (req, res) => { await pool.query(`UPDATE submissions SET status='REJECTED', reviewed_at=NOW(), reviewed_by=? WHERE id=?`, [(req as any).user.userId, req.params.id]); res.json({ success: true }); });

app.post('/api/newsletter', rateLimit(clientKey, 5, 60 * 60), async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ success: false, message: 'Email tidak valid.' });
  await pool.query(`INSERT INTO subscribers (email) VALUES (?) ON DUPLICATE KEY UPDATE is_active=1`, [email]);
  res.json({ success: true });
});

app.get('/api/settings', async (_req, res) => { const [rows] = await pool.query<RowDataPacket[]>(`SELECT data FROM site_settings WHERE id=1 LIMIT 1`); res.json({ success: true, data: rows.length ? (typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data) : null }); });
app.post('/api/settings', requireAuth, permission('settings:manage'), async (req, res) => { await pool.query(`INSERT INTO site_settings (id,data) VALUES (1,?) ON DUPLICATE KEY UPDATE data=VALUES(data), updated_at=NOW()`, [JSON.stringify(req.body)]); res.json({ success: true, data: req.body }); });
app.get('/api/pages', async (_req, res) => { const [rows] = await pool.query<RowDataPacket[]>(`SELECT id,slug,title,content,updated_at AS updatedAt FROM pages ORDER BY title`); res.json({ success: true, data: rows }); });
app.get('/api/pages/:slug', async (req, res) => { const [rows] = await pool.query<RowDataPacket[]>(`SELECT id,slug,title,content,updated_at AS updatedAt FROM pages WHERE slug=? LIMIT 1`, [req.params.slug]); if (!rows.length) return res.status(404).json({ success:false }); res.json({ success:true, data:rows[0] }); });
app.post('/api/pages', requireAuth, permission('settings:manage'), async (req, res) => { const id = String(req.body.id || `page-${Date.now()}`); await pool.query(`INSERT INTO pages (id,slug,title,content) VALUES (?,?,?,?)`, [id, sanitize(req.body.slug), sanitize(req.body.title), sanitize(req.body.content)]); res.status(201).json({ success:true, data:{ id, ...req.body } }); });
app.put('/api/pages/:id', requireAuth, permission('settings:manage'), async (req, res) => { await pool.query(`UPDATE pages SET slug=?,title=?,content=? WHERE id=?`, [sanitize(req.body.slug), sanitize(req.body.title), sanitize(req.body.content), req.params.id]); res.json({ success:true, data:{ id:req.params.id, ...req.body } }); });
app.delete('/api/pages/:id', requireAuth, permission('settings:manage'), async (req, res) => { await pool.query(`DELETE FROM pages WHERE id=?`, [req.params.id]); res.json({ success:true }); });

app.get('/api/stats', async (_req, res) => {
  const [[articles]] = await pool.query<any[]>(`SELECT COUNT(*) totalArticles, COALESCE(SUM(views),0) totalViews FROM articles WHERE status <> 'ARCHIVED'`);
  const [[submissions]] = await pool.query<any[]>(`SELECT COUNT(*) totalSubmissions FROM submissions`);
  const [[subscribers]] = await pool.query<any[]>(`SELECT COUNT(*) subscribersCount FROM subscribers WHERE is_active=1`);
  const [[categories]] = await pool.query<any[]>(`SELECT COUNT(DISTINCT category) totalCategories FROM articles`);
  res.json({ success:true, data:{ ...articles, ...submissions, ...subscribers, ...categories, serverTime:new Date().toISOString() } });
});

app.post('/api/upload', requireAuth, permission('media:upload'), async (req, res) => {
  const raw = String(req.body?.imageBase64 || '');
  const match = raw.match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/i);
  if (!match) return res.status(400).json({ success:false, message:'Format gambar tidak didukung.' });
  const ext = match[1].toLowerCase().replace('jpeg','jpg'); const id = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
  const fileName = `${id}.${ext}`; const target = path.join(uploadDir, fileName); const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 10 * 1024 * 1024) return res.status(413).json({ success:false, message:'Ukuran gambar maksimal 10MB.' });
  const metadata = await sharp(buffer).rotate().resize({ width: 2400, withoutEnlargement: true }).toFile(target);
  await pool.query(`INSERT INTO media (id,uploaded_by,original_name,mime_type,storage_path,width,height,size_bytes) VALUES (?,?,?,?,?,?,?,?)`, [id,(req as any).user.userId,`${id}.${ext}`,`image/${ext === 'jpg' ? 'jpeg' : ext}`,`/uploads/${fileName}`,metadata.width || null,metadata.height || null,buffer.length]);
  res.json({ success:true, url:`/uploads/${fileName}` });
});

app.use(express.static(distPath, { index: 'index.html', maxAge: '1h' }));
app.get('*', (req, res, next) => { if (req.path.startsWith('/api/')) return next(); res.sendFile(path.join(distPath, 'index.html')); });
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => { console.error('[server]', error); res.status(500).json({ success:false, message:'Internal server error' }); });

const shutdown = async () => { await Promise.allSettled([repository.close(), rateLimiter.close(), pool.end()]); process.exit(0); };
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);

app.listen(PORT, () => console.log(`[LIBERTAMEDIA] Production server listening on :${PORT}`));
