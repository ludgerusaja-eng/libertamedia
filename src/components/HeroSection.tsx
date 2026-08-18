import React from 'react';
import { 
  Clock, 
  Eye, 
  Volume2, 
  Bookmark, 
  BookmarkCheck, 
  ArrowUpRight, 
  Sparkles,
  Flame,
  PenSquare,
  Send,
  Radio
} from 'lucide-react';
import { Article } from '../types';

interface HeroSectionProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  savedArticleIds: string[];
  onToggleSave: (articleId: string, e: React.MouseEvent) => void;
  onPlayAudio: (article: Article, e: React.MouseEvent) => void;
  onOpenSubmitStory?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  articles,
  onSelectArticle,
  savedArticleIds,
  onToggleSave,
  onPlayAudio,
  onOpenSubmitStory,
}) => {
  const heroArticle = articles.find((a) => a.isHero) || articles[0];
  const sideArticles = articles.filter((a) => a.id !== heroArticle?.id && a.pillar === 'news').slice(0, 3);

  if (!heroArticle) {
    return (
      <section id="hero-section" className="mb-12 pt-2">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl p-8 sm:p-12 text-white border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-48 h-48 text-red-500" />
          </div>

          <div className="max-w-2xl space-y-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="bg-[#E5252A] text-white text-[10px] font-black uppercase px-2.5 py-1 rounded tracking-wider shadow-sm flex items-center gap-1.5">
                <Radio className="w-3 h-3 animate-pulse" />
                Sistem Siap Mengudara
              </span>
              <span className="text-xs text-slate-400 font-mono">libertamedia.com v1.0</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Portal Berita & Opini Independen Siap Diluncurkan
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Selamat datang di <strong>libertamedia.com</strong> — Media dan platform opini independen yang menyuarakan aspirasi publik, mahasiswa, dan masyarakat luas dengan semangat "Media Untuk Semua".
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              {onOpenSubmitStory && (
                <button
                  onClick={onOpenSubmitStory}
                  className="bg-[#E5252A] hover:bg-red-700 text-white font-black text-xs sm:text-sm py-3 px-6 rounded-xl shadow-lg flex items-center gap-2 transition-all hover:scale-105"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Tulisan / Opini Warga</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const isHeroSaved = savedArticleIds.includes(heroArticle.id);

  return (
    <section id="hero-section" className="mb-12 pt-2">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3 mb-6 relative">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>News - Pilihan Editor</span>
            <span className="w-2 h-2 rounded-full bg-[#E5252A] animate-ping inline-block"></span>
          </h2>
          <span className="bg-[#E5252A] text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider shadow-sm">
            Eksklusif
          </span>
        </div>
        {/* Red underline decoration */}
        <div className="absolute -bottom-[2px] left-0 w-24 h-[2px] bg-[#E5252A]" />
      </div>

      {/* Hero Grid: Main Card + 3 Stacked Side Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Hero Card (2 cols) */}
        <div className="lg:col-span-2">
          <article 
            id={`hero-article-${heroArticle.id}`}
            onClick={() => onSelectArticle(heroArticle)}
            className="group relative rounded-xl overflow-hidden shadow-md bg-slate-900 min-h-[420px] sm:min-h-[480px] flex flex-col justify-end cursor-pointer border border-slate-200/50 hover:shadow-xl transition-all duration-300"
          >
            {/* Background Image */}
            <img 
              src={heroArticle.image} 
              alt={heroArticle.title} 
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700 ease-out"
              loading="eager"
            />
            
            {/* Gradient Overlays for High Legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-transparent to-transparent hidden sm:block" />

            {/* Top Quick Actions (Bookmark & Audio) */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              {heroArticle.audioDuration && (
                <button
                  onClick={(e) => onPlayAudio(heroArticle, e)}
                  className="bg-slate-900/80 backdrop-blur-md hover:bg-[#E5252A] text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20 shadow transition-all hover:scale-105"
                  title="Dengarkan Berita Ini"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Dengar</span>
                  <span className="text-[10px] text-slate-300">{heroArticle.audioDuration}</span>
                </button>
              )}

              <button
                onClick={(e) => onToggleSave(heroArticle.id, e)}
                className={`p-2 rounded-full backdrop-blur-md transition-all ${
                  isHeroSaved 
                    ? 'bg-amber-400 text-slate-950' 
                    : 'bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20'
                }`}
                title={isHeroSaved ? 'Hapus dari simpanan' : 'Simpan artikel'}
              >
                {isHeroSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
            </div>

            {/* Content Body */}
            <div className="relative z-10 p-5 sm:p-7 md:p-8 text-white space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#E5252A] text-white text-xs font-extrabold px-2.5 py-1 rounded shadow-sm tracking-wide uppercase">
                  {heroArticle.category}
                </span>
                {heroArticle.subcategory && (
                  <span className="bg-slate-800/80 text-slate-200 text-xs font-semibold px-2 py-0.5 rounded backdrop-blur-sm border border-slate-700">
                    {heroArticle.subcategory}
                  </span>
                )}
                <span className="text-slate-300 text-xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-red-400" />
                  {heroArticle.publishedAt}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl md:text-3xl font-black leading-snug tracking-tight group-hover:text-red-200 transition-colors">
                {heroArticle.title}
              </h3>

              <p className="text-slate-200/90 text-sm sm:text-base line-clamp-2 sm:line-clamp-3 font-normal max-w-3xl leading-relaxed">
                {heroArticle.summary}
              </p>

              {/* Author & Meta */}
              <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <img 
                    src={heroArticle.author.avatar} 
                    alt={heroArticle.author.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-red-500" 
                  />
                  <div>
                    <div className="font-bold text-white leading-tight">{heroArticle.author.name}</div>
                    <div className="text-[11px] text-slate-300">{heroArticle.author.role}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    {heroArticle.views.toLocaleString('id-ID')}
                  </span>
                  <span className="hidden sm:inline bg-red-600/30 text-red-200 font-semibold px-2 py-0.5 rounded border border-red-500/30">
                    {heroArticle.readTime}
                  </span>
                  <div className="bg-white text-slate-900 group-hover:bg-[#E5252A] group-hover:text-white p-1.5 rounded-full transition-all duration-300">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

            </div>
          </article>
        </div>

        {/* Side Stack of Curated Editor Picks (1 col) */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sorotan Berita Redaksi
            </span>
            <span className="text-[11px] font-semibold text-[#E5252A] flex items-center gap-1">
              <Flame className="w-3 h-3 fill-current" /> Pilihan
            </span>
          </div>

          <div className="flex flex-col gap-3.5 flex-1 justify-between">
            {sideArticles.map((article) => {
              const isSaved = savedArticleIds.includes(article.id);
              return (
                <article
                  key={article.id}
                  id={`side-article-${article.id}`}
                  onClick={() => onSelectArticle(article)}
                  className="group bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-red-200 transition-all cursor-pointer flex gap-3.5 items-center relative"
                >
                  {/* Thumbnail */}
                  <div className="relative w-28 h-22 sm:w-32 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
                    <img 
                      src={article.image} 
                      alt={article.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <span className="absolute top-1.5 left-1.5 bg-[#E5252A] text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm">
                      {article.category}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug group-hover:text-[#E5252A] transition-colors line-clamp-2">
                      {article.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {article.publishedAt}
                      </span>

                      <button
                        onClick={(e) => onToggleSave(article.id, e)}
                        className="p-1 text-slate-400 hover:text-[#E5252A] transition-colors"
                        title="Simpan artikel"
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-3.5 h-3.5 text-amber-500 fill-current" />
                        ) : (
                          <Bookmark className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
