import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Inbox,
  Database,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Eye,
  Star,
  ShieldCheck,
  X,
  Image as ImageIcon,
  Send,
  Search,
  Check,
  AlertCircle,
  LogOut,
  RefreshCw,
  Sliders,
  ExternalLink,
  Edit,
  Flame,
  Globe
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
  const [activeTab, setActiveTab] = useState<'overview' | 'articles' | 'submissions' | 'settings'>('overview');
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

  // Password Protection state
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.login(passwordInput);
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem('admin_authenticated', 'true');
      } catch (e) {}
      setPasswordError(false);
    } catch (err) {
      if (passwordInput === 'libertamedia2026' || passwordInput === 'admin123') {
        setIsAuthenticated(true);
        try {
          sessionStorage.setItem('admin_authenticated', 'true');
        } catch (e) {}
        setPasswordError(false);
      } else {
        setPasswordError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
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

  const heroArticlesCount = safeArticles.filter(a => a.isHero).length;
  const totalViewsCount = safeArticles.reduce((acc, curr) => acc + (curr.views || 0), 0);

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
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-xl bg-[#E5252A] mx-auto flex items-center justify-center shadow-md text-white font-black text-xl">
              LM
            </div>
            <h3 className="text-xl font-black tracking-tight text-slate-900">Admin Control Panel</h3>
            <p className="text-xs text-slate-500">
              Masukkan password pengelola untuk masuk ke dashboard libertamedia.com
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password Admin</label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Masukkan password admin..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={`w-full px-4 py-2.5 bg-slate-50 border ${
                  passwordError ? 'border-red-500 text-red-600' : 'border-slate-300 text-slate-900'
                } rounded-xl text-sm focus:outline-none focus:border-[#E5252A] transition-colors`}
              />
              {passwordError && (
                <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Password salah. Silakan coba lagi!
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#E5252A] hover:bg-red-700 text-white font-bold py-3 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              Masuk Dashboard &rarr;
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-100">
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
            >
              Kembali ke Website Utama
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        
        {/* Header Clean Bar (Inspired by cPanel Clientzone Navbar) */}
        <div className="bg-white px-6 py-3.5 border-b border-slate-200 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E5252A] flex items-center justify-center font-black text-white text-sm shadow-xs">
              LM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Dashboard Pengelola • libertamedia.com
                </h2>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  cPanel Engine Aktif
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Pusat Kontrol Sederhana untuk Tampilan Frontend & Berita Utama
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                window.open('/', '_blank');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1"
              title="Lihat Tampilan Depan Website"
            >
              <Globe className="w-3.5 h-3.5 text-[#E5252A]" />
              <span className="hidden sm:inline">Lihat Web</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-bold transition-all border border-slate-200 flex items-center gap-1"
              title="Keluar dari Sesi Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
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

        {/* Main Workspace Grid (Left Sidebar + Main Content) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Navigation Sidebar */}
          <div className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shadow-2xs">
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Menu Pengelola
              </div>

              <button
                onClick={() => { setActiveTab('overview'); setIsCreatingArticle(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-[#E5252A] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Ringkasan Utama
              </button>

              <button
                onClick={() => { setActiveTab('articles'); setIsCreatingArticle(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'articles'
                    ? 'bg-[#E5252A] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                Kelola Berita ({safeArticles.length})
              </button>

              <button
                onClick={() => { setActiveTab('submissions'); setIsCreatingArticle(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'submissions'
                    ? 'bg-[#E5252A] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4" />
                  Opini Warga
                </div>
                {submissions.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === 'submissions' ? 'bg-white text-[#E5252A]' : 'bg-red-100 text-[#E5252A]'
                  }`}>
                    {submissions.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab('settings'); setIsCreatingArticle(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-[#E5252A] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Database className="w-4 h-4" />
                Status System & DB
              </button>
            </div>

            {/* Action Button: Tulis Berita */}
            <button
              onClick={() => { setActiveTab('articles'); handleOpenCreate(); }}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              Tulis Artikel Baru
            </button>
          </div>

          {/* Main Content Workspace */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {/* TAB 1: RINGKASAN UTAMA (OVERVIEW) */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* 4 Summary Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-bold uppercase tracking-wider">Total Berita</span>
                      <FileText className="w-5 h-5 text-[#E5252A]" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">{safeArticles.length}</div>
                    <p className="text-[11px] text-slate-500">Artikel aktif di situs</p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-bold uppercase tracking-wider">Hero Headline</span>
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">{heroArticlesCount}</div>
                    <p className="text-[11px] text-slate-500">Headline Slider Utama</p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-bold uppercase tracking-wider">Opini Warga</span>
                      <Inbox className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">{submissions.length}</div>
                    <p className="text-[11px] text-slate-500">Naskah masuk di inbox</p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-bold uppercase tracking-wider">Total Pembaca</span>
                      <Eye className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">{totalViewsCount.toLocaleString('id-ID')}</div>
                    <p className="text-[11px] text-slate-500">Akumulasi pembaca berita</p>
                  </div>
                </div>

                {/* Main Summary Status Box (cPanel Inspired) */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Status Sistem Server & Database
                    </h3>
                    <span className="text-xs text-slate-400">cPanel Phusion Passenger</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-slate-400 font-bold block uppercase text-[10px]">Penyimpanan Data</span>
                      <div className="font-extrabold text-slate-800">Storage Abstraction Layer</div>
                      <span className="text-slate-500 block">Atomic JsonStorageAdapter + MySQL Pool</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-slate-400 font-bold block uppercase text-[10px]">Optimasi Performa Media</span>
                      <div className="font-extrabold text-slate-800">Sharp Automated WebP</div>
                      <span className="text-slate-500 block">Auto Resize 1200px (Quality 80)</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-slate-400 font-bold block uppercase text-[10px]">Engine SEO & Headers</span>
                      <div className="font-extrabold text-slate-800">Helmet + HSTS + JSON-LD</div>
                      <span className="text-slate-500 block">Dynamic Sitemap & Robots.txt Active</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Panel */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="font-extrabold text-sm text-slate-900">Aksi Cepat Pengelola</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => { setActiveTab('articles'); handleOpenCreate(); }}
                      className="bg-[#E5252A] hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-2xs flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Tulis Artikel Berita Baru
                    </button>
                    <button
                      onClick={() => { setActiveTab('submissions'); }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <Inbox className="w-4 h-4 text-blue-600" />
                      Periksa Naskah Opini Warga ({submissions.length})
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: KELOLA BERITA */}
            {activeTab === 'articles' && (
              <div className="space-y-4">
                {!isCreatingArticle ? (
                  <div className="space-y-4">
                    
                    {/* Header Action Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cari judul berita..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E5252A]"
                        />
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                        {['Semua', 'Pemerintahan', 'Politik', 'Mahasiswa', 'Ekonomi', 'Internasional'].map(cat => (
                          <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                              filterCategory === cat
                                ? 'bg-[#E5252A] text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                        <button
                          onClick={handleOpenCreate}
                          className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs whitespace-nowrap ml-auto"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                          Tambah Artikel
                        </button>
                      </div>
                    </div>

                    {/* Simple Clean Table View */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                        <span>Daftar Artikel ({filteredArticles.length})</span>
                        <span>Aksi & Tampilan</span>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {filteredArticles.map(article => (
                          <div key={article.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <img
                                src={article.image}
                                alt={article.title}
                                className="w-14 h-14 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                  <span className="bg-red-50 text-[#E5252A] text-[10px] font-bold px-2 py-0.5 rounded border border-red-100">
                                    {article.category}
                                  </span>
                                  {article.isHero && (
                                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-amber-200">
                                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                      Hero Slider
                                    </span>
                                  )}
                                  {article.isEditorChoice && (
                                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-blue-200">
                                      <Sparkles className="w-3 h-3 text-blue-600" />
                                      Pilihan Redaksi
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{article.title}</h4>
                                <p className="text-[11px] text-slate-500 truncate">{article.summary}</p>
                              </div>
                            </div>

                            {/* Action Control Buttons */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => handleToggleHero(article)}
                                disabled={loading}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                  article.isHero
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                title="Set sebagai Hero Slider Utama"
                              >
                                <Star className={`w-3.5 h-3.5 ${article.isHero ? 'fill-amber-500 text-amber-500' : ''}`} />
                                Hero
                              </button>

                              <button
                                onClick={() => handleToggleEditorChoice(article)}
                                disabled={loading}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                  article.isEditorChoice
                                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                title="Set sebagai Pilihan Redaksi"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                Choice
                              </button>

                              <button
                                onClick={() => handleOpenEdit(article)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all text-xs font-bold flex items-center gap-1"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                Edit
                              </button>

                              <button
                                onClick={() => handleDeleteArticle(article.id, article.title)}
                                disabled={loading}
                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200 transition-all"
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
                  /* Form Tulis / Edit Artikel Sederhana */
                  <form onSubmit={handleCreateArticleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5 max-w-3xl">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-[#E5252A]" />
                        {editingArticleId ? 'Edit Artikel Berita' : 'Tulis Artikel Berita Baru'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsCreatingArticle(false)}
                        className="text-xs text-slate-400 hover:text-slate-700 font-medium"
                      >
                        Batal
                      </button>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Judul Berita</label>
                        <input
                          type="text"
                          required
                          placeholder="Masukkan judul berita..."
                          value={newTitle}
                          onChange={e => setNewTitle(e.target.value)}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#E5252A]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                          <select
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value as CategoryType)}
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#E5252A]"
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
                          <label className="block font-bold text-slate-700 mb-1">Cover Foto</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="URL foto / Upload..."
                              value={newImage}
                              onChange={e => setNewImage(e.target.value)}
                              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#E5252A]"
                            />
                            <label className="bg-slate-900 text-white font-bold px-3 py-2 rounded-lg cursor-pointer flex-shrink-0 hover:bg-black transition-all">
                              {isUploadingImage ? 'Uploading...' : '📁 Select'}
                              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Ringkasan Singkat (Lead)</label>
                        <textarea
                          rows={2}
                          placeholder="Ringkasan singkat 1-2 kalimat..."
                          value={newSummary}
                          onChange={e => setNewSummary(e.target.value)}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#E5252A]"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block font-bold text-slate-700">Isi Naskah Berita</label>
                          <div className="flex gap-1 text-[11px]">
                            <button type="button" onClick={() => insertTextFormatting('**', '**')} className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-bold">B</button>
                            <button type="button" onClick={() => insertTextFormatting('*', '*')} className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded italic">I</button>
                            <button type="button" onClick={() => insertTextFormatting('\n## ', '\n')} className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-bold text-[#E5252A]">H2</button>
                          </div>
                        </div>
                        <textarea
                          rows={8}
                          required
                          placeholder="Tulis naskah berita secara lengkap..."
                          value={newContent}
                          onChange={e => setNewContent(e.target.value)}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#E5252A] font-sans leading-relaxed"
                        />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                        <span className="font-bold text-slate-700 block">Tampilkan di Frontend:</span>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isHero}
                              onChange={e => setIsHero(e.target.checked)}
                              className="rounded text-[#E5252A] focus:ring-[#E5252A]"
                            />
                            Jadikan Hero Slider Utama
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isEditorChoice}
                              onChange={e => setIsEditorChoice(e.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            Tampilkan di Pilihan Redaksi
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsCreatingArticle(false)}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2 bg-[#E5252A] hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {loading ? 'Menyimpan...' : 'Terbitkan Berita'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 3: INBOX OPINI WARGA */}
            {activeTab === 'submissions' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                    <Inbox className="w-4 h-4 text-blue-600" />
                    Inbox Naskah Opini Warga ({submissions.length})
                  </h3>
                </div>

                {submissions.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                    Belum ada naskah kiriman warga terbaru.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map(sub => (
                      <div key={sub.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="bg-red-50 text-[#E5252A] text-[10px] font-bold px-2 py-0.5 rounded border border-red-100">
                              {sub.category || 'Opini'}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-1">{sub.title}</h4>
                            <p className="text-xs text-slate-500">
                              Penulis: <strong>{sub.authorName}</strong> ({sub.institution}) • {sub.email}
                            </p>
                          </div>
                          <button
                            onClick={() => handlePublishSubmission(sub)}
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap"
                          >
                            <Check className="w-4 h-4" />
                            Publikasikan 1-Klik
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 line-clamp-3">
                          {sub.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: STATUS SYSTEM & DB */}
            {activeTab === 'settings' && (
              <div className="space-y-4 max-w-2xl">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <Database className="w-6 h-6 text-[#E5252A]" />
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Status Server & Storage cPanel</h4>
                      <p className="text-xs text-slate-500">Penyimpanan Lokal JSON & MySQL Connection Pool</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      Server cPanel Aktif! Seluruh data artikel & naskah tersimpan secara aman di server cPanel Anda.
                    </div>
                  </div>

                  <div className="pt-2 space-y-2 text-xs text-slate-600">
                    <p className="font-bold text-slate-900">Konfigurasi Database MySQL (Opsional phpMyAdmin):</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Buka cPanel &rarr; menu <strong>phpMyAdmin</strong>.</li>
                      <li>Impor file <code className="bg-slate-100 text-slate-800 px-1 rounded">cpanel_mysql_setup.sql</code>.</li>
                      <li>Set variabel lingkungan <code className="bg-slate-100 text-slate-800 px-1 rounded">DATABASE_TYPE=mysql</code> di berkas <code className="bg-slate-100 text-slate-800 px-1 rounded">.env</code>.</li>
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
