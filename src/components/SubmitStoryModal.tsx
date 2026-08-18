import React, { useState } from 'react';
import { X, PenLine, CheckCircle2, Send, AlertCircle, FileText, Info } from 'lucide-react';
import { CitizenSubmission } from '../types';
import { api } from '../services/api';

interface SubmitStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (submission: CitizenSubmission) => void;
}

export const SubmitStoryModal: React.FC<SubmitStoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Opini',
    authorName: '',
    email: '',
    institution: '',
    abstract: '',
    content: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.authorName.trim()) {
      return;
    }

    setLoading(true);
    try {
      const newSubmission = await api.submitCitizenStory({
        title: formData.title.trim(),
        category: formData.category,
        authorName: formData.authorName.trim(),
        email: formData.email.trim(),
        institution: formData.institution.trim(),
        abstract: formData.abstract.trim(),
        content: formData.content.trim(),
      });

      if (onSubmit) onSubmit(newSubmission);
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim naskah. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setFormData({
      title: '',
      category: 'Opini',
      authorName: '',
      email: '',
      institution: '',
      abstract: '',
      content: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#E5252A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenLine className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="text-base font-black tracking-tight">
                Kirim Tulisan & Opini Pembaca
              </h3>
              <p className="text-xs text-red-100">Kanal Partisipasi Publik libertamedia</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-slate-900">
                Naskah Anda Berhasil Terkirim!
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Terima kasih atas partisipasi Anda dalam memperkaya khazanah nalar bangsa. Dewan Redaksi libertamedia akan meninjau naskah Anda dalam kurun 1-3 hari kerja.
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs text-slate-700 max-w-md mx-auto space-y-1">
                <p><strong>Judul:</strong> {formData.title}</p>
                <p><strong>Rubrik:</strong> {formData.category}</p>
                <p><strong>Penulis:</strong> {formData.authorName} ({formData.institution || 'Independen'})</p>
              </div>
              <button
                onClick={handleResetAndClose}
                className="bg-[#E5252A] hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg transition-all"
              >
                Kembali ke Beranda
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Guidelines Info */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Pedoman Naskah:</strong> Naskah harus orisinal, argumentatif, tidak mengandung ujaran kebencian/SARA, dan berorientasi pada solusi konstruktif untuk masyarakat.
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Penulis *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    placeholder="Contoh: Dr. Budi Prasetyo"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Kontak *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@email.com"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pilih Rubrik / Kategori *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                  >
                    <option value="Opini">Opini Publik</option>
                    <option value="Gagasan">Gagasan & Solusi Kebijakan</option>
                    <option value="Cerita Inspiratif">Cerita Inspiratif Komunitas</option>
                    <option value="Mahasiswa">Suara Kampus & Riset Muda</option>
                    <option value="Sosial Budaya">Esai Sosial Budaya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Institusi / Komunitas / Kota
                  </label>
                  <input
                    type="text"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    placeholder="Contoh: Universitas Indonesia / Pegiat Literasi"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Tulisan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Buat judul yang menarik dan mencerminkan gagasan utama..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Abstrak Singkat / Latar Belakang (Maks 2 Kalimat)
                </label>
                <input
                  type="text"
                  value={formData.abstract}
                  onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                  placeholder="Ringkasan poin utama artikel Anda..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Isi Naskah Tulisan *
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {formData.content.length} karakter
                  </span>
                </div>
                <textarea
                  required
                  rows={7}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Tuliskan naskah lengkap Anda di sini..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="text-xs text-slate-600 hover:text-slate-900 px-4 py-2"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#E5252A] hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Naskah ke Redaksi</span>
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
