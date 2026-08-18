import React from 'react';
import { Globe, Clock, ArrowRight } from 'lucide-react';
import { Article } from '../types';

interface InternasionalSectionProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
}

export const InternasionalSection: React.FC<InternasionalSectionProps> = ({
  articles,
  onSelectArticle,
}) => {
  const intlArticles = articles.filter(
    (a) => a.pillar === 'internasional' || a.category === 'Internasional' || a.tags.includes('Internasional')
  );

  return (
    <section id="internasional-section" className="mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3 mb-6 relative">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#E5252A]" />
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kabar Internasional & Geopolitik
          </h2>
        </div>
        <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
          Dunia & Diplomasi Global
        </span>
        {/* Red underline decoration */}
        <div className="absolute -bottom-[2px] left-0 w-24 h-[2px] bg-[#E5252A]" />
      </div>

      {/* 3 Column Grid */}
      {intlArticles.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2">
          <Globe className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Kanal Internasional Siap Mengudara</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Liputan diplomasi, kabar dunia, dan analisis geopolitik akan diterbitkan melalui Ruang Redaksi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {intlArticles.map((article) => (
            <article
              key={article.id}
              id={`intl-card-${article.id}`}
              onClick={() => onSelectArticle(article)}
              className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-red-200 transition-all cursor-pointer flex flex-col justify-between"
            >
              {/* Image Thumbnail */}
              <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <span className="absolute top-2.5 left-2.5 bg-[#E5252A] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                  {article.subcategory || 'Global'}
                </span>
              </div>

              {/* Body */}
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#E5252A] transition-colors leading-snug line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                    {article.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {article.publishedAt}
                  </span>
                  <span className="text-[#E5252A] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Baca <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
