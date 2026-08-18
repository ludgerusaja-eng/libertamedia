import React from 'react';
import { Play, Film, Clock, Eye, Sparkles } from 'lucide-react';
import { VideoItem } from '../types';

interface VideoSectionProps {
  videos: VideoItem[];
  onSelectVideo: (video: VideoItem) => void;
}

export const VideoSection: React.FC<VideoSectionProps> = ({ videos, onSelectVideo }) => {
  const mainVideo = videos[0];
  const sideVideos = videos.slice(1, 3);

  if (!mainVideo) return null;

  return (
    <section id="video-section" className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 mb-12 shadow-xl border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6 relative">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E5252A] flex items-center justify-center text-white shadow-md">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Video Pilihan & Multimedia</span>
              <span className="bg-red-600/30 border border-red-500/40 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                HD
              </span>
            </h2>
            <p className="text-xs text-slate-400">Liputan investigasi, wawancara mendalam, dan dokumenter humanis</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Liberta TV Digital</span>
        </div>
        <div className="absolute -bottom-[2px] left-0 w-24 h-[2px] bg-[#E5252A]" />
      </div>

      {/* Video Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Video Highlight (2 cols) */}
        <div className="lg:col-span-2">
          <div
            onClick={() => onSelectVideo(mainVideo)}
            className="group relative rounded-xl overflow-hidden bg-slate-900 aspect-video cursor-pointer border border-slate-800 hover:border-red-500/50 transition-all duration-300 shadow-lg flex flex-col justify-end"
          >
            <img
              src={mainVideo.thumbnail}
              alt={mainVideo.title}
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-90 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* Play Button Center Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#E5252A] group-hover:bg-red-500 text-white flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-110 group-active:scale-95 ring-8 ring-white/20">
                <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-current ml-1" />
              </div>
            </div>

            {/* Duration & Category Tag */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="bg-[#E5252A] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
                {mainVideo.category}
              </span>
              <span className="bg-black/70 backdrop-blur-sm text-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 border border-white/10">
                <Clock className="w-3 h-3 text-red-400" />
                {mainVideo.duration}
              </span>
            </div>

            {/* Bottom Content */}
            <div className="relative z-10 p-5 sm:p-6 space-y-2">
              <h3 className="text-base sm:text-xl font-black text-white leading-snug group-hover:text-red-300 transition-colors">
                {mainVideo.title}
              </h3>
              <p className="text-xs text-slate-300 line-clamp-2 max-w-2xl leading-relaxed">
                {mainVideo.description}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  {mainVideo.views}
                </span>
                <span>•</span>
                <span>{mainVideo.publishedAt}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Side Video Playlist (1 col) */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between pb-1 border-b border-slate-800">
            <span>Playlist Rekomendasi</span>
            <span className="text-[#E5252A] text-[11px] font-semibold">{videos.length} Video</span>
          </div>

          <div className="space-y-3.5 flex-1 flex flex-col justify-between">
            {sideVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => onSelectVideo(video)}
                className="group bg-slate-900/80 hover:bg-slate-900 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex gap-3.5 items-center"
              >
                {/* Thumbnail with Mini Play Icon */}
                <div className="relative w-32 h-20 sm:w-36 sm:h-22 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-[#E5252A] text-white flex items-center justify-center shadow">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                    {video.duration}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-[9px] font-extrabold uppercase text-red-400">
                    {video.category}
                  </span>
                  <h4 className="text-xs font-bold text-white group-hover:text-red-300 transition-colors leading-snug line-clamp-2">
                    {video.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-0.5">
                    <span>{video.views}</span>
                    <span>•</span>
                    <span>{video.publishedAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
