import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, ChevronRight, Tag, BookOpen } from 'lucide-react';
import { Article } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  onSelectArticle: (article: Article) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  articles,
  onSelectArticle,
}) => {
  const [query, setQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('Semua');
  const inputRef = useRef<HTMLInputElement>(null);

  const quickKeywords = ['Indonesia Emas', 'Mahasiswa', 'Digitalisasi', 'UMKM', 'Opini', 'AI', 'Transisi Energi'];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setSelectedFilterCategory('Semua');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredArticles = articles.filter((article) => {
    const matchesCategory = selectedFilterCategory === 'Semua' || article.category === selectedFilterCategory || article.pillar === selectedFilterCategory;
    
    if (!query.trim()) return matchesCategory;

    const lowerQuery = query.toLowerCase();
    const matchesTitle = article.title.toLowerCase().includes(lowerQuery);
    const matchesSummary = article.summary.toLowerCase().includes(lowerQuery);
    const matchesAuthor = article.author.name.toLowerCase().includes(lowerQuery);
    const matchesTags = article.tags.some((t) => t.toLowerCase().includes(lowerQuery));

    return matchesCategory && (matchesTitle || matchesSummary || matchesAuthor || matchesTags);
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center items-start pt-12 sm:pt-20 p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[85vh] flex flex-col">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#E5252A] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari berita, opini, tokoh, isu nasional..."
            className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-slate-700 p-1"
            >
              Bersihkan
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Keyword Suggestions & Category Pills */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 flex-shrink-0">Tren:</span>
          {quickKeywords.map((kw) => (
            <button
              key={kw}
              onClick={() => setQuery(kw)}
              className="bg-slate-100 hover:bg-red-50 hover:text-[#E5252A] text-slate-600 px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex-shrink-0"
            >
              {kw}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
          <div className="flex items-center justify-between pb-2 text-xs text-slate-400 font-semibold">
            <span>Hasil Pencarian ({filteredArticles.length})</span>
            {query && <span>Kata kunci: "{query}"</span>}
          </div>

          {filteredArticles.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Tidak ada berita yang sesuai</p>
              <p className="text-xs text-slate-400">Coba kata kunci lain atau pilih dari topik populer di atas.</p>
            </div>
          ) : (
            filteredArticles.map((art) => (
              <div
                key={art.id}
                onClick={() => {
                  onSelectArticle(art);
                  onClose();
                }}
                className="py-3 group cursor-pointer hover:bg-slate-50 rounded-lg p-2 transition-all flex items-start gap-3"
              >
                <img
                  src={art.image}
                  alt={art.title}
                  className="w-16 h-14 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#E5252A] text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded">
                      {art.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{art.publishedAt}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#E5252A] transition-colors leading-snug line-clamp-1">
                    {art.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {art.summary}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#E5252A] group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-3" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-400">
          Tekan <kbd className="font-mono bg-white border border-slate-200 px-1 rounded">ESC</kbd> untuk menutup
        </div>

      </div>
    </div>
  );
};
