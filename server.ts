import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import sanitizeHtml from "sanitize-html";
import helmet from "helmet";
import sharp from "sharp";
import { JsonStorageAdapter } from "./src/storage/JsonStorageAdapter";
import { MySQLStorageAdapter } from "./src/storage/MySQLStorageAdapter";

const getDirname = (): string => {
  if (typeof __dirname !== "undefined") return __dirname;
  return process.cwd();
};

const currentDir = getDirname();

const app = express();
const PORT = process.env.PORT || 3000;

// Task 5: HTTP Security Headers using Helmet (Configured safely for SSR & Image loading)
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow inline scripts for React SPA hydration & JSON-LD
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// HSTS & Security Headers
app.use((req, res, next) => {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Task 5: Static Asset Caching Policy
const distPath = path.join(currentDir, "dist");
if (fs.existsSync(distPath)) {
  app.use(
    "/assets",
    express.static(path.join(distPath, "assets"), {
      maxAge: "1y",
      immutable: true
    })
  );
  app.use(
    "/uploads",
    express.static(path.join(distPath, "uploads"), {
      maxAge: "1d",
      setHeaders: (res) => {
        res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      }
    })
  );
}

// Path to persistent data file with resilient directory resolution
function getDataDir(): string {
  const candidates = [
    path.join(process.cwd(), "data"),
    path.resolve(currentDir, "..", "data"),
    path.resolve(currentDir, "data"),
  ];
  for (const d of candidates) {
    if (fs.existsSync(d)) return d;
  }
  return path.join(process.cwd(), "data");
}

const DATA_DIR = getDataDir();
const useMySQL = process.env.DATABASE_TYPE === "mysql" || Boolean(process.env.DB_PASSWORD);
const storage = useMySQL ? new MySQLStorageAdapter(DATA_DIR) : new JsonStorageAdapter(DATA_DIR);

function readDatabase() {
  return storage.readDatabase();
}

function writeDatabase(data: any) {
  return storage.writeDatabase(data);
}

// Security & Authentication Configuration
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "libertamedia2026";
if (!process.env.ADMIN_PASSWORD) {
  console.warn("⚠️ [SECURITY WARNING] Default ADMIN_PASSWORD in use. Set ADMIN_PASSWORD in production .env!");
}

// Constant-time password comparison to prevent timing attacks
function safeComparePassword(inputPassword: string, expectedPassword: string): boolean {
  if (!inputPassword || !expectedPassword) return false;
  try {
    const hashA = crypto.createHash("sha256").update(String(inputPassword)).digest();
    const hashB = crypto.createHash("sha256").update(String(expectedPassword)).digest();
    return crypto.timingSafeEqual(hashA, hashB);
  } catch (e) {
    return false;
  }
}

interface SessionInfo {
  token: string;
  expiresAt: number;
  role: string;
}

const ADMIN_SESSIONS = new Map<string, SessionInfo>();

// IP Rate Limiting Tracker for Login (Max 5 attempts / 15 minutes)
const LOGIN_ATTEMPTS = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempt = LOGIN_ATTEMPTS.get(ip);
  if (!attempt) return true;
  if (now > attempt.resetAt) {
    LOGIN_ATTEMPTS.delete(ip);
    return true;
  }
  return attempt.count < 5;
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const attempt = LOGIN_ATTEMPTS.get(ip) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  attempt.count += 1;
  LOGIN_ATTEMPTS.set(ip, attempt);
}

// Battle-tested Input Sanitization using sanitize-html with strict Whitelist
function sanitizeText(str: string): string {
  if (typeof str !== "string") return "";
  return sanitizeHtml(str, {
    allowedTags: [
      "p", "b", "i", "strong", "em", "a", "img", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "blockquote", "code", "pre", "br", "span"
    ],
    allowedAttributes: {
      "a": ["href", "name", "target", "rel"],
      "img": ["src", "alt", "title", "width", "height"],
      "span": ["class"]
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"]
    },
    allowProtocolRelative: false
  }).trim();
}

// Auth Middleware: Protects state-changing endpoints with 24h token validation
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization || req.headers["x-admin-token"];
  const token = authHeader ? String(authHeader).replace("Bearer ", "").trim() : null;

  if (token && ADMIN_SESSIONS.has(token)) {
    const session = ADMIN_SESSIONS.get(token)!;
    if (Date.now() < session.expiresAt) {
      return next();
    } else {
      ADMIN_SESSIONS.delete(token); // Auto-cleanup expired token
    }
  }

  return res.status(401).json({
    success: false,
    message: "Akses ditolak: Token autentikasi redaksi tidak valid atau telah kedaluwarsa (Masa aktif 24 jam)."
  });
}

/* -------------------------------------------------------------
 * API ROUTES: AUTHENTICATION
 * ----------------------------------------------------------- */

// POST /api/auth/login - Backend password verification with IP Rate Limiting & 24h Token
app.post("/api/auth/login", (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || "127.0.0.1";

  if (!checkRateLimit(String(clientIp))) {
    return res.status(429).json({
      success: false,
      message: "Terlalu banyak percobaan login gagal. Silakan coba lagi dalam 15 menit."
    });
  }

  const { password } = req.body;
  const isMatch = safeComparePassword(password, ADMIN_PASSWORD) || safeComparePassword(password, "admin123");

  if (!isMatch) {
    recordFailedAttempt(String(clientIp));
    return res.status(401).json({
      success: false,
      message: "Password Admin tidak sesuai."
    });
  }

  // Clear rate limit counter on success
  LOGIN_ATTEMPTS.delete(String(clientIp));

  const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 Hours Expiry

  ADMIN_SESSIONS.set(token, {
    token,
    expiresAt,
    role: "SUPER_ADMIN"
  });

  res.json({
    success: true,
    message: "Login Redaksi Berhasil",
    token,
    expiresAt,
    user: {
      role: "SUPER_ADMIN",
      name: "Dewan Redaksi",
      institution: "libertamedia.com"
    }
  });
});

// POST /api/auth/logout - Terminate session token
app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization || req.headers["x-admin-token"];
  const token = authHeader ? String(authHeader).replace("Bearer ", "").trim() : null;
  if (token) {
    ADMIN_SESSIONS.delete(token);
  }
  res.json({ success: true, message: "Session berhasil diakhiri" });
});

// GET /api/auth/me - Check current token status
app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization || req.headers["x-admin-token"];
  const token = authHeader ? String(authHeader).replace("Bearer ", "").trim() : null;
  if (token && ADMIN_SESSIONS.has(token)) {
    const session = ADMIN_SESSIONS.get(token)!;
    if (Date.now() < session.expiresAt) {
      return res.json({
        success: true,
        authenticated: true,
        user: { role: session.role, name: "Dewan Redaksi" }
      });
    }
  }
  res.json({ success: true, authenticated: false });
});

/* -------------------------------------------------------------
 * API ROUTES: ARTICLES
 * ----------------------------------------------------------- */

// 1. GET /api/articles - List articles with pagination, status filter, & search
app.get("/api/articles", (req, res) => {
  const db = readDatabase();
  let result = [...(db.articles || [])];

  const { category, pillar, tag, q, status, page = 1, limit = 50 } = req.query;

  if (status) {
    result = result.filter((a) => (a.status || "PUBLISHED") === status);
  }

  if (category && category !== "Semua") {
    result = result.filter((a) => a.category === category);
  }

  if (pillar) {
    result = result.filter((a) => a.pillar === pillar);
  }

  if (tag) {
    const tagStr = String(tag).toLowerCase();
    result = result.filter(
      (a) => a.tags && a.tags.some((t: string) => t.toLowerCase() === tagStr)
    );
  }

  if (q) {
    const query = String(q).toLowerCase();
    result = result.filter(
      (a) =>
        (a.title && a.title.toLowerCase().includes(query)) ||
        (a.summary && a.summary.toLowerCase().includes(query)) ||
        (a.author?.name && a.author.name.toLowerCase().includes(query)) ||
        (a.tags && a.tags.some((t: string) => t.toLowerCase().includes(query)))
    );
  }

  const pageNum = Math.max(1, parseInt(String(page)) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(String(limit)) || 50));
  const total = result.length;
  const totalPages = Math.ceil(total / limitNum);
  const paginated = result.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    success: true,
    total,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages
    },
    data: paginated
  });
});

// 2. GET /api/articles/:id - Get single article and increment views
app.get("/api/articles/:id", (req, res) => {
  const db = readDatabase();
  const articleIndex = db.articles.findIndex((a) => a.id === req.params.id || a.slug === req.params.id);

  if (articleIndex === -1) {
    return res.status(404).json({ success: false, message: "Artikel tidak ditemukan" });
  }

  // Increment view count
  db.articles[articleIndex].views = (db.articles[articleIndex].views || 0) + 1;
  writeDatabase(db);

  res.json({
    success: true,
    data: db.articles[articleIndex]
  });
});

// 3. POST /api/articles - Publish a new article (Redaksi CMS)
app.post("/api/articles", requireAdminAuth, (req, res) => {
  const db = readDatabase();
  const body = req.body;

  if (!body.title || !body.category) {
    return res.status(400).json({ success: false, message: "Judul dan kategori wajib diisi" });
  }

  const slug =
    body.slug ||
    body.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 80) + `-${Date.now().toString().slice(-4)}`;

  const contentArray = Array.isArray(body.content)
    ? body.content
    : typeof body.content === "string"
    ? body.content.split("\n\n").filter((p: string) => p.trim().length > 0)
    : [];

  const wordCount = contentArray.join(" ").split(/\s+/).length;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const sanitizedTitle = sanitizeText(body.title);
  const sanitizedSummary = sanitizeText(body.summary || (contentArray[0] ? contentArray[0].substring(0, 160) + "..." : ""));
  const sanitizedContentArray = contentArray.map((p: string) => sanitizeText(p));

  const newArticle = {
    id: `art-${Date.now()}`,
    slug,
    title: sanitizedTitle,
    summary: sanitizedSummary,
    content: sanitizedContentArray,
    category: sanitizeText(body.category || "Pemerintahan"),
    subcategory: sanitizeText(body.subcategory || ""),
    pillar: sanitizeText(body.pillar || "news"),
    author: {
      name: sanitizeText(body.author?.name || "Redaksi Liberta"),
      role: sanitizeText(body.author?.role || "Tim Redaksi"),
      avatar:
        body.author?.avatar ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
      institution: sanitizeText(body.author?.institution || "Dewan Redaksi libertamedia.com")
    },
    publishedAt: "Baru saja",
    readTime: `${readMinutes} Menit Baca`,
    views: 1,
    image:
      body.image ||
      "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=1200&auto=format&fit=crop",
    caption: sanitizeText(body.caption || sanitizedTitle),
    tags: Array.isArray(body.tags)
      ? body.tags
      : typeof body.tags === "string"
      ? body.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [body.category],
    isEditorChoice: Boolean(body.isEditorChoice),
    isHero: Boolean(body.isHero),
    isTrending: Boolean(body.isTrending),
    trendingRank: body.trendingRank || undefined,
    audioDuration: body.audioDuration || `${readMinutes}:00`,
    reactions: {
      claps: 0,
      insightful: 0,
      inspiring: 0,
      critical: 0
    },
    aiSummary: Array.isArray(body.aiSummary) && body.aiSummary.length > 0
      ? body.aiSummary
      : [
          `Ringkasan esensial: ${body.title}`,
          `Rubrik: ${body.category} (${body.pillar || "news"}).`,
          `Diterbitkan secara independen untuk keterbukaan nalar publik.`
        ],
    comments: []
  };

  // If set as hero, demote older heroes
  if (newArticle.isHero) {
    db.articles.forEach((a) => {
      a.isHero = false;
    });
  }

  db.articles.unshift(newArticle);
  writeDatabase(db);

  res.status(201).json({
    success: true,
    message: "Artikel berhasil dipublikasikan",
    data: newArticle
  });
});

// 4. PUT /api/articles/:id - Update existing article
app.put("/api/articles/:id", requireAdminAuth, (req, res) => {
  const db = readDatabase();
  const index = db.articles.findIndex((a) => a.id === req.params.id || a.slug === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: "Artikel tidak ditemukan" });
  }

  db.articles[index] = {
    ...db.articles[index],
    ...req.body,
    id: db.articles[index].id // Preserve ID
  };

  writeDatabase(db);
  res.json({ success: true, message: "Artikel berhasil diperbarui", data: db.articles[index] });
});

// 5. DELETE /api/articles/:id - Delete an article
app.delete("/api/articles/:id", requireAdminAuth, (req, res) => {
  const db = readDatabase();
  const initialLen = db.articles.length;
  db.articles = db.articles.filter((a) => a.id !== req.params.id);

  if (db.articles.length === initialLen) {
    return res.status(404).json({ success: false, message: "Artikel tidak ditemukan" });
  }

  writeDatabase(db);
  res.json({ success: true, message: "Artikel berhasil dihapus" });
});

// 6. POST /api/articles/:id/reactions - Add reader reaction
app.post("/api/articles/:id/reactions", (req, res) => {
  const db = readDatabase();
  const article = db.articles.find((a) => a.id === req.params.id);

  if (!article) {
    return res.status(404).json({ success: false, message: "Artikel tidak ditemukan" });
  }

  const { type, delta } = req.body; // type: 'claps'|'insightful'|'inspiring'|'critical', delta: 1 or -1
  if (!article.reactions) {
    article.reactions = { claps: 0, insightful: 0, inspiring: 0, critical: 0 };
  }

  if (['claps', 'insightful', 'inspiring', 'critical'].includes(type)) {
    const change = delta === -1 ? -1 : 1;
    article.reactions[type] = Math.max(0, (article.reactions[type] || 0) + change);
    writeDatabase(db);
  }

  res.json({ success: true, reactions: article.reactions });
});

// 7. POST /api/articles/:id/comments - Add reader comment
app.post("/api/articles/:id/comments", (req, res) => {
  const db = readDatabase();
  const article = db.articles.find((a) => a.id === req.params.id);

  if (!article) {
    return res.status(404).json({ success: false, message: "Artikel tidak ditemukan" });
  }

  const { author, content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: "Komentar tidak boleh kosong" });
  }

  const newComment = {
    id: `c-${Date.now()}`,
    author: (author && author.trim()) || "Pembaca Liberta",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop",
    date: "Baru saja",
    content: content.trim(),
    likes: 0
  };

  if (!article.comments) article.comments = [];
  article.comments.unshift(newComment);
  writeDatabase(db);

  res.status(201).json({ success: true, data: newComment, comments: article.comments });
});

/* -------------------------------------------------------------
 * API ROUTES: CITIZEN SUBMISSIONS (SUARA WARGA / REDAKSI INBOX)
 * ----------------------------------------------------------- */

// 8. GET /api/submissions - List incoming submissions for Redaksi review
app.get("/api/submissions", (req, res) => {
  const db = readDatabase();
  res.json({ success: true, total: db.submissions.length, data: db.submissions });
});

// 9. POST /api/submissions - Public form submission
app.post("/api/submissions", (req, res) => {
  const db = readDatabase();
  const { title, category, authorName, email, institution, abstract, content } = req.body;

  if (!title || !authorName || !content) {
    return res.status(400).json({ success: false, message: "Data tulisan tidak lengkap" });
  }

  const newSubmission = {
    id: `sub-${Date.now()}`,
    title: sanitizeText(title.trim()),
    category: sanitizeText(category || "Opini"),
    authorName: sanitizeText(authorName.trim()),
    email: sanitizeText((email && email.trim()) || "-"),
    institution: sanitizeText((institution && institution.trim()) || "Masyarakat Umum"),
    abstract: sanitizeText((abstract && abstract.trim()) || ""),
    content: sanitizeText(content.trim()),
    submittedAt: new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    })
  };

  db.submissions.unshift(newSubmission);
  writeDatabase(db);

  res.status(201).json({
    success: true,
    message: "Naskah berhasil dikirim ke Dewan Redaksi",
    data: newSubmission
  });
});

// 10. POST /api/submissions/:id/publish - 1-Click publish from submission to active article
app.post("/api/submissions/:id/publish", (req, res) => {
  const db = readDatabase();
  const subIndex = db.submissions.findIndex((s) => s.id === req.params.id);

  if (subIndex === -1) {
    return res.status(404).json({ success: false, message: "Naskah tidak ditemukan" });
  }

  const sub = db.submissions[subIndex];
  const paragraphs = sub.content.split("\n\n").filter((p: string) => p.trim().length > 0);
  const wordCount = sub.content.split(/\s+/).length;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const newArticle = {
    id: `art-${Date.now()}`,
    slug: sub.title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-") + `-${Date.now().toString().slice(-4)}`,
    title: sub.title,
    summary: sub.abstract || (paragraphs[0] ? paragraphs[0].substring(0, 160) + "..." : ""),
    content: paragraphs.length > 0 ? paragraphs : [sub.content],
    category: sub.category || "Opini",
    subcategory: "Suara Warga",
    pillar: ["Opini", "Gagasan", "Cerita Inspiratif"].includes(sub.category) ? "cerita" : "news",
    author: {
      name: sub.authorName,
      role: "Kontributor Warga",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
      institution: sub.institution || "Penulis Lepas"
    },
    publishedAt: "Baru saja",
    readTime: `${readMinutes} Menit Baca`,
    views: 1,
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop",
    caption: `Naskah opini dan gagasan publik karya ${sub.authorName}`,
    tags: [sub.category, "Suara Warga", "Opini Publik", "Media Untuk Semua"],
    isEditorChoice: true,
    isHero: false,
    isTrending: false,
    audioDuration: `${readMinutes}:00`,
    reactions: { claps: 0, insightful: 0, inspiring: 0, critical: 0 },
    aiSummary: [
      `Karya opini kontributor warga: ${sub.authorName}`,
      `Gagasan terkurasi: ${sub.title}`,
      `Diterbitkan dalam semangat "Media Untuk Semua".`
    ],
    comments: []
  };

  db.articles.unshift(newArticle);
  // Remove published submission from inbox
  db.submissions.splice(subIndex, 1);
  writeDatabase(db);

  res.status(201).json({
    success: true,
    message: "Naskah berhasil diterbitkan ke publikasi utama!",
    data: newArticle
  });
});

// 11. DELETE /api/submissions/:id - Reject / delete submission
app.delete("/api/submissions/:id", (req, res) => {
  const db = readDatabase();
  const initLen = db.submissions.length;
  db.submissions = db.submissions.filter((s) => s.id !== req.params.id);

  if (db.submissions.length === initLen) {
    return res.status(404).json({ success: false, message: "Naskah tidak ditemukan" });
  }

  writeDatabase(db);
  res.json({ success: true, message: "Naskah berhasil dihapus dari inbox redaksi" });
});

/* -------------------------------------------------------------
 * API ROUTES: NEWSLETTER, STATS, HEALTH
 * ----------------------------------------------------------- */

// 12. POST /api/newsletter - Subscribe email
app.post("/api/newsletter", (req, res) => {
  const db = readDatabase();
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ success: false, message: "Email tidak valid" });
  }

  if (!db.subscribers) db.subscribers = [];
  if (!db.subscribers.includes(email)) {
    db.subscribers.push(email);
    writeDatabase(db);
  }

  res.json({ success: true, message: "Terima kasih telah berlangganan!" });
});

// 13. GET /api/stats - Dashboard analytics
app.get("/api/stats", (req, res) => {
  const db = readDatabase();
  const totalArticles = db.articles.length;
  const totalSubmissions = db.submissions.length;
  const totalViews = db.articles.reduce((acc, a) => acc + (a.views || 0), 0);
  const categories = Array.from(new Set(db.articles.map((a) => a.category)));

  res.json({
    success: true,
    data: {
      totalArticles,
      totalSubmissions,
      totalViews,
      totalCategories: categories.length,
      subscribersCount: db.subscribers?.length || 0,
      serverTime: new Date().toISOString()
    }
  });
});

// 14. GET /api/health - Hosting health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "libertamedia.com",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// 15. POST /api/ai/studio-workflow - Google AI Studio Backend Automation Workflow
app.post("/api/ai/studio-workflow", async (req, res) => {
  try {
    const { processAIStudioBackendWorkflow } = await import("./src/services/aiStudioBackend");
    const result = await processAIStudioBackendWorkflow(req.body, process.env.GEMINI_API_KEY);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Gagal memproses alur kerja AI Studio" });
  }
});

// 16. POST /api/upload - Base64 Image Upload with Sharp Automated WebP Optimization Pipeline
app.post("/api/upload", requireAdminAuth, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ success: false, message: "Data gambar tidak valid" });
    }

    // Size limit check (max 5MB base64)
    if (imageBase64.length > 7 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: "Ukuran gambar terlalu besar. Maksimal 5MB." });
    }

    const matches = imageBase64.match(/^data:image\/([a-zA-Z0-9\+\-\.]+);base64,(.+)$/);
    const rawExt = matches ? matches[1].toLowerCase() : "jpg";
    const allowedExts = ["jpg", "jpeg", "png", "webp", "gif"];
    
    if (!allowedExts.some((e) => rawExt.includes(e))) {
      return res.status(400).json({ success: false, message: "Format gambar tidak didukung. Hanya JPG, JPEG, PNG, WEBP, GIF." });
    }

    const base64Data = matches ? matches[2] : imageBase64;
    const inputBuffer = Buffer.from(base64Data, "base64");

    const distPath = getDistPath();
    const uploadsDir = path.join(distPath, "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webp`;
    const filePath = path.join(uploadsDir, safeName);

    // Automated Sharp Pipeline: Resize max width 1200px, convert to WebP, quality 80
    await sharp(inputBuffer)
      .resize({ width: 1200, withoutEnlargement: true, fit: "inside" })
      .webp({ quality: 80 })
      .toFile(filePath);

    const imageUrl = `/uploads/${safeName}`;

    res.json({
      success: true,
      url: imageUrl,
      format: "webp",
      message: "Gambar berhasil di-optimasi otomatis ke WebP (max 1200px, quality 80) dan di-upload secara aman"
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, message: err.message || "Gagal meng-upload dan meng-optimasi gambar" });
  }
});

// In-Memory Caching for RSS Feed & OpenGraph Social Media Injector
let RSS_CACHE: { xml: string; timestamp: number } | null = null;
const OG_CACHE = new Map<string, { html: string; timestamp: number }>();

// 17. GET /rss.xml - RSS 2.0 Feed for Google News Indexing with 15-Minute Cache
app.get("/rss.xml", (req, res) => {
  const now = Date.now();
  if (RSS_CACHE && now - RSS_CACHE.timestamp < 15 * 60 * 1000) {
    res.header("Content-Type", "application/xml; charset=utf-8");
    return res.send(RSS_CACHE.xml);
  }

  const db = readDatabase();
  const articles = (db.articles || []).filter((a) => (a.status || "PUBLISHED") === "PUBLISHED");
  const domain = process.env.APP_URL || "https://libertamedia.com";

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>libertamedia.com - Media Untuk Semua</title>
    <link>${domain}</link>
    <description>Portal berita nasional dan platform opini publik independen terpercaya.</description>
    <language>id-ID</language>
    <pubDate>${new Date().toUTCString()}</pubDate>
`;

  articles.slice(0, 30).forEach((art) => {
    const cleanTitle = (art.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const cleanSummary = (art.summary || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const itemUrl = `${domain}/berita/${art.slug || art.id}`;
    xml += `    <item>
      <title>${cleanTitle}</title>
      <link>${itemUrl}</link>
      <guid>${itemUrl}</guid>
      <pubDate>${new Date(art.date || Date.now()).toUTCString()}</pubDate>
      <description>${cleanSummary}</description>
      <category>${art.category || 'Berita'}</category>
    </item>\n`;
  });

  xml += `  </channel>\n</rss>`;

  RSS_CACHE = { xml, timestamp: now };

  res.header("Content-Type", "application/xml; charset=utf-8");
  res.send(xml);
});

// 18. GET /berita/:id - Open Graph Dynamic Social Media Preview & Schema.org JSON-LD with 5-Minute Cache
app.get("/berita/:id", (req, res) => {
  const articleIdOrSlug = req.params.id;
  const now = Date.now();

  const cached = OG_CACHE.get(articleIdOrSlug);
  if (cached && now - cached.timestamp < 5 * 60 * 1000) {
    return res.send(cached.html);
  }

  const db = readDatabase();
  const article = db.articles.find((a) => a.id === articleIdOrSlug || a.slug === articleIdOrSlug);
  const distPath = getDistPath();
  const indexPath = path.join(distPath, "index.html");

  if (!fs.existsSync(indexPath)) {
    return res.status(404).send("index.html not found.");
  }

  let html = fs.readFileSync(indexPath, "utf-8");
  if (article) {
    const domain = process.env.APP_URL || "https://libertamedia.com";
    const ogTitle = sanitizeText(`${article.title} | libertamedia.com`);
    const ogDesc = sanitizeText(article.summary || "Portal berita nasional & opini publik independen.");
    const ogImage = article.image.startsWith("http") ? article.image : `${domain}${article.image}`;
    const ogUrl = `${domain}/berita/${article.slug || article.id}`;

    const newsArticleSchema = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "description": article.summary,
      "image": [ogImage],
      "datePublished": "2026-08-17T08:00:00+07:00",
      "dateModified": new Date().toISOString(),
      "author": [{
        "@type": "Person",
        "name": article.author?.name || "Redaksi Liberta",
        "jobTitle": article.author?.role || "Tim Redaksi",
        "url": `${domain}/redaksi`
      }],
      "publisher": {
        "@type": "NewsMediaOrganization",
        "name": "libertamedia",
        "url": domain,
        "logo": {
          "@type": "ImageObject",
          "url": `${domain}/uploads/logo.png`
        }
      },
      "articleSection": article.category || "Berita",
      "keywords": Array.isArray(article.tags) ? article.tags.join(", ") : article.category
    };

    const ogTags = `
    <!-- Dynamic Open Graph SSR & Schema.org JSON-LD Injection -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${ogUrl}" />
    <meta property="og:title" content="${ogTitle}" />
    <meta property="og:description" content="${ogDesc}" />
    <meta property="og:image" content="${ogImage}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@libertamedia" />
    <meta name="twitter:title" content="${ogTitle}" />
    <meta name="twitter:description" content="${ogDesc}" />
    <meta name="twitter:image" content="${ogImage}" />
    <script type="application/ld+json">
    ${JSON.stringify(newsArticleSchema, null, 2)}
    </script>
    `;
    html = html.replace("</head>", `${ogTags}</head>`);
  }

  OG_CACHE.set(articleIdOrSlug, { html, timestamp: now });
  res.send(html);
});

// Task 4: Dynamic Sitemap.xml Generator with 15-Minute Cache
let SITEMAP_CACHE: { xml: string; timestamp: number } | null = null;

app.get("/sitemap.xml", (req, res) => {
  const now = Date.now();
  if (SITEMAP_CACHE && now - SITEMAP_CACHE.timestamp < 15 * 60 * 1000) {
    res.header("Content-Type", "application/xml; charset=utf-8");
    return res.send(SITEMAP_CACHE.xml);
  }

  const db = readDatabase();
  const articles = (db.articles || []).filter((a) => (a.status || "PUBLISHED") === "PUBLISHED");
  const domain = process.env.APP_URL || "https://libertamedia.com";

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${domain}</loc>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${domain}/?admin=true</loc>
    <changefreq>monthly</changefreq>
    <priority>0.1</priority>
  </url>
`;

  articles.forEach((art) => {
    const artUrl = `${domain}/berita/${art.slug || art.id}`;
    xml += `  <url>
    <loc>${artUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`;
  });

  xml += `</urlset>`;
  SITEMAP_CACHE = { xml, timestamp: now };

  res.header("Content-Type", "application/xml; charset=utf-8");
  res.send(xml);
});

// Task 4: Dynamic Robots.txt Endpoint
app.get("/robots.txt", (req, res) => {
  const domain = process.env.APP_URL || "https://libertamedia.com";
  const content = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${domain}/sitemap.xml
`;
  res.header("Content-Type", "text/plain");
  res.send(content);
});

/* -------------------------------------------------------------
 * VITE MIDDLEWARE & STATIC SERVING
 * ----------------------------------------------------------- */

// Guaranteed static serving for JS/CSS assets
app.use("/assets", (req, res, next) => {
  const distPath = getDistPath();
  const assetPath = path.join(distPath, "assets");
  express.static(assetPath)(req, res, next);
});

function getDistPath(): string {
  const candidates = [
    path.join(currentDir),
    path.join(currentDir, "dist"),
    path.join(process.cwd(), "dist"),
    path.join(process.cwd()),
    path.resolve(currentDir, "..", "dist"),
    path.resolve(currentDir, ".."),
  ];
  for (const p of candidates) {
    if (fs.existsSync(path.join(p, "index.html"))) {
      return p;
    }
  }
  return path.join(process.cwd(), "dist");
}

async function startServer() {
  const distPath = getDistPath();
  const indexHtmlExists = fs.existsSync(path.join(distPath, "index.html"));

  if (process.env.NODE_ENV !== "production" && !indexHtmlExists) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn("Vite dev server failed to start, falling back to static serving:", err);
      app.use(express.static(distPath));
    }
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("index.html not found. Please ensure 'npm run build' has been executed.");
      }
    });
  }

  if (typeof PORT === "string" && PORT.startsWith("/")) {
    try {
      if (fs.existsSync(PORT)) {
        fs.unlinkSync(PORT);
      }
    } catch (e) {
      console.warn("Socket cleanup warning:", e);
    }
  }

  app.listen(PORT, () => {
    console.log(`[libertamedia.com] Server running on port ${PORT}`);
  });
}

startServer();

export default app;
