import React, { useState, useEffect } from 'react';
import { Zap, ChevronRight } from 'lucide-react';
import { Article } from '../types';

interface BreakingTickerProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
}

export const BreakingTicker: React.FC<BreakingTickerProps> = ({ articles, onSelectArticle }) => {
  const breakingItems = articles.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (breakingItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % breakingItems.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [breakingItems.length]);

  if (breakingItems.length === 0) return null;

  const currentArticle = breakingItems[currentIndex];

  return (
    <div id="breaking-ticker-bar" className="bg-slate-900 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3 overflow-hidden">
        {/* Badge Flash */}
        <div className="flex-shrink-0 flex items-center gap-1 bg-[#E5252A] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded shadow-sm tracking-wider animate-pulse">
          <Zap className="w-3 h-3 fill-current text-amber-300" />
          <span>Fokus Terkini</span>
        </div>

        {/* Ticker Headline */}
        <div 
          onClick={() => onSelectArticle(currentArticle)}
          className="flex-1 flex items-center justify-between gap-3 text-xs sm:text-sm text-slate-200 hover:text-white cursor-pointer group transition-all truncate"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-[10px] font-bold text-red-400 uppercase bg-slate-800 px-2 py-0.5 rounded hidden sm:inline">
              {currentArticle.category}
            </span>
            <span className="font-semibold group-hover:text-red-400 transition-colors truncate">
              {currentArticle.title}
            </span>
          </div>

          <div className="flex-shrink-0 flex items-center text-[11px] text-slate-400 group-hover:text-red-300">
            <span className="hidden md:inline mr-1">Baca Selengkapnya</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Dots indicator */}
        <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
          {breakingItems.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === currentIndex ? 'bg-red-500 w-3' : 'bg-slate-700 hover:bg-slate-500'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
