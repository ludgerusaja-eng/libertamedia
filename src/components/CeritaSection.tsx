import React from 'react';
import { BookOpen, PenLine, Quote, ArrowRight, Award, Sparkles } from 'lucide-react';
import { Article } from '../types';

interface CeritaSectionProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  onOpenSubmitStory: () => void;
}

export const CeritaSection: React.FC<CeritaSectionProps> = ({
  articles,
  onSelectArticle,
  onOpenSubmitStory,
}) => {
  const ceritaArticles = articles.filter(
    (a) => a.pillar === 'cerita' || ['Opini', 'Gagasan', 'Cerita Inspiratif'].includes(a.category)
  );

  return (
    <section id="cerita-section" className="mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3 mb-6 relative">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-[#E5252A]" />
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            liberta cerita & Opini Publik
          </h2>
          <span className="hidden sm:inline bg-slate-900 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider">
            Gagasan
          </span>
        </div>

        <button
          onClick={onOpenSubmitStory}
          className="flex items-center gap-1.5 text-xs font-bold text-[#E5252A] hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition-all shadow-sm"
        >
          <PenLine className="w-3.5 h-3.5" />
          <span>Tulis Opini Anda</span>
        </button>

        {/* Red underline decoration */}
        <div className="absolute -bottom-[2px] left-0 w-24 h-[2px] bg-[#E5252A]" />
      </div>

      {/* Grid of Cerita & Opini Cards */}
      {ceritaArticles.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
          <Quote className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Ruang Opini Publik & Mahasiswa Terbuka</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Jadilah kontributor pertama yang menyuarakan gagasan, riset, dan analisis untuk kemajuan bangsa di rubrik liberta cerita.
          </p>
          <button
            onClick={onOpenSubmitStory}
            className="mt-2 inline-flex items-center gap-1.5 bg-[#E5252A] hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-all"
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>Kirim Tulisan Opini Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ceritaArticles.map((article) => (
            <article
              key={article.id}
              id={`cerita-card-${article.id}`}
              onClick={() => onSelectArticle(article)}
              className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-red-300 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden"
            >
              {/* Left colored border highlight */}
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#E5252A] group-hover:w-2 transition-all" />

              <div className="pl-2 space-y-3">
                {/* Category & Badge */}
                <div className="flex items-center justify-between">
                  <span className="bg-slate-900 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded tracking-wide">
                    {article.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">{article.readTime}</span>
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#E5252A] transition-colors leading-snug">
                  {article.title}
                </h3>

                {/* Quote summary */}
                <div className="relative bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 italic leading-relaxed">
                  <Quote className="w-4 h-4 text-red-300 inline mr-1 -mt-1" />
                  "{article.summary}"
                </div>
              </div>

              {/* Author Footer */}
              <div className="pl-2 pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={article.author.avatar}
                    alt={article.author.name}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <div className="text-xs font-black text-slate-900 group-hover:text-[#E5252A] transition-colors flex items-center gap-1">
                      {article.author.name}
                      {article.category === 'Opini' && <Award className="w-3 h-3 text-amber-500" />}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                      {article.author.institution || article.author.role}
                    </div>
                  </div>
                </div>

                <span className="text-xs font-bold text-[#E5252A] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Baca <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
