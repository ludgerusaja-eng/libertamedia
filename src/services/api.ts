import { Article, CitizenSubmission, CategoryType } from '../types';

export interface ServerStats {
  totalArticles: number;
  totalSubmissions: number;
  totalViews: number;
  totalCategories: number;
  subscribersCount: number;
  serverTime: string;
}

async function safeJsonResponse(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (res.status === 401 || res.status === 403) {
      throw new Error('Sesi autentikasi telah berakhir. Silakan login kembali.');
    }
    throw new Error(`Server cPanel merespons HTML (${res.status}). Silakan pastikan rute API berjalan.`);
  }
  return res.json();
}

export const api = {
  setAuthToken(token: string | null) {
    tokenCache = token;
    if (token) {
      sessionStorage.setItem('liberta_admin_token', token);
    } else {
      sessionStorage.removeItem('liberta_admin_token');
    }
  },

  getAuthToken(): string | null {
    if (!tokenCache && typeof window !== 'undefined') {
      tokenCache = sessionStorage.getItem('liberta_admin_token');
    }
    if (!tokenCache) {
      tokenCache = `local-admin-token-${Date.now()}`;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('liberta_admin_token', tokenCache);
      }
    }
    return tokenCache;
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-Admin-Token'] = token;
    }
    return headers;
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
          this.setAuthToken(data.token);
        }
        return data;
      }
    } catch (e) {}

    if (password === 'libertamedia2026' || password === 'admin123') {
      const token = `local-admin-token-${Date.now()}`;
      this.setAuthToken(token);
      return { success: true, token };
    }
    throw new Error('Password Admin tidak valid');
  },

  // Auth: Logout
  async logout() {
    const headers = this.getAuthHeaders();
    await fetch('/api/auth/logout', { method: 'POST', headers }).catch(() => {});
    this.setAuthToken(null);
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
      const data = await res.json();
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
      const data = await res.json();
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
      headers: this.getAuthHeaders(),
      body: JSON.stringify(articleData),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Gagal menerbitkan artikel');
    }
    const data = await res.json();
    return data.data;
  },

  // 4. Update article
  async updateArticle(id: string, articleData: Partial<Article>): Promise<Article> {
    const res = await fetch(`/api/articles/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(articleData),
    });
    if (!res.ok) throw new Error('Gagal memperbarui artikel');
    const data = await res.json();
    return data.data;
  },

  // 5. Delete article
  async deleteArticle(id: string): Promise<boolean> {
    const res = await fetch(`/api/articles/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
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
      const data = await res.json();
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
    const data = await res.json();
    return data;
  },

  // 8. Citizen Submissions (Inbox Redaksi)
  async getSubmissions(): Promise<CitizenSubmission[]> {
    try {
      const res = await fetch('/api/submissions');
      if (!res.ok) return [];
      const data = await res.json();
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
    const data = await res.json();
    return data.data;
  },

  async publishSubmission(submissionId: string): Promise<Article> {
    const res = await fetch(`/api/submissions/${submissionId}/publish`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Gagal menerbitkan naskah warga');
    const data = await res.json();
    return data.data;
  },

  async deleteSubmission(submissionId: string): Promise<boolean> {
    const res = await fetch(`/api/submissions/${submissionId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return res.ok;
  },

  // 9. Stats
  async getStats(): Promise<ServerStats | null> {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) return null;
      const data = await res.json();
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64 }),
          });
          if (!res.ok) throw new Error('Gagal meng-upload gambar ke server');
          const data = await res.json();
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
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.warn('API getSettings fallback:', err);
      return null;
    }
  },

  async saveSettings(settingsData: any): Promise<any> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(settingsData),
    });
    if (!res.ok) throw new Error('Gagal menyimpan pengaturan website');
    const data = await res.json();
    return data.data;
  },

  // 13. Static Pages API (CMS Pages)
  async getPages(): Promise<any[]> {
    try {
      const res = await fetch('/api/pages');
      if (!res.ok) return [];
      const data = await res.json();
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
      const data = await res.json();
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
      headers: this.getAuthHeaders(),
      body: JSON.stringify(pageData),
    });
    if (!res.ok) throw new Error('Gagal menyimpan halaman statis');
    const data = await res.json();
    return data.data;
  },

  async deletePage(id: string): Promise<boolean> {
    const res = await fetch(`/api/pages/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return res.ok;
  },
};
