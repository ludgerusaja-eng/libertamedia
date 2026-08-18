import React, { useState, useEffect } from 'react';
import { 
  FileText, Settings, DollarSign, Inbox, Save, 
  Plus, Trash2, Star, Sparkles, CheckCircle2, AlertCircle, LogOut, X,
  Search, Upload, Edit, Eye, ArrowUpRight
} from 'lucide-react';
import { Article, Submission, CategoryType, SiteSettings } from '../types';
import { 
  fetchArticles, deleteArticle, saveArticle, fetchSubmissions, 
  publishSubmission, deleteSubmission, saveSiteSettings, uploadImage 
} from '../services/api';

interface AdminDashboardProps {
  isOpen?: boolean;
  onClose: () => void;
  onLogout?: () => void;
  articles?: Article[];
  onArticlesChange?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen = true,
  onClose,
  onLogout = () => {
    sessionStorage.removeItem('liberta_admin_token');
    window.location.reload();
  },
  articles: propArticles,
  onArticlesChange
}) => {
  const [activeTab, setActiveTab] = useState<'articles' | 'layout' | 'ads' | 'inbox'>('articles');
  const [articlesList, setArticlesList] = useState<Article[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'LIBERTAMEDIA',
    siteTagline: 'Media Untuk Semua • Indeks Berita Publik',
    footerText: '© 2026 LIBERTAMEDIA. Seluruh hak cipta dilindungi.',
    socialLinks: {
      instagram: '',
      twitter: '',
      youtube: '',
      facebook: ''
    },
    sections: {
      showBreakingNews: true,
      showHeroSlider: true,
      showEditorChoice: true,
      showCitizenVoice: true,
      showNewsletter: true
    },
    monetization: {
      headerBannerHtml: '',
      inArticleAdHtml: '',
      googleAnalyticsId: ''
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Article Modal Form State
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [artTitle, setArtTitle] = useState('');
  const [artExcerpt, setArtExcerpt] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artCategory, setArtCategory] = useState<CategoryType>('Pemerintahan');
  const [artImageUrl, setArtImageUrl] = useState('');
  const [artIsHero, setArtIsHero] = useState(false);
  const [artIsChoice, setArtIsChoice] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [arts, subs, setsRes] = await Promise.all([
        fetchArticles(),
        fetchSubmissions(),
        fetch('/api/settings').then(res => res.json()).catch(() => null)
      ]);
      setArticlesList(arts || propArticles || []);
      setSubmissions(subs || []);

      if (setsRes) {
        const data = setsRes.data || setsRes;
        setSettings({
          siteName: data.siteName || 'LIBERTAMEDIA',
          siteTagline: data.siteTagline || data.tagline || 'Media Untuk Semua • Indeks Berita Publik',
          footerText: data.footerText || data.copyrightText || '© 2026 LIBERTAMEDIA. Seluruh hak cipta dilindungi.',
          socialLinks: {
            instagram: data.socialLinks?.instagram || '',
            twitter: data.socialLinks?.twitter || '',
            youtube: data.socialLinks?.youtube || '',
            facebook: data.socialLinks?.facebook || ''
          },
          sections: {
            showBreakingNews: data.sections?.showBreakingNews ?? data.sectionToggles?.breakingNews ?? true,
            showHeroSlider: data.sections?.showHeroSlider ?? data.sectionToggles?.heroSlider ?? true,
            showEditorChoice: data.sections?.showEditorChoice ?? data.sectionToggles?.editorsPicks ?? true,
            showCitizenVoice: data.sections?.showCitizenVoice ?? data.sectionToggles?.citizenVoice ?? true,
            showNewsletter: data.sections?.showNewsletter ?? data.sectionToggles?.newsletter ?? true,
          },
          monetization: {
            headerBannerHtml: data.monetization?.headerBannerHtml || data.adSlots?.headerBanner || '',
            inArticleAdHtml: data.monetization?.inArticleAdHtml || data.adSlots?.inArticleBanner || '',
            googleAnalyticsId: data.monetization?.googleAnalyticsId || data.analyticsScripts?.ga4Id || ''
          }
        });
      }
    } catch (err) {
      showToast('Gagal memuat data dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  // Save Settings Handler
  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await saveSiteSettings(settings);
      showToast('Pengaturan website berhasil disimpan!');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pengaturan website', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImg(true);
      const url = await uploadImage(file);
      setArtImageUrl(url);
      showToast('Gambar berhasil di-upload ke server!');
    } catch (err: any) {
      showToast(err.message || 'Gagal meng-upload gambar', 'error');
    } finally {
      setUploadingImg(false);
    }
  };

  // Save Article Handler
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artTitle.trim()) {
      showToast('Judul artikel wajib diisi', 'error');
      return;
    }
    try {
      setSaving(true);
      const articlePayload: Partial<Article> = {
        id: editingArticleId || undefined,
        title: artTitle,
        excerpt: artExcerpt || artTitle,
        content: artContent || `<p>${artTitle}</p>`,
        category: artCategory,
        imageUrl: artImageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=1200&auto=format&fit=crop',
        isHeroHeadline: artIsHero,
        isEditorsPick: artIsChoice,
        readTime: '3 mnt',
        author: {
          name: 'Redaksi Liberta',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
          role: 'Tim Redaksi'
        }
      };

      await saveArticle(articlePayload);
      showToast(editingArticleId ? 'Artikel berhasil diperbarui!' : 'Artikel baru berhasil diterbitkan!');
      setIsArticleModalOpen(false);
      resetArticleForm();
      await loadAllData();
      if (onArticlesChange) onArticlesChange();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan artikel', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Edit Article Handler
  const handleOpenEditArticle = (art: Article) => {
    setEditingArticleId(art.id);
    setArtTitle(art.title);
    setArtExcerpt(art.excerpt || '');
    setArtContent(art.content || '');
    setArtCategory(art.category);
    setArtImageUrl(art.imageUrl || '');
    setArtIsHero(Boolean(art.isHeroHeadline));
    setArtIsChoice(Boolean(art.isEditorsPick));
    setIsArticleModalOpen(true);
  };

  // Delete Article Handler
  const handleDeleteArticle = async (id: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus artikel "${title}"?`)) return;
    try {
      await deleteArticle(id);
      showToast('Artikel berhasil dihapus!');
      await loadAllData();
      if (onArticlesChange) onArticlesChange();
    } catch (err: any) {
      showToast('Gagal menghapus artikel', 'error');
    }
  };

  // Publish Submission Handler
  const handlePublishSubmission = async (subId: string) => {
    try {
      await publishSubmission(subId);
      showToast('Naskah warga berhasil diterbitkan ke publikasi utama!');
      await loadAllData();
      if (onArticlesChange) onArticlesChange();
    } catch (err: any) {
      showToast(err.message || 'Gagal menerbitkan naskah', 'error');
    }
  };

  // Delete Submission Handler
  const handleDeleteSubmission = async (subId: string) => {
    if (!confirm('Hapus naskah ini dari inbox redaksi?')) return;
    try {
      await deleteSubmission(subId);
      showToast('Naskah berhasil dihapus dari inbox');
      await loadAllData();
    } catch (err: any) {
      showToast('Gagal menghapus naskah', 'error');
    }
  };

  const resetArticleForm = () => {
    setEditingArticleId(null);
    setArtTitle('');
    setArtExcerpt('');
    setArtContent('');
    setArtCategory('Pemerintahan');
    setArtImageUrl('');
    setArtIsHero(false);
    setArtIsChoice(false);
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white p-6 rounded-2xl shadow-xl font-bold text-slate-700 animate-pulse flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#E5252A] border-t-transparent rounded-full animate-spin"></div>
          Memuat Panel Kendali Website...
        </div>
      </div>
    );
  }

  const filteredArticles = articlesList.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center p-0 sm:p-4">
      <div className="bg-slate-50 w-full max-w-6xl h-full sm:h-auto sm:max-h-[92vh] rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* TOP BAR */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#E5252A] rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
              LM
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">Pusat Kendali Admin</h2>
              <p className="text-xs text-slate-500">Kelola konten, tata letak, & monetisasi libertamedia.com</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Keluar
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="bg-white border-b border-slate-200 px-6 flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'articles', label: `Manajemen Berita (${articlesList.length})`, icon: FileText },
            { id: 'layout', label: 'Tata Letak & Identitas', icon: Settings },
            { id: 'ads', label: 'Iklan & Analitik', icon: DollarSign },
            { id: 'inbox', label: `Suara Warga (${submissions.length})`, icon: Inbox },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  active 
                    ? 'border-[#E5252A] text-[#E5252A]' 
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TOAST ALERT */}
        {toast && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
            {toast.message}
          </div>
        )}

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: ARTICLES */}
          {activeTab === 'articles' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Cari judul berita atau kategori..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-red-500 font-medium"
                  />
                </div>
                <button
                  onClick={() => {
                    resetArticleForm();
                    setIsArticleModalOpen(true);
                  }}
                  className="bg-[#E5252A] hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Tambah Berita Baru
                </button>
              </div>

              {/* Table of Articles */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Artikel Berita</th>
                        <th className="py-3 px-4">Kategori</th>
                        <th className="py-3 px-4">Status Highlight</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                      {filteredArticles.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                            Tidak ada artikel berita yang ditemukan.
                          </td>
                        </tr>
                      ) : (
                        filteredArticles.map((art) => (
                          <tr key={art.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={art.imageUrl}
                                  alt=""
                                  className="w-12 h-10 object-cover rounded-lg flex-shrink-0 bg-slate-100 border border-slate-200"
                                />
                                <div>
                                  <h4 className="font-bold text-slate-900 line-clamp-1">{art.title}</h4>
                                  <p className="text-[10px] text-slate-400">{art.publishedAt} • Oleh {art.author?.name || 'Redaksi'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 font-bold text-[10px] text-slate-700 border border-slate-200">
                                {art.category}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {art.isHeroHeadline && (
                                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-extrabold text-[10px] border border-amber-200">
                                    Hero Headline
                                  </span>
                                )}
                                {art.isEditorsPick && (
                                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-extrabold text-[10px] border border-blue-200">
                                    Editor Choice
                                  </span>
                                )}
                                {!art.isHeroHeadline && !art.isEditorsPick && (
                                  <span className="text-[10px] text-slate-400">Standar</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditArticle(art)}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                                  title="Edit Berita"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteArticle(art.id, art.title)}
                                  className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                                  title="Hapus Berita"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LAYOUT & IDENTITY */}
          {activeTab === 'layout' && (
            <div className="max-w-3xl space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#E5252A]" /> Identitas Website
                </h4>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nama Portal Berita</label>
                  <input 
                    type="text" 
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-red-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tagline Slogan</label>
                  <input 
                    type="text" 
                    value={settings.siteTagline}
                    onChange={(e) => setSettings({ ...settings, siteTagline: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-red-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Teks Hak Cipta (Footer Text)</label>
                  <input 
                    type="text" 
                    value={settings.footerText}
                    onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-red-500 font-medium"
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                <h4 className="font-bold text-slate-900 text-sm">Media Sosial Resmi</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">URL Instagram</label>
                    <input
                      type="text"
                      value={settings.socialLinks.instagram}
                      onChange={(e) => setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, instagram: e.target.value }
                      })}
                      placeholder="https://instagram.com/..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-red-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">URL Twitter (X)</label>
                    <input
                      type="text"
                      value={settings.socialLinks.twitter}
                      onChange={(e) => setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, twitter: e.target.value }
                      })}
                      placeholder="https://x.com/..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-red-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">URL YouTube</label>
                    <input
                      type="text"
                      value={settings.socialLinks.youtube}
                      onChange={(e) => setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, youtube: e.target.value }
                      })}
                      placeholder="https://youtube.com/@..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-red-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">URL Facebook</label>
                    <input
                      type="text"
                      value={settings.socialLinks.facebook}
                      onChange={(e) => setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, facebook: e.target.value }
                      })}
                      placeholder="https://facebook.com/..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-red-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                <h4 className="font-bold text-slate-900 text-sm">Pengatur Tampilan Seksi Halaman Depan (Homepage)</h4>
                
                {Object.entries(settings.sections).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                    <span className="text-xs font-bold text-slate-700 capitalize">
                      {key.replace('show', 'Tampilkan Seksi ').replace(/([A-Z])/g, ' $1')}
                    </span>
                    <input 
                      type="checkbox" 
                      checked={Boolean(value)}
                      onChange={(e) => setSettings({
                        ...settings,
                        sections: { ...settings.sections, [key]: e.target.checked }
                      })}
                      className="w-4 h-4 accent-[#E5252A] cursor-pointer"
                    />
                  </label>
                ))}
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-[#E5252A] hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan Pengaturan...' : 'Simpan Perubahan Layout'}
              </button>
            </div>
          )}

          {/* TAB 3: ADS & ANALYTICS */}
          {activeTab === 'ads' && (
            <div className="max-w-3xl space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Kode Iklan Banner & AdSense
                </h4>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">HTML Banner Atas (Header Ad Slot)</label>
                  <textarea 
                    rows={3}
                    value={settings.monetization.headerBannerHtml}
                    onChange={(e) => setSettings({
                      ...settings,
                      monetization: { ...settings.monetization, headerBannerHtml: e.target.value }
                    })}
                    placeholder="<a href='...'><img src='...' /></a> atau kode AdSense..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">HTML Iklan Tengah Artikel (In-Article Ad)</label>
                  <textarea 
                    rows={3}
                    value={settings.monetization.inArticleAdHtml}
                    onChange={(e) => setSettings({
                      ...settings,
                      monetization: { ...settings.monetization, inArticleAdHtml: e.target.value }
                    })}
                    placeholder="<div class='ad-unit'>...</div>"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ID Google Analytics (GA4 Tag)</label>
                  <input 
                    type="text" 
                    value={settings.monetization.googleAnalyticsId}
                    onChange={(e) => setSettings({
                      ...settings,
                      monetization: { ...settings.monetization, googleAnalyticsId: e.target.value }
                    })}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-[#E5252A] hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan Iklan...' : 'Simpan Konfigurasi Iklan'}
              </button>
            </div>
          )}

          {/* TAB 4: INBOX */}
          {activeTab === 'inbox' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Naskah Suara Warga Masuk ({submissions.length})</h3>
              
              {submissions.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs font-medium shadow-xs">
                  Belum ada naskah tulisan opini warga yang masuk di inbox redaksi.
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-xs hover:border-slate-300 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-red-100 text-[#E5252A] font-extrabold text-[10px]">
                            {sub.category}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm mt-1">{sub.title}</h4>
                          <p className="text-[11px] text-slate-500">
                            Oleh: <strong>{sub.authorName}</strong> ({sub.authorEmail}) • {sub.submittedAt}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handlePublishSubmission(sub.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> 1-Klik Terbitkan
                          </button>
                          <button
                            onClick={() => handleDeleteSubmission(sub.id)}
                            className="bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                        {sub.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ARTICLE EDIT / CREATE MODAL */}
      {isArticleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingArticleId ? 'Edit Artikel Berita' : 'Tambah Artikel Berita Baru'}
              </h3>
              <button
                onClick={() => setIsArticleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Judul Artikel *</label>
                <input
                  type="text"
                  required
                  value={artTitle}
                  onChange={(e) => setArtTitle(e.target.value)}
                  placeholder="Masukkan judul berita utama..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-red-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kategori Rubrik</label>
                  <select
                    value={artCategory}
                    onChange={(e) => setArtCategory(e.target.value as CategoryType)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-red-500 font-medium"
                  >
                    {[
                      'Pemerintahan', 'Politik', 'Mahasiswa', 'Sosial Budaya', 'Ekonomi',
                      'Olahraga & Seni', 'Organisasi & Komunitas', 'Opini', 'Gagasan',
                      'Cerita Inspiratif', 'Internasional'
                    ].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">URL Gambar Headline</label>
                  <input
                    type="text"
                    value={artImageUrl}
                    onChange={(e) => setArtImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-red-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Upload Gambar dari Komputer (Sharp WebP Pipeline)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingImg}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-red-50 file:text-[#E5252A] hover:file:bg-red-100 cursor-pointer"
                />
                {uploadingImg && <p className="text-[10px] text-amber-600 font-bold mt-1">Meng-upload & meng-optimasi gambar ke WebP...</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ringkasan Singkat (Excerpt)</label>
                <textarea
                  rows={2}
                  value={artExcerpt}
                  onChange={(e) => setArtExcerpt(e.target.value)}
                  placeholder="Ringkasan 1-2 kalimat untuk preview card..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-red-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Isi Lengkap Naskah Berita (HTML Allowed)</label>
                <textarea
                  rows={6}
                  value={artContent}
                  onChange={(e) => setArtContent(e.target.value)}
                  placeholder="<p>Isi artikel berita lengkap...</p>"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-red-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={artIsHero}
                    onChange={(e) => setArtIsHero(e.target.checked)}
                    className="w-4 h-4 accent-[#E5252A]"
                  />
                  Tampilkan di Hero Headline Slider
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={artIsChoice}
                    onChange={(e) => setArtIsChoice(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  Tampilkan di Pilihan Redaksi (Editor Choice)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsArticleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#E5252A] hover:bg-red-700 text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Menyimpan...' : 'Simpan Artikel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
