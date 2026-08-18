import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, X, RotateCcw, RotateCw } from 'lucide-react';
import { Article } from '../types';

interface AudioPlayerBarProps {
  article: Article | null;
  onClose: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({ article, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(25);

  useEffect(() => {
    if (article) {
      setIsPlaying(true);
      setProgress(10);
    }
  }, [article]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!article) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start justify-between gap-3">
        
        {/* Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-[#E5252A] flex items-center justify-center text-white flex-shrink-0 shadow-md">
            <Volume2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold uppercase text-red-400">
              Narasi Audio Liberta
            </span>
            <h4 className="text-xs font-bold text-white truncate">
              {article.title}
            </h4>
            <p className="text-[10px] text-slate-400">
              Oleh: {article.author.name}
            </p>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          title="Tutup pemutar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 space-y-1">
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden cursor-pointer">
          <div
            className="bg-[#E5252A] h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>01:15</span>
          <span>{article.audioDuration || '03:45'}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <button
          onClick={() => setProgress((p) => Math.max(0, p - 10))}
          className="text-slate-400 hover:text-white p-1"
          title="Mundur 10 detik"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center hover:bg-red-100 hover:text-[#E5252A] transition-colors shadow"
          title={isPlaying ? 'Jeda' : 'Putar'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        <button
          onClick={() => setProgress((p) => Math.min(100, p + 10))}
          className="text-slate-400 hover:text-white p-1"
          title="Maju 10 detik"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
