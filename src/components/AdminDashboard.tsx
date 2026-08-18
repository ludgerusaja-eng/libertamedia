import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Inbox,
  BarChart3,
  Mail,
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Eye,
  Star,
  Flame,
  ShieldCheck,
  RefreshCw,
  X,
  ExternalLink,
  Image as ImageIcon,
  Send,
  Database,
  ArrowUpRight,
  Search,
  Sliders,
  Check,
  AlertCircle
} from 'lucide-react';
import { Article, CitizenSubmission, CategoryType } from '../types';
import { api } from '../services/api';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  onArticlesChange: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  articles,
  onArticlesChange
}) => {
  const [activeTab, setActiveTab] = useState<'articles' | 'submissions' | 'polls' | 'subscribers' | 'settings'>('articles');
  const [submissions, setSubmissions] = useState<CitizenSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // New & Edit Article Form state
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryType>('Pemerintahan');
  const [newPillar, setNewPillar] = useState<'news' | 'opinion' | 'student' | 'international'>('news');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newAuthorName, setNewAuthorName] = useState('Dewan Redaksi');
  const [newAuthorRole, setNewAuthorRole] = useState('Tim Jurnalis Liberta');
  const [isHero, setIsHero] = useState(false);
  const [isEditorChoice, setIsEditorChoice] = useState(false);
  const [isTrending, setIsTrending] = useState(false);

  const handleOpenCreate = () => {
    setEditingArticleId(null);
    setNewTitle('');
    setNewCategory('Pemerintahan');
    setNewPillar('news');
    setNewSummary('');
    setNewContent('');
    setNewImage('');
    setNewAuthorName('Dewan Redaksi');
    setNewAuthorRole('Tim Jurnalis Liberta');
    setIsHero(false);
    setIsEditorChoice(false);
    setIsTrending(false);
    setIsCreatingArticle(true);
  };

  const handleOpenEdit = (art: Article) => {
    setEditingArticleId(art.id);
    setNewTitle(art.title);
    setNewCategory(art.category);
    setNewPillar(art.pillar || 'news');
    setNewSummary(art.summary || '');
    setNewContent(Array.isArray(art.content) ? art.content.join('\n\n') : art.content || '');
    setNewImage(art.image || '');
    setNewAuthorName(art.author?.name || 'Dewan Redaksi');
    setNewAuthorRole(art.author?.role || 'Tim Jurnalis Liberta');
    setIsHero(art.isHero || false);
    setIsEditorChoice(art.isEditorChoice || false);
    setIsTrending(art.isTrending || false);
    setIsCreatingArticle(true);
  };

  // Password Protection state with try-catch safety
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('admin_authenticated') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // File Upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'libertamedia2026' || passwordInput === 'admin123') {
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem('admin_authenticated', 'true');
      } catch (e) {}
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('admin_authenticated');
    } catch (e) {}
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingImage(true);
      const url = await api.uploadImage(file);
      setNewImage(url);
      showToast('Gambar berhasil di-upload ke server!');
    } catch (err: any) {
      alert(err.message || 'Gagal meng-upload gambar');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const insertTextFormatting = (prefix: string, suffix: string = '') => {
    setNewContent((prev) => prev + `${prefix} Teks ${suffix}`);
  };

  useEffect(() => {
    if (isOpen) {
      loadSubmissions();
    }
  }, [isOpen]);

  const loadSubmissions = async () => {
    try {
      const data = await api.getSubmissions();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Load submissions error:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (!isOpen) return null;

  const safeArticles = Array.isArray(articles) ? articles : [];
  const filteredArticles = safeArticles.filter(a => {
    if (!a) return false;
    const matchCat = filterCategory === 'Semua' || a.category === filterCategory;
    const matchQ = !searchQuery || 
      (a.title && a.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (a.summary && a.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchQ;
  });

  const handleToggleHero = async (article: Article) => {
    try {
      setLoading(true);
      await api.updateArticle(article.id, { isHero: !article.isHero });
      onArticlesChange();
      showToast(`Status Headline Hero untuk "${article.title.substring(0, 30)}..." diperbarui!`);
    } catch (err) {
      showToast('Gagal memperbarui status artikel');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEditorChoice = async (article: Article) => {
    try {
      setLoading(true);
      await api.updateArticle(article.id, { isEditorChoice: !article.isEditorChoice });
      onArticlesChange();
      showToast(`Status Pilihan Redaksi untuk "${article.title.substring(0, 30)}..." diperbarui!`);
    } catch (err) {
      showToast('Gagal memperbarui status artikel');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (id: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus artikel "${title}"?`)) return;
    try {
      setLoading(true);
      await api.deleteArticle(id);
      onArticlesChange();
      showToast('Artikel berhasil dihapus!');
    } catch (err) {
      showToast('Gagal menghapus artikel');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishSubmission = async (sub: CitizenSubmission) => {
    try {
      setLoading(true);
      await api.publishSubmission(sub.id);
      await loadSubmissions();
      onArticlesChange();
      showToast(`Naskah warga "${sub.title.substring(0, 30)}..." berhasil diterbitkan!`);
    } catch (err) {
      showToast('Gagal menerbitkan naskah warga');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Judul dan Isi Berita wajib diisi!');
      return;
    }
    try {
      setLoading(true);
      const articlePayload = {
        title: newTitle,
        category: newCategory,
        pillar: newPillar,
        summary: newSummary || newTitle,
        content: [newContent],
        image: newImage || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=1200&auto=format&fit=crop',
        author: {
          name: newAuthorName,
          role: newAuthorRole,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
          institution: 'libertamedia.com'
        },
        isHero,
        isEditorChoice,
        isTrending
      };

      if (editingArticleId) {
        await api.updateArticle(editingArticleId, articlePayload);
        showToast('Artikel berhasil diperbarui!');
      } else {
        await api.createArticle(articlePayload);
        showToast('Artikel baru berhasil diterbitkan!');
      }

      setIsCreatingArticle(false);
      setEditingArticleId(null);
      setNewTitle('');
      setNewSummary('');
      setNewContent('');
      setNewImage('');
      onArticlesChange();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan artikel');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-slate-100">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 mx-auto flex items-center justify-center shadow-xl shadow-red-950/50">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-black tracking-tight">Otentikasi Redaksi Admin</h3>
            <p className="text-xs text-slate-400">
              Masukkan password pengelola untuk mengakses Control Panel libertamedia.com
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Password Admin</label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Masukkan password admin..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={`w-full px-4 py-3 bg-slate-950 border ${
                  passwordError ? 'border-red-500 text-red-300' : 'border-slate-800 text-white'
                } rounded-xl text-sm focus:outline-none focus:border-red-500 transition-colors`}
              />
              {passwordError && (
                <p className="text-xs text-red-400 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Password salah. Silakan coba lagi!
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold py-3 rounded-xl text-sm shadow-lg shadow-red-900/40 transition-all flex items-center justify-center gap-2"
            >
              Masuk ke Control Panel &rarr;
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-800">
            <button
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Kembali ke Website Utama
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-red-900/40">
              LM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">PANEL AUTOMATED CONTROL & EDITORIAL</h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  cPanel Native Engine Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pusat Otomatisasi Layout Frontend, Publikasi Artikel, & Pengelolaan Konten libertamedia.com
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700"
              title="Keluar dari Sesi Admin"
            >
              🔒 Keluar / Logout
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top duration-200 shadow-md">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {toastMessage}
            </span>
            <button onClick={() => setToastMessage(null)} className="opacity-80 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-slate-950/60 border-r border-slate-800/80 p-4 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="px-3 py-2 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                Menu Utama Admin
              </div>

              <button
                onClick={() => { setActiveTab('articles'); setIsCreatingArticle(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'articles'
                    ? 'bg-red-600 text-white shadow-md shadow-red-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <FileText className="w-4 h-4" />
                Manajemen Berita & Layout
              </button>

              <button
                onClick={() => { setActiveTab('submissions'); setIsCreatingArticle(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all justify-between ${
                  activeTab === 'submissions'
                    ? 'bg-red-600 text-white shadow-md shadow-red-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Inbox className="w-4 h-4" />
                  Naskah Suara Warga
                </div>
                {submissions.length > 0 && (
                  <span className="bg-red-500/30 text-red-200 px-2 py-0.5 rounded-full text-[10px] font-black">
                    {submissions.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab('settings'); setIsCreatingArticle(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-red-600 text-white shadow-md shadow-red-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Database className="w-4 h-4" />
                cPanel MySQL & System
              </button>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => { setActiveTab('articles'); handleOpenCreate(); }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Tulis Artikel Baru
            </button>
          </div>

          {/* Tab Panel Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
            {activeTab === 'articles' && (
              <div>
                {!isCreatingArticle ? (
                  <div className="space-y-6">
                    {/* Filter & Control Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                      <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cari judul berita..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                        <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Kategori:</span>
                        {['Semua', 'Pemerintahan', 'Politik', 'Mahasiswa', 'Ekonomi', 'Internasional'].map(cat => (
                          <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                              filterCategory === cat
                                ? 'bg-slate-800 text-white border border-slate-700'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Articles List Table */}
                    <div className="bg-slate-950/40 rounded-2xl border border-slate-800 overflow-hidden">
                      <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-extrabold text-slate-400">
                        <span>DAFTAR BERITA & OTOMATISASI HERO SLIDER ({filteredArticles.length})</span>
                        <span>AKSI & TOGGLE LAYOUT</span>
                      </div>

                      <div className="divide-y divide-slate-800/80">
                        {filteredArticles.map(article => (
                          <div key={article.id} className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <img
                                src={article.image}
                                alt={article.title}
                                className="w-16 h-16 rounded-xl object-cover border border-slate-800"
                              />
                              <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-500/30">
                                    {article.category}
                                  </span>
                                  {article.isHero && (
                                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-amber-300" />
                                      Hero Headline
                                    </span>
                                  )}
                                  {article.isEditorChoice && (
                                    <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-500/30 flex items-center gap-1">
                                      <Sparkles className="w-3 h-3" />
                                      Pilihan Redaksi
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-sm font-bold text-slate-100 line-clamp-1">{article.title}</h4>
                                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{article.summary}</p>
                              </div>
                            </div>

                            {/* Automation Toggles */}
                            <div className="flex items-center gap-2 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                              <button
                                onClick={() => handleToggleHero(article)}
                                disabled={loading}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                                  article.isHero
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                                }`}
                                title="Jadikan Headline Utama Hero Slider"
                              >
                                <Star className={`w-3.5 h-3.5 ${article.isHero ? 'fill-amber-300' : ''}`} />
                                Hero
                              </button>

                              <button
                                onClick={() => handleToggleEditorChoice(article)}
                                disabled={loading}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                                  article.isEditorChoice
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30'
                                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                                }`}
                                title="Tampilkan di Seksi Pilihan Redaksi"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                Choice
                              </button>

                              <button
                                onClick={() => handleOpenEdit(article)}
                                disabled={loading}
                                className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg border border-blue-500/20 transition-all flex items-center gap-1 text-xs font-bold px-3"
                                title="Edit Berita Ini (Blogger Style)"
                              >
                                ✏️ Edit
                              </button>

                              <button
                                onClick={() => handleDeleteArticle(article.id, article.title)}
                                disabled={loading}
                                className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-all"
                                title="Hapus Berita"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                  {/* Form Artikel (Baru / Edit) */}
                  <form onSubmit={handleCreateArticleSubmit} className="space-y-6 max-w-3xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                        <Plus className="w-5 h-5 text-red-500" />
                        {editingArticleId ? '✏️ Edit Artikel / Berita' : '📝 Tulis & Terbitkan Artikel Baru'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsCreatingArticle(false)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Batal
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Judul Berita</label>
                        <input
                          type="text"
                          required
                          placeholder="Masukkan judul berita utama..."
                          value={newTitle}
                          onChange={e => setNewTitle(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">Kategori</label>
                          <select
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value as CategoryType)}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                          >
                            <option value="Pemerintahan">Pemerintahan</option>
                            <option value="Politik">Politik</option>
                            <option value="Mahasiswa">Mahasiswa & Kampus</option>
                            <option value="Ekonomi">Ekonomi & Bisnis</option>
                            <option value="Internasional">Internasional</option>
                            <option value="Opini">Opini Publik</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">Rubrik Pilar</label>
                          <select
                            value={newPillar}
                            onChange={e => setNewPillar(e.target.value as any)}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                          >
                            <option value="news">Kabar Utama (News)</option>
                            <option value="opinion">Dialektika Opini</option>
                            <option value="student">Suara Mahasiswa</option>
                            <option value="international">Kabar Dunia</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-300">Gambar Cover Berita</label>
                          <label className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold px-3 py-1 rounded-lg border border-slate-700 cursor-pointer flex items-center gap-1.5 transition-all">
                            <ImageIcon className="w-3.5 h-3.5" />
                            {isUploadingImage ? 'Uploading ke Server...' : '📁 Upload Foto dari HP/Laptop'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="Atau masukkan URL gambar (https://...)"
                          value={newImage}
                          onChange={e => setNewImage(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Ringkasan Eksekutif (Lead)</label>
                        <textarea
                          rows={2}
                          placeholder="Ringkasan singkat 1-2 kalimat..."
                          value={newSummary}
                          onChange={e => setNewSummary(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                          <label className="block text-xs font-bold text-slate-300">Isi Naskah Berita Lengkap (Editor Redaksi)</label>
                          {/* Blogger / WordPress Style Toolbar */}
                          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300">
                            <button type="button" onClick={() => insertTextFormatting('**', '**')} className="px-2 py-0.5 hover:bg-slate-800 rounded font-bold transition-all text-white" title="Tebal (Bold)">B</button>
                            <button type="button" onClick={() => insertTextFormatting('*', '*')} className="px-2 py-0.5 hover:bg-slate-800 rounded italic transition-all text-white" title="Miring (Italic)">I</button>
                            <button type="button" onClick={() => insertTextFormatting('\n## ', '\n')} className="px-2 py-0.5 hover:bg-slate-800 rounded font-extrabold text-amber-400 transition-all" title="Sub-Judul (H2)">H2</button>
                            <button type="button" onClick={() => insertTextFormatting('\n> "', '"\n')} className="px-2 py-0.5 hover:bg-slate-800 rounded text-blue-400 transition-all" title="Kutipan (Quote)">💬 Kutipan</button>
                            <button type="button" onClick={() => insertTextFormatting('\n- ')} className="px-2 py-0.5 hover:bg-slate-800 rounded text-emerald-400 transition-all" title="Daftar Poin">📋 Poin</button>
                          </div>
                        </div>
                        <textarea
                          rows={10}
                          required
                          placeholder="Tulis naskah artikel berita secara komprehensif di sini..."
                          value={newContent}
                          onChange={e => setNewContent(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 font-sans leading-relaxed"
                        />
                      </div>

                      {/* Penempatan Otomatis */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                        <span className="text-xs font-bold text-slate-300 block">Otomatisasi Penempatan Frontend:</span>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isHero}
                              onChange={e => setIsHero(e.target.checked)}
                              className="rounded border-slate-700 bg-slate-900 text-red-600 focus:ring-red-500"
                            />
                            Jadikan Hero Headline Slider Utama
                          </label>

                          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isEditorChoice}
                              onChange={e => setIsEditorChoice(e.target.checked)}
                              className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                            />
                            Tampilkan di Pilihan Redaksi
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsCreatingArticle(false)}
                        className="px-5 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-900/40 flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        {loading ? 'Menyimpan...' : (editingArticleId ? 'Simpan Perubahan' : 'Terbitkan Berita')}
                      </button>
                    </div>
                  </form>
                  </>
                )}
              </div>
            )}

            {/* Tab Inbox Suara Warga */}
            {activeTab === 'submissions' && (
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2 mb-4">
                  <Inbox className="w-4 h-4 text-red-500" />
                  INBOX SUARA WARGA & NASKAH MAHASISWA ({submissions.length})
                </h3>

                {submissions.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                    Belum ada naskah kiriman warga terbaru.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map(sub => (
                      <div key={sub.id} className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-amber-500/30">
                              {sub.category || 'Opini'}
                            </span>
                            <h4 className="text-sm font-bold text-white mt-1.5">{sub.title}</h4>
                            <p className="text-xs text-slate-400">
                              Oleh: <strong className="text-slate-200">{sub.authorName}</strong> ({sub.institution}) • {sub.email}
                            </p>
                          </div>
                          <button
                            onClick={() => handlePublishSubmission(sub)}
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all whitespace-nowrap"
                          >
                            <Check className="w-4 h-4" />
                            1-Klik Terbitkan ke Homepage
                          </button>
                        </div>
                        <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800 line-clamp-3">
                          {sub.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab Settings cPanel MySQL */}
            {activeTab === 'settings' && (
              <div className="space-y-6 max-w-2xl">
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <Database className="w-6 h-6 text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-extrabold text-white">Status Database & Server cPanel</h4>
                      <p className="text-xs text-slate-400">
                        Penyimpanan Data Lokal Server & Opsional Database MySQL cPanel
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl text-xs font-semibold border bg-emerald-500/10 text-emerald-300 border-emerald-500/30 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <div>
                      Server cPanel Aktif! Seluruh data artikel, naskah warga, dan buletin tersimpan secara otomatis di server cPanel Anda (`/data/db.json`).
                    </div>
                  </div>

                  <div className="pt-2 space-y-2 text-xs text-slate-400">
                    <p className="font-bold text-slate-200">Opsional: Impor ke MySQL cPanel via phpMyAdmin</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Buka cPanel Anda &rarr; klik menu <strong>phpMyAdmin</strong>.</li>
                      <li>Impor skrip SQL dari berkas <code className="bg-slate-900 text-slate-200 px-1.5 py-0.5 rounded">cpanel_mysql_setup.sql</code>.</li>
                      <li>Seluruh tabel berita akan terbuat secara otomatis di server MySQL cPanel Anda.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
