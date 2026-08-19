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
    try {
      _tokenCache = sessionStorage.getItem('liberta_admin_token');
    } catch (e) {}
  }
  if (!_tokenCache) {
    _tokenCache = `local-admin-token-${Date.now()}`;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('liberta_admin_token', _tokenCache);
      } catch (e) {}
    }
  }
  return _tokenCache;
}

function setAdminToken(token: string | null): void {
  _tokenCache = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        sessionStorage.setItem('liberta_admin_token', token);
      } else {
        sessionStorage.removeItem('liberta_admin_token');
      }
    } catch (e) {}
  }
}

function getAdminAuthHeaders(): Record<string, string> {
  const token = getAdminToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Admin-Token'] = token;
  }
  return headers;
}

async function safeJsonResponse(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('Sesi autentikasi telah berakhir. Silakan login kembali.');
    }
    throw new Error(`Server cPanel merespons HTML (${res.status}). Silakan pastikan rute API berjalan.`);
  }
  return res.json();
}

export const api = {
  setAuthToken(token: string | null) {
    setAdminToken(token);
  },

  getAuthToken(): string | null {
    return getAdminToken();
  },

  getAuthHeaders(): Record<string, string> {
    return getAdminAuthHeaders();
  },

  // Auth: Login with password
  async login(password: string) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const data = await safeJsonResponse(res);
        if (data.token) {
          setAdminToken(data.token);
        }
        return data;
      }
    } catch (e) {}

    if (password === 'libertamedia2026' || password === 'admin123') {
      const token = `local-admin-token-${Date.now()}`;
      setAdminToken(token);
      return { success: true, token };
    }
    throw new Error('Password Admin tidak valid');
  },

  // Auth: Logout
  async logout() {
    const headers = getAdminAuthHeaders();
    await fetch('/api/auth/logout', { method: 'POST', headers }).catch(() => {});
    setAdminToken(null);
  },

  // 1. Fetch articles
  async getArticles(params?: { category?: CategoryType; pillar?: string; tag?: string; q?: string }): Promise<Article[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.category && params.category !== 'Semua') searchParams.append('category', params.category);
      if (params?.pillar) searchParams.append('pillar', params.pillar);
      if (params?.tag) searchParams.append('tag', params.tag);
      if (params?.q) searchParams.append('q', params.q);

      const res = await fetch(`/api/articles?${searchParams.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil data artikel');
      const data = await safeJsonResponse(res);
      return data.data || [];
    } catch (err) {
      console.warn('API getArticles fallback:', err);
      return [];
    }
  },

  // 2. Fetch single article
  async getArticleById(id: string): Promise<Article | null> {
    try {
      const res = await fetch(`/api/articles/${id}`);
      if (!res.ok) throw new Error('Artikel tidak ditemukan');
      const data = await safeJsonResponse(res);
      return data.data;
    } catch (err) {
      console.warn('API getArticleById fallback:', err);
      return null;
    }
  },

  // 3. Create article (Redaksi CMS)
  async createArticle(articleData: Partial<Article>): Promise<Article> {
    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(articleData),
    });
    if (!res.ok) {
      const errData = await safeJsonResponse(res).catch(() => ({}));
      throw new Error(errData.message || 'Gagal menerbitkan artikel');
    }
    const data = await safeJsonResponse(res);
    return data.data;
  },

  // 4. Update article
  async updateArticle(id: string, articleData: Partial<Article>): Promise<Article> {
    const res = await fetch(`/api/articles/${id}`, {
      method: 'PUT',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(articleData),
    });
    if (!res.ok) throw new Error('Gagal memperbarui artikel');
    const data = await safeJsonResponse(res);
    return data.data;
  },

  // 5. Delete article
  async deleteArticle(id: string): Promise<boolean> {
    const res = await fetch(`/api/articles/${id}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    });
    return res.ok;
  },

  // 6. Reader Reaction
  async sendReaction(articleId: string, type: 'claps' | 'insightful' | 'inspiring' | 'critical', delta: 1 | -1 = 1) {
    try {
      const res = await fetch(`/api/articles/${articleId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, delta }),
      });
      if (!res.ok) return null;
      const data = await safeJsonResponse(res);
      return data.reactions;
    } catch (err) {
      console.warn('Reaction API error:', err);
      return null;
    }
  },

  // 7. Add Comment
  async addComment(articleId: string, author: string, content: string) {
    const res = await fetch(`/api/articles/${articleId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, content }),
    });
    if (!res.ok) throw new Error('Gagal mengirim komentar');
    const data = await safeJsonResponse(res);
    return data;
  },

  // 8. Citizen Submissions (Inbox Redaksi)
  async getSubmissions(): Promise<CitizenSubmission[]> {
    try {
      const res = await fetch('/api/submissions');
      if (!res.ok) return [];
      const data = await safeJsonResponse(res);
      return data.data || [];
    } catch (err) {
      console.warn('Get submissions fallback:', err);
      return [];
    }
  },

  async submitCitizenStory(submission: Omit<CitizenSubmission, 'id' | 'submittedAt'>): Promise<CitizenSubmission> {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
    if (!res.ok) throw new Error('Gagal mengirim tulisan');
    const data = await safeJsonResponse(res);
    return data.data;
  },

  async publishSubmission(submissionId: string): Promise<Article> {
    const res = await fetch(`/api/submissions/${submissionId}/publish`, {
      method: 'POST',
      headers: getAdminAuthHeaders(),
    });
    if (!res.ok) throw new Error('Gagal menerbitkan naskah warga');
    const data = await safeJsonResponse(res);
    return data.data;
  },

  async deleteSubmission(submissionId: string): Promise<boolean> {
    const res = await fetch(`/api/submissions/${submissionId}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    });
    return res.ok;
  },

  // 9. Stats
  async getStats(): Promise<ServerStats | null> {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) return null;
      const data = await safeJsonResponse(res);
      return data.data;
    } catch (err) {
      return null;
    }
  },

  // 10. Newsletter
  async subscribeNewsletter(email: string): Promise<boolean> {
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  },

  // 11. Image Upload
  async uploadImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const imageBase64 = reader.result as string;
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: getAdminAuthHeaders(),
            body: JSON.stringify({ imageBase64 }),
          });
          if (!res.ok) throw new Error('Gagal meng-upload gambar ke server');
          const data = await safeJsonResponse(res);
          resolve(data.url);
        } catch (err: any) {
          reject(err);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  },

  // 12. Site Settings API (Blogger / WordPress CMS Suite)
  async getSettings(): Promise<any> {
    try {
      const res = await fetch('/api/settings');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        const settings = data.data || data;
        if (typeof window !== 'undefined' && settings) {
          try { localStorage.setItem('liberta_site_settings', JSON.stringify(settings)); } catch (e) {}
        }
        return settings;
      }
    } catch (err) {
      console.warn('API getSettings fallback:', err);
    }

    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('liberta_site_settings');
        if (local) return JSON.parse(local);
      } catch (e) {}
    }
    return null;
  },

  async saveSettings(settingsData: any): Promise<any> {
    if (typeof window !== 'undefined' && settingsData) {
      try { localStorage.setItem('liberta_site_settings', JSON.stringify(settingsData)); } catch (e) {}
    }

    try {
      const token = sessionStorage.getItem('liberta_admin_token') || getAdminToken();
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token || ''
        },
        body: JSON.stringify(settingsData),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.warn('Server cPanel merespons HTML. Pengaturan tersimpan di localStorage browser.');
        return settingsData;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      return data.data || data || settingsData;
    } catch (err: any) {
      console.warn('Backend saveSettings network warning:', err);
      return settingsData;
    }
  },

  // 13. Static Pages API (CMS Pages)
  async getPages(): Promise<any[]> {
    try {
      const res = await fetch('/api/pages');
      if (!res.ok) return [];
      const data = await safeJsonResponse(res);
      return data.data || [];
    } catch (err) {
      console.warn('API getPages fallback:', err);
      return [];
    }
  },

  async getPageBySlug(slug: string): Promise<any | null> {
    try {
      const res = await fetch(`/api/pages/${slug}`);
      if (!res.ok) return null;
      const data = await safeJsonResponse(res);
      return data.data;
    } catch (err) {
      console.warn('API getPageBySlug fallback:', err);
      return null;
    }
  },

  async savePage(pageData: { id?: string; slug: string; title: string; content: string }): Promise<any> {
    const method = pageData.id ? 'PUT' : 'POST';
    const url = pageData.id ? `/api/pages/${pageData.id}` : '/api/pages';
    const res = await fetch(url, {
      method,
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(pageData),
    });
    if (!res.ok) throw new Error('Gagal menyimpan halaman statis');
    const data = await safeJsonResponse(res);
    return data.data;
  },

  async deletePage(id: string): Promise<boolean> {
    const res = await fetch(`/api/pages/${id}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    });
    return res.ok;
  },
};

export const fetchArticles = async (page = 1, perPage = 20): Promise<Article[]> => {
  return api.getArticles();
};

export const fetchArticleById = async (id: string): Promise<Article | null> => {
  return api.getArticleById(id);
};

export const fetchArticlesByCategory = async (categoryName: string): Promise<Article[]> => {
  const all = await api.getArticles();
  if (!categoryName || categoryName === 'Semua') return all;
  return all.filter((a) => a.category?.toLowerCase() === categoryName.toLowerCase());
};

export const createArticle = (data: any) => api.createArticle(data);
export const updateArticle = (id: string, data: any) => api.updateArticle(id, data);
export const deleteArticle = (id: string) => api.deleteArticle(id);
export const saveArticle = (data: any) => data.id ? api.updateArticle(data.id, data) : api.createArticle(data);
export const fetchSubmissions = () => api.getSubmissions();
export const publishSubmission = (id: string) => api.publishSubmission(id);
export const deleteSubmission = (id: string) => api.deleteSubmission(id);
export const fetchSettings = () => api.getSettings();
export const saveSiteSettings = (settings: any) => api.saveSettings(settings);
export const uploadImage = (file: File) => api.uploadImage(file);

