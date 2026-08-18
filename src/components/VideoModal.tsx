import React from 'react';
import { X, Play, Clock, Eye, Film } from 'lucide-react';
import { VideoItem } from '../types';

interface VideoModalProps {
  video: VideoItem | null;
  onClose: () => void;
  allVideos: VideoItem[];
  onSelectOtherVideo: (video: VideoItem) => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  video,
  onClose,
  allVideos,
  onSelectOtherVideo,
}) => {
  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex justify-center items-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-800 overflow-hidden relative max-h-[92vh] flex flex-col">
        
        {/* Top bar */}
        <div className="px-5 py-3.5 bg-slate-950 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="bg-[#E5252A] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
              {video.category}
            </span>
            <span className="text-xs font-bold text-slate-300 truncate max-w-md">
              {video.title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Area */}
        <div className="relative aspect-video bg-black flex items-center justify-center">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          
          {/* Simulated Video Player Controls / Play banner */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-[#E5252A] text-white flex items-center justify-center shadow-2xl ring-8 ring-white/10 hover:scale-110 transition-transform cursor-pointer">
              <Play className="w-9 h-9 fill-current ml-1" />
            </div>
            <div className="max-w-lg">
              <p className="text-sm font-black text-white drop-shadow">
                Pratinjau Video Liputan Redaksi
              </p>
              <p className="text-xs text-slate-300 drop-shadow mt-1">
                Kualitas Full HD 1080p • Produksi Tim Multimedia libertamedia
              </p>
            </div>
          </div>
        </div>

        {/* Details & Playlist */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
              {video.title}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {video.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-red-400" />
                Durasi: {video.duration}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                {video.views}
              </span>
              <span>•</span>
              <span>Diterbitkan: {video.publishedAt}</span>
            </div>
          </div>

          {/* Playlist */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Film className="w-4 h-4 text-[#E5252A]" />
              <span>Video Terkait Lainnya</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allVideos
                .filter((v) => v.id !== video.id)
                .map((otherVideo) => (
                  <div
                    key={otherVideo.id}
                    onClick={() => onSelectOtherVideo(otherVideo)}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 cursor-pointer transition-all flex gap-3 items-center group"
                  >
                    <img
                      src={otherVideo.thumbnail}
                      alt={otherVideo.title}
                      className="w-20 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-bold uppercase text-red-400">
                        {otherVideo.category}
                      </span>
                      <h4 className="text-xs font-bold text-white group-hover:text-red-300 truncate">
                        {otherVideo.title}
                      </h4>
                      <p className="text-[10px] text-slate-400">{otherVideo.duration}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
