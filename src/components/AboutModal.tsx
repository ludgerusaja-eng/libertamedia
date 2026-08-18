import React from 'react';
import { X, ArrowLeft, Target, ShieldCheck, Sparkles, HeartHandshake, Compass } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 p-0 sm:p-4 md:p-6 bg-[#0F172A]/80 backdrop-blur-md flex justify-center items-center animate-in fade-in duration-200">
      
      {/* Container Halaman Statis Tentang Kami */}
      <div className="bg-white text-slate-900 rounded-none sm:rounded-2xl w-full max-w-3xl shadow-2xl border-0 sm:border border-slate-200 h-full sm:h-auto sm:max-h-[90vh] flex flex-col relative overflow-y-auto overscroll-contain">
        
        {/* Sticky Header Action Bar */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="p-1.5 -ml-1.5 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors flex items-center justify-center min-h-[40px] min-w-[40px]"
              aria-label="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5 text-slate-800" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#E5252A] rounded-lg flex items-center justify-center text-white font-black text-xs">
                LM
              </div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                Tentang Kami
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Brand Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-[#1E293B] text-white p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-lg border border-slate-800">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Compass className="w-48 h-48" />
            </div>
            
            <div className="relative z-10 space-y-3">
              <span className="bg-[#E5252A] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                Profil & Identitas Redaksi
              </span>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                LIBERTA<span className="text-[#E5252A]">MEDIA</span>.COM
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide">
                Media Untuk Semua • Portal Berita & Platform Opini Publik Independen
              </p>
            </div>
          </div>

          {/* Section 1: Profil Media & Semangat Redaksi */}
          <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4 relative">
            <div className="flex items-center gap-2.5 text-[#E5252A]">
              <HeartHandshake className="w-6 h-6" />
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-950 tracking-tight">
                Media & Platform Opini Independen
              </h2>
            </div>

            <p className="text-slate-800 text-base sm:text-lg font-serif leading-relaxed">
              <strong>libertamedia.com</strong> adalah media dan platform opini independen yang menyuarakan aspirasi publik, mahasiswa, dan masyarakat luas dengan semangat <em>"Media Untuk Semua"</em>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-2xs flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-700">Independen & Objektif</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-2xs flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-700">Ruang Opini Publik</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-2xs flex items-center gap-2.5">
                <Target className="w-4 h-4 text-[#E5252A] flex-shrink-0" />
                <span className="text-xs font-bold text-slate-700">Media Untuk Semua</span>
              </div>
            </div>
          </div>

          {/* Section 2: Visi Menuju Indonesia Emas 2045 */}
          <div className="bg-gradient-to-br from-red-50 via-white to-amber-50 rounded-2xl p-6 sm:p-8 border border-red-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-[#E5252A]">
              <Target className="w-6 h-6" />
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-950 tracking-tight">
                Visi Menuju Indonesia Emas 2045
              </h2>
            </div>

            <p className="text-slate-800 text-base sm:text-lg font-serif leading-relaxed">
              Berkomitmen menjadi akselerator literasi dan pemikiran konstruktif guna mempersiapkan sumber daya manusia unggul, berdaya saing global, dan berintegritas tinggi dalam menyongsong satu abad kemerdekaan Republik Indonesia.
            </p>
          </div>

          {/* Footer Call to Action inside Modal */}
          <div className="text-center pt-4 border-t border-slate-100 space-y-3">
            <p className="text-xs text-slate-500 font-medium">
              Ingin berkontribusi gagasan atau menyuarakan opini Anda?
            </p>
            <button
              onClick={onClose}
              className="bg-slate-900 hover:bg-black text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-sm"
            >
              Kembali Membaca Berita Utama
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
