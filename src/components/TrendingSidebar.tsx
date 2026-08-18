import React from 'react';
import { Flame, Eye, Hash, Send, Sparkles } from 'lucide-react';
import { Article, PollData } from '../types';
import { HOT_TAGS } from '../data/mockArticles';

interface TrendingSidebarProps {
  articles: Article[];
  poll?: PollData;
  onSelectArticle: (article: Article) => void;
  onSelectTag: (tag: string) => void;
  onOpenSocialModal: (platformName: string) => void;
  onOpenSubmitStory: () => void;
}

export const TrendingSidebar: React.FC<TrendingSidebarProps> = ({
  articles,
  onSelectArticle,
  onSelectTag,
  onOpenSocialModal,
  onOpenSubmitStory,
}) => {
  const trendingArticles = articles.filter((a) => a.isTrending || (a.trendingRank && a.trendingRank <= 5)).slice(0, 4);

  return (
    <aside className="space-y-6">
      
      {/* 1. Trending Articles Box */}
      <div id="trending-widget-box" className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3 mb-4 relative">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#E5252A] fill-[#E5252A]" />
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Trending Topik
            </h3>
          </div>
          <span className="text-[10px] font-bold uppercase bg-red-100 text-[#E5252A] px-2 py-0.5 rounded">
            24 Jam
          </span>
          <div className="absolute -bottom-[2px] left-0 w-16 h-[2px] bg-[#E5252A]" />
        </div>

        <ol className="divide-y divide-slate-100">
          {trendingArticles.map((article, index) => (
            <li
              key={article.id}
              onClick={() => onSelectArticle(article)}
              className="py-3 group cursor-pointer flex items-start gap-3.5 hover:bg-slate-50/70 rounded-lg p-1 transition-all"
            >
              {/* Number indicator */}
              <span className="text-2xl font-black text-[#E5252A] leading-none pt-0.5 w-6 text-center">
                {article.trendingRank || index + 1}
              </span>

              {/* Title & Metadata */}
              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {article.category}
                </span>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#E5252A] transition-colors leading-snug line-clamp-2">
                  {article.title}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-0.5">
                    <Eye className="w-3 h-3 text-slate-400" />
                    {article.views.toLocaleString('id-ID')} Pembaca
                  </span>
                  <span>•</span>
                  <span>{article.publishedAt}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* 2. Follow Platform Kami */}
      <div id="platform-social-box" className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="border-b-2 border-slate-200 pb-2 relative">
          <h3 className="text-sm font-extrabold text-slate-900">
            Ikuti Platform Kami
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Dapatkan konten singkat, visual, dan dialog langsung di kanal resmi libertamedia:
          </p>
          <div className="absolute -bottom-[2px] left-0 w-12 h-[2px] bg-[#E5252A]" />
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => onOpenSocialModal('Instagram')}
            className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-900 text-white hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-bold w-full min-w-0"
            title="Instagram @officiallibertamedia"
          >
            <span>Instagram</span>
            <span className="text-[10px] font-normal text-slate-400 font-mono truncate w-full text-center">
              @officiallibertamedia
            </span>
          </button>

          <button
            onClick={() => onOpenSocialModal('Threads')}
            className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-900 text-white hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-bold w-full min-w-0"
            title="Threads @officiallibertamedia"
          >
            <span>Threads</span>
            <span className="text-[10px] font-normal text-slate-400 font-mono truncate w-full text-center">
              @officiallibertamedia
            </span>
          </button>

          <button
            onClick={() => onOpenSocialModal('X (Twitter)')}
            className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-900 text-white hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-bold w-full min-w-0"
            title="X @libertamedia_"
          >
            <span>X (Twitter)</span>
            <span className="text-[10px] font-normal text-slate-400 font-mono truncate w-full text-center">
              @libertamedia_
            </span>
          </button>

          <button
            onClick={() => onOpenSocialModal('TikTok')}
            className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-900 text-white hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-bold w-full min-w-0"
            title="TikTok @libertamedia"
          >
            <span>TikTok</span>
            <span className="text-[10px] font-normal text-slate-400 font-mono truncate w-full text-center">
              @libertamedia
            </span>
          </button>
        </div>
      </div>

      {/* 4. Hot Tag Cloud */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-400">
          <Hash className="w-4 h-4" />
          <span>Topik Populer Pekan Ini</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {HOT_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => onSelectTag(tag.replace('#', ''))}
              className="bg-slate-800 hover:bg-[#E5252A] text-slate-200 hover:text-white text-[11px] font-medium px-2.5 py-1 rounded-full transition-all border border-slate-700"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Citizen Journalism Callout Card */}
      <div className="bg-gradient-to-br from-red-600 to-[#B81419] text-white rounded-xl p-5 shadow-md space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Sparkles className="w-24 h-24" />
        </div>
        <span className="bg-white/20 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide">
          Kolom Suara Warga
        </span>
        <h4 className="text-sm sm:text-base font-black leading-snug">
          Punya gagasan, riset, atau opini kritis untuk bangsa?
        </h4>
        <p className="text-xs text-red-100 leading-relaxed">
          Kirimkan tulisan Anda untuk dikurasi dan diterbitkan di rubrik liberta cerita.
        </p>
        <button
          onClick={onOpenSubmitStory}
          className="w-full bg-white text-[#E5252A] hover:bg-slate-100 font-extrabold text-xs py-2.5 px-4 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Kirim Tulisan Sekarang</span>
        </button>
      </div>

    </aside>
  );
};
