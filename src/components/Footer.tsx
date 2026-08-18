import React from 'react';
import { Mail, Phone, ArrowUp } from 'lucide-react';
import { CategoryType } from '../types';

interface FooterProps {
  onSelectCategory: (category: CategoryType) => void;
  onOpenSubmitStory: () => void;
  onOpenSocialModal: (platform: string) => void;
  onOpenPage?: (slug: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onOpenSubmitStory,
  onOpenSocialModal,
  onOpenPage
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="site-footer" className="bg-[#0F172A] text-slate-400 pt-14 pb-8 border-t-4 border-[#E5252A] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Col 1: Brand & Tentang Kami */}
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                LIBERTA <span className="font-light text-red-400">MEDIA</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>libertamedia.com</strong> adalah media dan platform opini independen yang menyuarakan aspirasi publik, mahasiswa, dan masyarakat luas dengan semangat "Media Untuk Semua".
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Ikuti Kami:</span>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => onOpenSocialModal('Instagram')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-[#E5252A] text-white text-[10px] font-bold transition-colors"
                >
                  Instagram
                </button>
                <button
                  onClick={() => onOpenSocialModal('Threads')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-[#E5252A] text-white text-[10px] font-bold transition-colors"
                >
                  Threads
                </button>
                <button
                  onClick={() => onOpenSocialModal('X (Twitter)')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-[#E5252A] text-white text-[10px] font-bold transition-colors"
                >
                  X
                </button>
                <button
                  onClick={() => onOpenSocialModal('TikTok')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-[#E5252A] text-white text-[10px] font-bold transition-colors"
                >
                  TikTok
                </button>
              </div>
            </div>
          </div>

          {/* Col 2: Visi & Misi Menuju Indonesia Emas 2045 */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-sm relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-8 after:h-0.5 after:bg-[#E5252A]">
              Visi Menuju Indonesia Emas 2045
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Berkomitmen menjadi akselerator literasi dan pemikiran konstruktif guna mempersiapkan sumber daya manusia unggul, berdaya saing global, dan berintegritas tinggi dalam menyongsong satu abad kemerdekaan Republik Indonesia.
            </p>
          </div>

          {/* Col 3: Rubrikasi & Navigasi Cepat */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-sm relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-8 after:h-0.5 after:bg-[#E5252A]">
              Kanal Berita & Gagasan
            </h4>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
              <button
                onClick={() => onSelectCategory('Pemerintahan')}
                className="text-left hover:text-white transition-colors"
              >
                • Pemerintahan
              </button>
              <button
                onClick={() => onSelectCategory('Politik')}
                className="text-left hover:text-white transition-colors"
              >
                • Politik
              </button>
              <button
                onClick={() => onSelectCategory('Mahasiswa')}
                className="text-left hover:text-white transition-colors"
              >
                • Mahasiswa
              </button>
              <button
                onClick={() => onSelectCategory('Ekonomi')}
                className="text-left hover:text-white transition-colors"
              >
                • Ekonomi
              </button>
              <button
                onClick={() => onSelectCategory('Opini')}
                className="text-left hover:text-white transition-colors text-amber-300 font-bold"
              >
                • Opini Publik
              </button>
              <button
                onClick={() => onSelectCategory('Cerita Inspiratif')}
                className="text-left hover:text-white transition-colors text-amber-300 font-bold"
              >
                • Cerita Inspiratif
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenSubmitStory}
                className="w-full text-center bg-red-950/60 hover:bg-[#E5252A] text-white border border-red-800 text-xs font-bold py-2 rounded-lg transition-colors shadow-sm"
              >
                Kirim Naskah Opini Anda
              </button>
            </div>
          </div>

          {/* Col 4: Halaman Statis CMS & Kontak */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-sm relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-8 after:h-0.5 after:bg-[#E5252A]">
              Informasi & Pedoman Siber
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a
                  href="/p/pedoman-media-siber"
                  onClick={(e) => {
                    if (onOpenPage) { e.preventDefault(); onOpenPage('pedoman-media-siber'); }
                  }}
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  • Pedoman Media Siber
                </a>
              </li>
              <li>
                <a
                  href="/p/redaksi"
                  onClick={(e) => {
                    if (onOpenPage) { e.preventDefault(); onOpenPage('redaksi'); }
                  }}
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  • Susunan Redaksi
                </a>
              </li>
              <li>
                <a
                  href="/p/kontak-hak-jawab"
                  onClick={(e) => {
                    if (onOpenPage) { e.preventDefault(); onOpenPage('kontak-hak-jawab'); }
                  }}
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  • Kontak & Hak Jawab
                </a>
              </li>
            </ul>

            <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px]">
              <p className="text-slate-400">Email: redaksi@libertamedia.com</p>
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="text-center sm:text-left">
            &copy; {new Date().getFullYear()} <strong>libertamedia.com</strong> — Hak Cipta Dilindungi.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors"
            >
              <span>Kembali ke Atas</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
