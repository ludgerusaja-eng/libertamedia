import React, { useState } from 'react';
import { X, ExternalLink, Bell, Mail, Share2, Check } from 'lucide-react';

interface SocialPlatformModalProps {
  platform: string | null;
  onClose: () => void;
}

export const SocialPlatformModal: React.FC<SocialPlatformModalProps> = ({ platform, onClose }) => {
  if (!platform) return null;

  const platformDetails: { [key: string]: { name: string; handle: string; desc: string; bioList: string[]; link: string } } = {
    Instagram: {
      name: 'LIBERTA MEDIA',
      handle: '@officiallibertamedia',
      desc: 'Kanal resmi Instagram LIBERTA MEDIA untuk infografis, visual stories, dan liputan eksklusif.',
      bioList: ['LIBERTA MEDIA 🇮🇩', 'News • Stories • Ideas', 'Media untuk Semua', 'Part of LIBERTA GROUP'],
      link: 'https://www.instagram.com/officiallibertamedia',
    },
    Threads: {
      name: 'LIBERTA MEDIA',
      handle: '@officiallibertamedia',
      desc: 'Kanal resmi Threads LIBERTA MEDIA untuk dialektika, diskusi isu hangat, dan opini publik.',
      bioList: ['LIBERTA MEDIA 🇮🇩', 'News • Stories • Ideas', 'Media untuk Semua', 'Part of LIBERTA GROUP'],
      link: 'https://www.threads.net/@officiallibertamedia',
    },
    'X (Twitter)': {
      name: 'Liberta Media',
      handle: '@libertamedia_',
      desc: 'Kanal resmi X (Twitter) LIBERTA MEDIA untuk breaking news, kutipan opini, dan utas jurnalisme.',
      bioList: ['LIBERTA MEDIA 🇮🇩', 'News • Stories • Ideas', 'Media untuk Semua', 'Part of LIBERTA GROUP'],
      link: 'https://x.com/libertamedia_',
    },
    X: {
      name: 'Liberta Media',
      handle: '@libertamedia_',
      desc: 'Kanal resmi X (Twitter) LIBERTA MEDIA untuk breaking news, kutipan opini, dan utas jurnalisme.',
      bioList: ['LIBERTA MEDIA 🇮🇩', 'News • Stories • Ideas', 'Media untuk Semua', 'Part of LIBERTA GROUP'],
      link: 'https://x.com/libertamedia_',
    },
    TikTok: {
      name: 'Liberta Media',
      handle: '@libertamedia',
      desc: 'Kanal resmi TikTok LIBERTA MEDIA untuk rangkuman kabar kilat dan jurnalisme video visual.',
      bioList: ['LIBERTA MEDIA 🇮🇩', 'News • Stories • Ideas', 'Media untuk Semua', 'Part of LIBERTA GROUP'],
      link: 'https://www.tiktok.com/@libertamedia',
    },
  };

  const details = platformDetails[platform] || {
    name: 'LIBERTA MEDIA',
    handle: '@officiallibertamedia',
    desc: 'Kanal resmi informasi dan dialog publik libertamedia.com',
    bioList: ['LIBERTA MEDIA 🇮🇩', 'News • Stories • Ideas', 'Media untuk Semua', 'Part of LIBERTA GROUP'],
    link: 'https://www.instagram.com/officiallibertamedia',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden relative p-6 space-y-4 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          aria-label="Tutup modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Circular Profile Avatar Badge matching the screenshots */}
        <div className="w-20 h-20 rounded-full bg-black border-2 border-slate-700 text-white flex flex-col items-center justify-center mx-auto shadow-md select-none">
          <span className="text-xs font-black tracking-widest leading-none">LIBERTA</span>
          <span className="text-[7px] tracking-[0.25em] text-slate-300 font-light mt-0.5 border-t border-slate-600 pt-0.5 uppercase">
            MEDIA
          </span>
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-red-600">
            Kanal Resmi {platform}
          </span>
          <h3 className="text-xl font-black text-slate-900 mt-0.5">{details.name}</h3>
          <p className="text-xs font-mono font-bold text-slate-600">{details.handle}</p>
        </div>

        {/* Bio from the screenshots */}
        <div className="bg-slate-950 text-slate-200 p-3.5 rounded-xl text-left border border-slate-800 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>Profil Bio Akun Resmi</span>
            <span className="text-emerald-400">Terverifikasi</span>
          </div>
          <div className="text-xs space-y-0.5 pt-1">
            {details.bioList.map((line, idx) => (
              <p key={idx} className={idx === 0 ? 'font-bold text-white' : 'text-slate-300'}>
                {line}
              </p>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed px-1">
          {details.desc}
        </p>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Tutup
          </button>
          <a
            href={details.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-[#E5252A] hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <span>Buka {platform}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewsletterModal: React.FC<NewsletterModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
  };

  const handleReset = () => {
    setSubscribed(false);
    setEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden relative p-6 space-y-4 text-center">
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-red-100 text-[#E5252A] flex items-center justify-center mx-auto shadow-sm">
          <Bell className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-xl font-black text-slate-900">
            Langganan Buletin Mingguan
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Dapatkan rangkuman liputan mendalam, kurasi opini terbaik, dan analisis kebijakan setiap Senin pagi di email Anda.
          </p>
        </div>

        {subscribed ? (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2 text-emerald-900">
            <Check className="w-6 h-6 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold">Terima Kasih Telah Berlangganan!</p>
            <p className="text-[11px] text-emerald-700">
              Kami telah mengirimkan konfirmasi pendaftaran ke <strong>{email}</strong>.
            </p>
            <button
              onClick={handleReset}
              className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg"
            >
              Selesai
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan alamat email aktif Anda"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Bebas spam. Anda dapat berhenti berlangganan kapan saja dengan satu klik.
            </p>
            <button
              type="submit"
              className="w-full bg-[#E5252A] hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm transition-all"
            >
              Daftar Sekarang (Gratis)
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
