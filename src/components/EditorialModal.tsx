import React, { useState, useEffect } from 'react';
import { 
  X, 
  PenSquare, 
  Inbox, 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  Eye, 
  Image as ImageIcon, 
  Send, 
  Tag, 
  Layers,
  Flame,
  Star,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Article, CitizenSubmission, CategoryType } from '../types';
import { api } from '../services/api';

interface EditorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArticleCreated: (article: Article) => void;
  onArticleDeleted?: (id: string) => void;
  publishedArticles: Article[];
  onOpenArticle: (article: Article) => void;
  onRefreshArticles: () => void;
}

const PRESET_IMAGES = [
  { label: 'Gedung & Birokrasi', url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Diskusi & Kebijakan', url: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Mahasiswa & Kampus', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Ekonomi & Pasar', url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Teknologi & Riset', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Sosial & Masyarakat', url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Diplomasi Global', url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Opini & Penulisan', url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop' }
];

export const EditorialModal: React.FC<EditorialModalProps> = ({
  isOpen,
  onClose,
  onArticleCreated,
  onArticleDeleted,
  publishedArticles,
  onOpenArticle,
  onRefreshArticles
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'inbox' | 'manage'>('create');
  const [submissions, setSubmissions] = useState<CitizenSubmission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [subActionMessage, setSubActionMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [pillar, setPillar] = useState<'news' | 'cerita' | 'internasional'>('news');
  const [category, setCategory] = useState<CategoryType>('Pemerintahan');
  const [subcategory, setSubcategory] = useState('');
  const [authorName, setAuthorName] = useState('Dewan Redaksi Liberta');
  const [authorRole, setAuthorRole] = useState('Tim Liputan Khusus');
  const [authorInstitution, setAuthorInstitution] = useState('libertamedia.com');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=1200&auto=format&fit=crop');
  const [caption, setCaption] = useState('');
  const [contentRaw, setContentRaw] = useState('');
  const [summary, setSummary] = useState('');
  const [tagsRaw, setTagsRaw] = useState('Pemerintahan, Kebijakan Publik, Indonesia Emas 2045');
  const [isHero, setIsHero] = useState(true);
  const [isEditorChoice, setIsEditorChoice] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Fetch submissions when inbox tab opens
  useEffect(() => {
    if (isOpen) {
      loadSubmissions();
    }
  }, [isOpen, activeTab]);

  const loadSubmissions = async () => {
    setLoadingSubs(true);
    try {
      const data = await api.getSubmissions();
      setSubmissions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSubs(false);
    }
  };

  if (!isOpen) return null;

  const handlePublishArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contentRaw.trim()) {
      alert('Judul dan isi artikel wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      const paragraphs = contentRaw
        .split('\n\n')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const tags = tagsRaw
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter((t) => t.length > 0);

      const newArticle = await api.createArticle({
        title: title.trim(),
        pillar,
        category,
        subcategory: subcategory.trim() || category,
        summary: summary.trim() || (paragraphs[0] ? paragraphs[0].substring(0, 160) + '...' : ''),
        content: paragraphs,
        author: {
          name: authorName.trim(),
          role: authorRole.trim(),
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
          institution: authorInstitution.trim()
        },
        image: imageUrl.trim(),
        caption: caption.trim() || title.trim(),
        tags: tags.length > 0 ? tags : [category],
        isHero,
        isEditorChoice,
        isTrending: false
      });

      onArticleCreated(newArticle);
      setSuccessToast('Artikel resmi berhasil dipublikasikan!');
      
      // Reset form
      setTitle('');
      setContentRaw('');
      setSummary('');
      setCaption('');
      
      setTimeout(() => {
        setSuccessToast(null);
        setActiveTab('manage');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Gagal menerbitkan artikel');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishSubmission = async (subId: string) => {
    try {
      const published = await api.publishSubmission(subId);
      onArticleCreated(published);
      setSubActionMessage('Naskah berhasil diterbitkan ke publikasi utama!');
      loadSubmissions();
      setTimeout(() => setSubActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menerbitkan naskah');
    }
  };

  const handleDeleteSubmission = async (subId: string) => {
    if (!confirm('Hapus naskah ini dari kotak masuk?')) return;
    try {
      await api.deleteSubmission(subId);
      loadSubmissions();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus naskah');
    }
  };

  const handleDeleteArticle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Yakin ingin menghapus artikel ini dari sistem?')) return;
    try {
      const ok = await api.deleteArticle(id);
      if (ok) {
        if (onArticleDeleted) onArticleDeleted(id);
        onRefreshArticles();
      }
    } catch (err) {
      alert('Gagal menghapus artikel');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E5252A] flex items-center justify-center font-black text-white text-sm shadow-sm">
              LM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-wide">RUANG REDAKSI & MEJA PUBLIKASI</h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Live CMS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manajemen Konten & Penerbitan Independen libertamedia.com
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold rounded-t-xl transition-all ${
              activeTab === 'create'
                ? 'bg-white text-[#E5252A] border-t-2 border-x border-[#E5252A] border-b-0 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenSquare className="w-4 h-4" />
            <span>Tulis Artikel Baru</span>
          </button>

          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold rounded-t-xl transition-all relative ${
              activeTab === 'inbox'
                ? 'bg-white text-[#E5252A] border-t-2 border-x border-[#E5252A] border-b-0 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Kotak Masuk Suara Warga</span>
            {submissions.length > 0 && (
              <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {submissions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold rounded-t-xl transition-all ${
              activeTab === 'manage'
                ? 'bg-white text-[#E5252A] border-t-2 border-x border-[#E5252A] border-b-0 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Daftar Artikel Terbit ({publishedArticles.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: TULIS ARTIKEL BARU */}
          {activeTab === 'create' && (
            <form onSubmit={handlePublishArticle} className="space-y-5">
              {successToast && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{successToast}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Judul Berita / Opini <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Akselerasi Transformasi Digital Pelayanan Publik Menuju Tata Kelola Bersih"
                  className="w-full text-sm font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              {/* Rubrik / Pilar & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pilar Kanal
                  </label>
                  <select
                    value={pillar}
                    onChange={(e) => setPillar(e.target.value as any)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="news">1. News (Kanal Berita)</option>
                    <option value="cerita">2. liberta cerita (Opini / Gagasan)</option>
                    <option value="internasional">3. Kabar Internasional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Rubrik
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryType)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="Pemerintahan">Pemerintahan</option>
                    <option value="Politik">Politik</option>
                    <option value="Mahasiswa">Mahasiswa</option>
                    <option value="Sosial Budaya">Sosial Budaya</option>
                    <option value="Ekonomi">Ekonomi</option>
                    <option value="Opini">Opini</option>
                    <option value="Gagasan">Gagasan</option>
                    <option value="Cerita Inspiratif">Cerita Inspiratif</option>
                    <option value="Internasional">Internasional</option>
                    <option value="Olahraga & Seni">Olahraga & Seni</option>
                    <option value="Organisasi & Komunitas">Organisasi & Komunitas</option>
                    <option value="Teknologi">Teknologi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subkategori (Opsional)
                  </label>
                  <input
                    type="text"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    placeholder="Misal: Birokrasi, Kampus, Riset"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500"
                  >
                  </input>
                </div>
              </div>

              {/* Author Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Penulis / Wartawan</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Peran / Desk Liputan</label>
                  <input
                    type="text"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    placeholder="Misal: Redaksi Khusus, Akademisi"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Instansi / Afiliasi</label>
                  <input
                    type="text"
                    value={authorInstitution}
                    onChange={(e) => setAuthorInstitution(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Cover Image & Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  URL Foto Sampul (Cover Image)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Keterangan / Sumber Foto"
                    className="w-1/3 text-xs px-3 py-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                {/* Preset image selector */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] font-semibold text-slate-500">Pilih Preset Cepat:</span>
                  {PRESET_IMAGES.map((img) => (
                    <button
                      key={img.label}
                      type="button"
                      onClick={() => setImageUrl(img.url)}
                      className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                        imageUrl === img.url
                          ? 'bg-red-600 text-white border-red-600 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Executive Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ringkasan Eksekutif (Lead Paragraph)
                </label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Ringkasan 1-2 kalimat pengantar artikel..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Full Content */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Isi Lengkap Artikel <span className="text-red-500">*</span>
                  <span className="text-[11px] font-normal text-slate-400 ml-2">
                    (Pisahkan tiap paragraf dengan enter 2x)
                  </span>
                </label>
                <textarea
                  required
                  rows={8}
                  value={contentRaw}
                  onChange={(e) => setContentRaw(e.target.value)}
                  placeholder="Tuliskan naskah jurnalisme berbobot atau opini kritis Anda di sini..."
                  className="w-full text-xs p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 leading-relaxed font-sans"
                />
              </div>

              {/* Tags & Placement Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tagar Topik (pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={tagsRaw}
                    onChange={(e) => setTagsRaw(e.target.value)}
                    placeholder="Pemerintahan, Kebijakan, Indonesia 2045"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="flex items-center gap-6 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isHero}
                      onChange={(e) => setIsHero(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <span className="text-xs font-bold text-slate-800">Jadikan Headline Utama (Hero)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEditorChoice}
                      onChange={(e) => setIsEditorChoice(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <span className="text-xs font-bold text-slate-800">Pilihan Redaksi</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#E5252A] hover:bg-red-700 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Memproses...' : 'Terbitkan Artikel Sekarang'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: INBOX SUARA WARGA */}
          {activeTab === 'inbox' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Naskah Masuk dari Pembaca & Mahasiswa
                  </h4>
                  <p className="text-xs text-slate-500">
                    Kurasi dan terbitkan opini publik dengan satu klik ke website utama.
                  </p>
                </div>
                <button
                  onClick={loadSubmissions}
                  className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Segarkan
                </button>
              </div>

              {subActionMessage && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{subActionMessage}</span>
                </div>
              )}

              {loadingSubs ? (
                <div className="py-12 text-center text-xs text-slate-400">Memuat naskah masuk...</div>
              ) : submissions.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center space-y-2">
                  <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Belum ada naskah kiriman warga baru</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Formulir "Kirim Tulisan" di sidebar dan kanal cerita siap menerima artikel dari publik dan mahasiswa.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="bg-red-100 text-red-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                          {sub.category}
                        </span>
                        <span className="text-[11px] text-slate-400">{sub.submittedAt}</span>
                      </div>

                      <h5 className="text-sm font-black text-slate-900">{sub.title}</h5>

                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                        <strong>Penulis:</strong> {sub.authorName} • {sub.institution} ({sub.email})
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {sub.content}
                      </p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDeleteSubmission(sub.id)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                        <button
                          onClick={() => handlePublishSubmission(sub.id)}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Terbitkan ke Publikasi</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MANAGE PUBLISHED ARTICLES */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Semua Artikel yang Sedang Mengudara ({publishedArticles.length})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Kelola artikel yang tampil di website.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-[#E5252A] hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Artikel</span>
                </button>
              </div>

              {publishedArticles.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center space-y-3">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Belum ada artikel yang diterbitkan</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Website siap dimulai dari 0. Buat dan terbitkan berita atau opini perdana Anda sekarang.
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-2 bg-[#E5252A] hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm"
                  >
                    Tulis Artikel Pertama
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {publishedArticles.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => {
                        onClose();
                        onOpenArticle(art);
                      }}
                      className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <img
                          src={art.image}
                          alt={art.title}
                          className="w-14 h-12 rounded-lg object-cover flex-shrink-0 bg-slate-100"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="bg-slate-900 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded">
                              {art.category}
                            </span>
                            {art.isHero && (
                              <span className="bg-red-100 text-[#E5252A] text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5" />
                                Headline
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">{art.publishedAt}</span>
                          </div>
                          <h6 className="text-xs font-black text-slate-900 truncate">{art.title}</h6>
                          <p className="text-[11px] text-slate-500 truncate">
                            Oleh: {art.author.name} • {art.views} tayangan
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={(e) => handleDeleteArticle(art.id, e)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus artikel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
