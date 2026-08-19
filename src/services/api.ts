import { Article, CitizenSubmission, CategoryType } from '../types';

export interface ServerStats {
  totalArticles: number;
  totalSubmissions: number;
  totalViews: number;
  totalCategories: number;
  subscribersCount: number;
  serverTime: string;
}

let _tokenCache: string | null = typeof window !== 'undefined' ? sessionStorage.getItem('liberta_admin_token') : null;

function getAdminToken(): string | null {
  if (!_tokenCache && typeof window !== 'undefined') {
    try { _tokenCache = sessionStorage.getItem('liberta_admin_token'); } catch {}
  }
  return _tokenCache;
}

function setAdminToken(token: string | null): void {
  _tokenCache = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) sessionStorage.setItem('liberta_admin_token', token);
      else sessionStorage.removeItem('liberta_admin_token');
    } catch {}
  }
}

function getAdminAuthHeaders(): Record<string, string> {
  const token = getAdminToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function safeJsonResponse(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (res.status === 401 || res.status === 403) throw new Error('Sesi autentikasi telah berakhir. Silakan login kembali.');
    throw new Error(`Server cPanel merespons HTML (${res.status}). Silakan pastikan rute API berjalan.`);
  }
  return res.json();
}

export const api = {
  setAuthToken(token: string | null) { setAdminToken(token); },
  getAuthToken(): string | null { return getAdminToken(); },
  getAuthHeaders(): Record<string, string> { return getAdminAuthHeaders(); },

  async login(password: string, email?: string) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) throw new Error('Email dan password wajib diisi');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });
    const data = await safeJsonResponse(res);
    if (!res.ok || !data?.success || !data?.token) throw new Error(data?.message || 'Email atau password tidak valid');
    setAdminToken(data.token);
    return data;
  },

  async logout() {
    const headers = getAdminAuthHeaders();
    await fetch('/api/auth/logout', { method: 'POST', headers }).catch(() => {});
    setAdminToken(null);
  },

  async getMe() {
    const res = await fetch('/api/auth/me', { headers: getAdminAuthHeaders() });
    return safeJsonResponse(res);
  },

  async getArticles(params?: { category?: CategoryType; pillar?: string; tag?: string; q?: string; page?: number; limit?: number }): Promise<Article[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.category && params.category !== 'Semua') searchParams.append('category', params.category);
      if (params?.pillar) searchParams.append('pillar', params.pillar);
      if (params?.tag) searchParams.append('tag', params.tag);
      if (params?.q) searchParams.append('q', params.q);
      if (params?.page) searchParams.append('page', String(params.page));
      if (params?.limit) searchParams.append('limit', String(params.limit));
      const query = searchParams.toString();
      const res = await fetch(`/api/articles${query ? `?${query}` : ''}`);
      if (!res.ok) throw new Error('Gagal mengambil data artikel');
      const data = await safeJsonResponse(res);
      return data.data || [];
    } catch (err) { console.warn('API getArticles:', err); return []; }
  },

  async getArticleById(id: string): Promise<Article | null> {
    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error('Artikel tidak ditemukan');
      const data = await safeJsonResponse(res);
      return data.data;
    } catch (err) { console.warn('API getArticleById:', err); return null; }
  },

  async createArticle(articleData: Partial<Article>): Promise<Article> {
    const res = await fetch('/api/articles', { method: 'POST', headers: getAdminAuthHeaders(), body: JSON.stringify(articleData) });
    const data = await safeJsonResponse(res).catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Gagal membuat artikel');
    return data.data;
  },

  async updateArticle(id: string, articleData: Partial<Article>): Promise<Article> {
    const res = await fetch(`/api/articles/${encodeURIComponent(id)}`, { method: 'PUT', headers: getAdminAuthHeaders(), body: JSON.stringify(articleData) });
    const data = await safeJsonResponse(res).catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Gagal memperbarui artikel');
    return data.data;
  },

  async deleteArticle(id: string): Promise<boolean> {
    const res = await fetch(`/api/articles/${encodeURIComponent(id)}`, { method: 'DELETE', headers: getAdminAuthHeaders() });
    return res.ok;
  },

  async sendReaction(articleId: string, type: 'claps' | 'insightful' | 'inspiring' | 'critical', delta: 1 | -1 = 1) {
    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(articleId)}/reactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, delta }) });
      if (!res.ok) return null;
      const data = await safeJsonResponse(res);
      return data.reactions;
    } catch (err) { console.warn('Reaction API error:', err); return null; }
  },

  async addComment(articleId: string, author: string, content: string) {
    const res = await fetch(`/api/articles/${encodeURIComponent(articleId)}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ author, content }) });
    const data = await safeJsonResponse(res).catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Gagal mengirim komentar');
    return data;
  },

  async getSubmissions(): Promise<CitizenSubmission[]> {
    try {
      const res = await fetch('/api/submissions', { headers: getAdminAuthHeaders() });
      if (!res.ok) return [];
      const data = await safeJsonResponse(res);
      return data.data || [];
    } catch (err) { console.warn('Get submissions:', err); return []; }
  },

  async submitCitizenStory(submission: Omit<CitizenSubmission, 'id' | 'submittedAt'>): Promise<CitizenSubmission> {
    const res = await fetch('/api/submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submission) });
    const data = await safeJsonResponse(res).catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Gagal mengirim tulisan');
    return data.data;
  },

  async publishSubmission(submissionId: string): Promise<Article> {
    const res = await fetch(`/api/submissions/${encodeURIComponent(submissionId)}/publish`, { method: 'POST', headers: getAdminAuthHeaders() });
    const data = await safeJsonResponse(res).catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Gagal menerbitkan naskah warga');
    return data.data;
  },

  async deleteSubmission(submissionId: string): Promise<boolean> {
    const res = await fetch(`/api/submissions/${encodeURIComponent(submissionId)}`, { method: 'DELETE', headers: getAdminAuthHeaders() });
    return res.ok;
  },

  async getStats(): Promise<ServerStats | null> {
    try {
      const res = await fetch('/api/stats', { headers: getAdminAuthHeaders() });
      if (!res.ok) return null;
      const data = await safeJsonResponse(res);
      return data.data;
    } catch { return null; }
  },

  async subscribeNewsletter(email: string): Promise<boolean> {
    try {
      const res = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      return res.ok;
    } catch { return false; }
  },

  async uploadImage(file: File): Promise<string> {
    if (file.size > 10 * 1024 * 1024) throw new Error('Ukuran gambar maksimal 10MB');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Format gambar hanya PNG, JPEG, atau WebP');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await fetch('/api/upload', { method: 'POST', headers: getAdminAuthHeaders(), body: JSON.stringify({ imageBase64: reader.result as string }) });
          const data = await safeJsonResponse(res);
          if (!res.ok) throw new Error(data.message || 'Gagal meng-upload gambar');
          resolve(data.url);
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  async getSettings(): Promise<any> {
    try { const res = await fetch('/api/settings'); if (res.ok) { const data = await safeJsonResponse(res); return data.data || null; } } catch (err) { console.warn('API getSettings:', err); }
    return null;
  },

  async saveSettings(settingsData: any): Promise<any> {
    const res = await fetch('/api/settings', { method: 'POST', headers: getAdminAuthHeaders(), body: JSON.stringify(settingsData) });
    const data = await safeJsonResponse(res).catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
    return data.data || data;
  },

  async getPages(): Promise<any[]> {
    try { const res = await fetch('/api/pages'); if (!res.ok) return []; const data = await safeJsonResponse(res); return data.data || []; } catch { return []; }
  },

  async getPageBySlug(slug: string): Promise<any | null> {
    try { const res = await fetch(`/api/pages/${encodeURIComponent(slug)}`); if (!res.ok) return null; const data = await safeJsonResponse(res); return data.data; } catch { return null; }
  },
};
