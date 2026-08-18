import React from 'react';
import { Search, PenLine, Bell } from 'lucide-react';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenSubmitStory: () => void;
  onOpenBookmarks?: () => void;
  bookmarkCount?: number;
  onOpenNewsletter: () => void;
  onResetView: () => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenSubmitStory,
  onOpenNewsletter,
  onResetView,
  onOpenAdmin
}) => {
  return (
    <header id="main-site-header" className="bg-[#E5252A] text-white border-b-4 border-[#B81419] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center cursor-pointer" onClick={onResetView}>
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
              LIBERTA <span className="font-light text-red-200">MEDIA</span>
            </span>
          </div>

          {/* Search Trigger Button Only */}
          <div className="flex items-center">
            <button
              id="header-search-btn"
              onClick={onOpenSearch}
              className="flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-3.5 py-2 rounded-lg font-bold text-xs shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Cari Berita"
            >
              <Search className="w-4 h-4 text-[#E5252A]" />
              <span className="hidden sm:inline font-medium text-slate-700">Cari Berita...</span>
              <kbd className="hidden md:inline-block bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-mono">
                ⌘K
              </kbd>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
