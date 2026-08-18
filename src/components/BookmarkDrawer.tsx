import React from 'react';
import { X, Bookmark, Trash2, ArrowRight, BookOpen } from 'lucide-react';
import { Article } from '../types';

interface BookmarkDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedArticleIds: string[];
  allArticles: Article[];
  onSelectArticle: (article: Article) => void;
  onRemoveBookmark: (id: string) => void;
  onClearAllBookmarks: () => void;
}

export const BookmarkDrawer: React.FC<BookmarkDrawerProps> = ({
  isOpen,
  onClose,
  savedArticleIds,
  allArticles,
  onSelectArticle,
  onRemoveBookmark,
  onClearAllBookmarks,
}) => {
  if (!isOpen) return null;

  const savedArticles = allArticles.filter((a) => savedArticleIds.includes(a.id));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-4 bg-[#E5252A] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-300 fill-amber-300" />
              <div>
                <h3 className="text-base font-black tracking-tight">Artikel Tersimpan</h3>
                <p className="text-xs text-red-100">{savedArticles.length} artikel siap dibaca</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
            {savedArticles.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">Belum Ada Artikel Tersimpan</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Klik ikon bookmark pada artikel apa pun untuk menyimpannya ke daftar bacaan Anda.
                </p>
              </div>
            ) : (
              savedArticles.map((art) => (
                <div key={art.id} className="py-3.5 space-y-2 group">
                  <div className="flex items-center justify-between">
                    <span className="bg-[#E5252A] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">
                      {art.category}
                    </span>
                    <button
                      onClick={() => onRemoveBookmark(art.id)}
                      className="text-slate-400 hover:text-red-600 text-xs flex items-center gap-1 transition-colors"
                      title="Hapus dari daftar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Hapus</span>
                    </button>
                  </div>

                  <h4 
                    onClick={() => {
                      onSelectArticle(art);
                      onClose();
                    }}
                    className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#E5252A] cursor-pointer transition-colors leading-snug line-clamp-2"
                  >
                    {art.title}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{art.readTime}</span>
                    <button
                      onClick={() => {
                        onSelectArticle(art);
                        onClose();
                      }}
                      className="font-bold text-[#E5252A] flex items-center gap-1 hover:underline"
                    >
                      Baca Sekarang <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          {savedArticles.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={onClearAllBookmarks}
                className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Semua</span>
              </button>
              <button
                onClick={onClose}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg"
              >
                Tutup
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
