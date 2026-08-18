import React, { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CeritaSection } from './components/CeritaSection';
import { InternasionalSection } from './components/InternasionalSection';
import { TrendingSidebar } from './components/TrendingSidebar';
import { VideoSection } from './components/VideoSection';
import { ArticleModal } from './components/ArticleModal';
import { SubmitStoryModal } from './components/SubmitStoryModal';
import { SearchModal } from './components/SearchModal';
import { BookmarkDrawer } from './components/BookmarkDrawer';
import { VideoModal } from './components/VideoModal';
import { SocialPlatformModal, NewsletterModal } from './components/SocialPlatformModal';
import { EditorialModal } from './components/EditorialModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/ToastContainer';\nimport { SkeletonLoader } from './components/SkeletonLoader';
import { INITIAL_ARTICLES, MOCK_VIDEOS, INITIAL_POLL } from './data/mockArticles';
import { Article, CategoryType, VideoItem, CitizenSubmission } from './types';
import { api } from './services/api';
import { Filter, ChevronRight, Flame } from 'lucide-react';
import { useLocalStorage, useToast, useFetch } from './hooks';
import { AppContext } from './context/AppContext';

export default function App() {
  // State management with custom hooks
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [videos] = useState<VideoItem[]>(MOCK_VIDEOS);
  const [poll] = useState(INITIAL_POLL);

  // Filter & Active Navigation
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Semua');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Modals & Drawers
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSubmitStoryOpen, setIsSubmitStoryOpen] = useState(false);
  const [isEditorialOpen, setIsEditorialOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const [selectedSocialPlatform, setSelectedSocialPlatform] = useState<string | null>(null);
  const [audioArticle, setAudioArticle] = useState<Article | null>(null);

  // Typography accessibility
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  // Custom hooks
  const [savedArticleIds, setSavedArticleIds] = useLocalStorage<string[]>('liberta_saved_articles', []);
  const { toasts, addToast, removeToast } = useToast();
  const { data: liveArticles, loading: isLoadingArticles, refetch: refetchArticles } = useFetch(
    () => api.getArticles(),
    []\n  );

  // Citizen submissions
  const [submissions, setSubmissions] = useState<CitizenSubmission[]>([]);

  // Fetch submissions
  const fetchSubmissions = useCallback(async () => {
    try {
      const data = await api.getSubmissions();
      setSubmissions(data);
    } catch (err) {
      console.warn('Failed to fetch submissions:', err);
      addToast('Gagal memuat submissions', 'error');
    }
  }, [addToast]);

  // Update articles when live articles are fetched
  useEffect(() => {
    if (liveArticles && liveArticles.length > 0) {
      setArticles(liveArticles);
    }
  }, [liveArticles]);

  // Initial fetch
  useEffect(() => {
    refetchArticles();
    fetchSubmissions();
  }, [refetchArticles, fetchSubmissions]);

  // Check URL query param ?admin=true or secret shortcut (⌘+Shift+A) or direct article link /berita/:id
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.location.search.includes('admin=true') || window.location.hash.includes('admin')) {
      setIsAdminOpen(true);
    }
    const match = window.location.pathname.match(/\\/berita\\/(.+)/);\n    if (match && match[1]) {
      const artId = match[1];
      const found = articles.find((a) => a.id === artId);
      if (found) setSelectedArticle(found);
    }
  }, [articles]);

  // Keyboard shortcut for search (⌘K) & Secret Admin Panel (⌘+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsSubmitStoryOpen(false);
        setIsEditorialOpen(false);
        setIsAdminOpen(false);
        setIsBookmarksOpen(false);
        setIsNewsletterOpen(false);
        setSelectedSocialPlatform(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save bookmark handler
  const handleToggleSave = (articleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (savedArticleIds.includes(articleId)) {
      updated = savedArticleIds.filter((id) => id !== articleId);
      addToast('Artikel dihapus dari daftar tersimpan', 'info');
    } else {
      updated = [...savedArticleIds, articleId];
      addToast('Artikel berhasil disimpan ke daftar bacaan!', 'success');
    }
    setSavedArticleIds(updated);
  };

  const handleRemoveBookmark = (articleId: string) => {
    const updated = savedArticleIds.filter((id) => id !== articleId);
    setSavedArticleIds(updated);
    addToast('Artikel dihapus dari simpanan', 'info');
  };

  const handleClearAllBookmarks = () => {
    setSavedArticleIds([]);
    addToast('Semua artikel tersimpan telah dibersihkan', 'success');
  };

  const handlePlayAudio = (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();
    setAudioArticle(article);
  };

  const handleCitizenSubmit = (submission: CitizenSubmission) => {
    setSubmissions([submission, ...submissions]);
    addToast('Naskah berhasil dikirim ke Dewan Redaksi!', 'success');
  };

  const handleArticleCreated = (newArt: Article) => {
    setArticles((prev) => [newArt, ...prev.filter((a) => a.id !== newArt.id)]);
    refetchArticles();
    fetchSubmissions();
    addToast('Artikel berhasil dipublikasikan ke situs!', 'success');
  };

  const handleArticleDeleted = (deletedId: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== deletedId));
    if (selectedArticle?.id === deletedId) {
      setSelectedArticle(null);
    }
    addToast('Artikel berhasil dihapus', 'success');
  };

  const handleScrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleResetView = () => {
    setSelectedCategory('Semua');
    setActiveTag(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered articles based on category or active tag
  const filteredArticles = articles.filter((art) => {
    if (activeTag) {
      return art.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase());
    }
    if (selectedCategory === 'Semua') return true;
    if (selectedCategory === 'Opini' || selectedCategory === 'Gagasan' || selectedCategory === 'Cerita Inspiratif') {
      return art.category === selectedCategory || art.pillar === 'cerita';
    }
    if (selectedCategory === 'Internasional') {
      return art.category === 'Internasional' || art.pillar === 'internasional';
    }
    return art.category === selectedCategory;
  });

  // Check standalone Admin route (/admin or /admin.html or ?admin=true)
  const isStandaloneAdminRoute = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/admin') ||
    window.location.search.includes('admin=true') ||
    window.location.hash.includes('admin')
  );

  if (isAdminOpen || isStandaloneAdminRoute) {
    return (
      <ErrorBoundary>
        <div className=\"min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans\">
          <div className=\"bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between\">
            <div className=\"flex items-center gap-3\">
              <a
                href=\"/\"
                onClick={(e) => {
                  e.preventDefault();
                  setIsAdminOpen(false);
                  window.history.pushState({}, '', '/');
                }}
                className=\"text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 border border-slate-700\"\n              >\n                ← Kembali ke Website Utama (libertamedia.com)\n              </a>\n            </div>\n            <div className=\"text-xs font-bold text-emerald-400 flex items-center gap-2\">\n              <span className=\"w-2 h-2 rounded-full bg-emerald-400 animate-pulse\" />\n              Standalone Admin Portal Active\n            </div>\n          </div>\n\n          <div className=\"flex-1 p-2 md:p-6 flex items-center justify-center\">\n            <AdminDashboard\n              isOpen={true}\n              onClose={() => {\n                setIsAdminOpen(false);\n                window.history.pushState({}, '', '/');\n              }}\n              articles={articles}\n              onArticlesChange={refetchArticles}\n            />\n          </div>\n        </div>\n      </ErrorBoundary>\n    );\n  }\n\n  return (\n    <ErrorBoundary>\n      <AppContext.Provider value={{ toasts, addToast, removeToast }}>\n        <div\n          className={`min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased flex flex-col ${\n            fontSize === 'large' ? 'text-base' : 'text-sm'\n          }`}\n        >\n          {/* Toast Notifications */}\n          <ToastContainer toasts={toasts} onRemove={removeToast} />\n\n          {/* 1. Top Bar */}\n          <TopBar\n            fontSize={fontSize}\n            setFontSize={setFontSize}\n            onOpenAdmin={() => setIsAdminOpen(true)}\n          />\n\n          {/* 2. Main Header */}\n          <Header\n            onOpenSearch={() => setIsSearchOpen(true)}\n            onOpenSubmitStory={() => setIsSubmitStoryOpen(true)}\n            onOpenBookmarks={() => setIsBookmarksOpen(true)}\n            bookmarkCount={savedArticleIds.length}\n            onOpenNewsletter={() => setIsNewsletterOpen(true)}\n            onResetView={handleResetView}\n            onOpenAdmin={() => setIsAdminOpen(true)}\n          />\n\n          {/* 3. Main Navigation */}\n          <Navbar\n            selectedCategory={selectedCategory}\n            onSelectCategory={(cat) => {\n              setSelectedCategory(cat);\n              setActiveTag(null);\n            }}\n            onScrollToSection={handleScrollToSection}\n            onOpenSocialModal={(platform) => setSelectedSocialPlatform(platform)}\n          />\n\n          {/* Main Content Body */}\n          <main className=\"flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10\">\n            {/* Loading State */}\n            {isLoadingArticles && <SkeletonLoader count={3} />}\n\n            {/* Active Tag Filter Banner */}\n            {activeTag && (\n              <div className=\"bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center justify-between\" role=\"status\" aria-live=\"polite\">\n                <div className=\"flex items-center gap-2 text-xs text-red-900\">\n                  <Filter className=\"w-4 h-4 text-[#E5252A]\" aria-hidden=\"true\" />\n                  <span>Menampilkan berita dengan topik: <strong>#{activeTag}</strong> ({filteredArticles.length} artikel)</span>\n                </div>\n                <button\n                  onClick={() => setActiveTag(null)}\n                  className=\"text-xs text-red-700 hover:text-red-900 font-bold underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1\"\n                  aria-label=\"Hapus filter topik\"\n                >\n                  Hapus Filter Topik\n                </button>\n              </div>\n            )}\n\n            {/* Hero Section (When viewing all categories or News) */}\n            {selectedCategory === 'Semua' && !activeTag && !isLoadingArticles && (\n              <HeroSection\n                articles={articles}\n                onSelectArticle={(art) => setSelectedArticle(art)}\n                savedArticleIds={savedArticleIds}\n                onToggleSave={handleToggleSave}\n                onPlayAudio={handlePlayAudio}\n                onOpenSubmitStory={() => setIsSubmitStoryOpen(true)}\n              />\n            )}\n\n            {/* Two Column Layout: Main Content (Left) + Sidebar (Right) */}\n            {!isLoadingArticles && (\n              <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-8\">\n                {/* Left Column (2 cols): Cerita, Internasional, or Filtered View */}\n                <div className=\"lg:col-span-2 space-y-10\">\n                  {/* If a specific category or tag filter is selected, show filtered stream */}\n                  {(selectedCategory !== 'Semua' || activeTag) ? (\n                    <section className=\"space-y-6\">\n                      <div className=\"flex items-center justify-between border-b-2 border-slate-200 pb-3 relative\">\n                        <div className=\"flex items-center gap-2\">\n                          <Flame className=\"w-5 h-5 text-[#E5252A]\" aria-hidden=\"true\" />\n                          <h2 className=\"text-xl font-black text-slate-900 tracking-tight\">\n                            Kanal: {activeTag ? `#${activeTag}` : selectedCategory}\n                          </h2>\n                        </div>\n                        <span className=\"text-xs text-slate-500 font-semibold\">\n                          {filteredArticles.length} Berita Ditemukan\n                        </span>\n                        <div className=\"absolute -bottom-[2px] left-0 w-20 h-[2px] bg-[#E5252A]\" aria-hidden=\"true\" />\n                      </div>\n\n                      {filteredArticles.length === 0 ? (\n                        <div className=\"bg-white rounded-xl p-8 text-center text-slate-400 border border-slate-200 space-y-3\" role=\"status\">\n                          <p className=\"text-sm font-semibold text-slate-600\">Belum ada berita pada kanal ini.</p>\n                          <div className=\"flex items-center justify-center gap-3 pt-1\">\n                            <button\n                              onClick={handleResetView}\n                              className=\"text-xs text-[#E5252A] hover:underline font-bold focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1\"\n                              aria-label=\"Lihat semua berita\"\n                            >\n                              Lihat Semua Berita\n                            </button>\n                          </div>\n                        </div>\n                      ) : (\n                        <div className=\"space-y-4\">\n                          {filteredArticles.map((art) => (\n                            <article\n                              key={art.id}\n                              onClick={() => setSelectedArticle(art)}\n                              className=\"group bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-red-300 transition-all cursor-pointer flex flex-col sm:flex-row gap-4 focus:outline-none focus:ring-2 focus:ring-blue-500\"\n                              role=\"button\"\n                              tabIndex={0}\n                              onKeyDown={(e) => {\n                                if (e.key === 'Enter' || e.key === ' ') {\n                                  e.preventDefault();\n                                  setSelectedArticle(art);\n                                }\n                              }}\n                              aria-label={`Baca artikel: ${art.title}`}\n                            >\n                              <div className=\"w-full sm:w-48 h-36 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0\">\n                                <img\n                                  src={art.image}\n                                  alt={art.title}\n                                  className=\"w-full h-full object-cover group-hover:scale-105 transition-transform duration-300\"\n                                  loading=\"lazy\"\n                                />\n                              </div>\n                              <div className=\"flex-1 space-y-2\">\n                                <div className=\"flex items-center gap-2\">\n                                  <span className=\"bg-[#E5252A] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded\">\n                                    {art.category}\n                                  </span>\n                                  <span className=\"text-xs text-slate-400\">{art.publishedAt}</span>\n                                </div>\n                                <h3 className=\"text-sm sm:text-base font-black text-slate-900 group-hover:text-[#E5252A] leading-snug\">\n                                  {art.title}\n                                </h3>\n                                <p className=\"text-xs text-slate-600 line-clamp-2 leading-relaxed\">\n                                  {art.summary}\n                                </p>\n                                <div className=\"pt-2 flex items-center justify-between text-[11px] text-slate-500\">\n                                  <span>Oleh: <strong>{art.author.name}</strong></span>\n                                  <span className=\"text-[#E5252A] font-bold flex items-center gap-1\">\n                                    Baca <ChevronRight className=\"w-3 h-3\" aria-hidden=\"true\" />\n                                  </span>\n                                </div>\n                              </div>\n                            </article>\n                          ))}\n                        </div>\n                      )}\n                    </section>\n                  ) : (\n                    <>\n                      {/* 1. Cerita Pilihan & Opini Section */}\n                      <CeritaSection\n                        articles={articles}\n                        onSelectArticle={(art) => setSelectedArticle(art)}\n                        onOpenSubmitStory={() => setIsSubmitStoryOpen(true)}\n                      />\n\n                      {/* 2. Kabar Internasional Section */}\n                      <InternasionalSection\n                        articles={articles}\n                        onSelectArticle={(art) => setSelectedArticle(art)}\n                      />\n                    </>\n                  )}\n                </div>\n\n                {/* Right Column (1 col): Trending, Poll, Social, Tag Cloud */}\n                <div className=\"lg:col-span-1\">\n                  <TrendingSidebar\n                    articles={articles}\n                    poll={poll}\n                    onSelectArticle={(art) => setSelectedArticle(art)}\n                    onSelectTag={(tag) => setActiveTag(tag)}\n                    onOpenSocialModal={(platform) => setSelectedSocialPlatform(platform)}\n                    onOpenSubmitStory={() => setIsSubmitStoryOpen(true)}\n                  />\n                </div>\n              </div>\n            )}\n          </main>\n\n          {/* Footer */}\n          <Footer\n            onSelectCategory={(cat) => {\n              setSelectedCategory(cat);\n              window.scrollTo({ top: 0, behavior: 'smooth' });\n            }}\n            onOpenSubmitStory={() => setIsSubmitStoryOpen(true)}\n            onOpenSocialModal={(platform) => setSelectedSocialPlatform(platform)}\n          />\n\n          {/* Floating Audio Player */}\n          <AudioPlayerBar\n            article={audioArticle}\n            onClose={() => setAudioArticle(null)}\n          />\n\n          {/* Full Article Modal / Reader View */}\n          <ArticleModal\n            article={selectedArticle}\n            onClose={() => setSelectedArticle(null)}\n            onSelectArticle={(art) => setSelectedArticle(art)}\n            allArticles={articles}\n            savedArticleIds={savedArticleIds}\n            onToggleSave={handleToggleSave}\n            fontSize={fontSize}\n          />\n\n          {/* Editorial & CMS Modal */}\n          <EditorialModal\n            isOpen={isEditorialOpen}\n            onClose={() => setIsEditorialOpen(false)}\n            onArticleCreated={handleArticleCreated}\n            onArticleDeleted={handleArticleDeleted}\n            publishedArticles={articles}\n            onOpenArticle={(art) => setSelectedArticle(art)}\n            onRefreshArticles={refetchArticles}\n          />\n\n          {/* Submit Story Modal */}\n          <SubmitStoryModal\n            isOpen={isSubmitStoryOpen}\n            onClose={() => setIsSubmitStoryOpen(false)}\n            onSubmit={handleCitizenSubmit}\n          />\n\n          {/* Search Modal */}\n          <SearchModal\n            isOpen={isSearchOpen}\n            onClose={() => setIsSearchOpen(false)}\n            articles={articles}\n            onSelectArticle={(art) => setSelectedArticle(art)}\n          />\n\n          {/* Bookmark Drawer */}\n          <BookmarkDrawer\n            isOpen={isBookmarksOpen}\n            onClose={() => setIsBookmarksOpen(false)}\n            savedArticleIds={savedArticleIds}\n            allArticles={articles}\n            onSelectArticle={(art) => setSelectedArticle(art)}\n            onRemoveBookmark={handleRemoveBookmark}\n            onClearAllBookmarks={handleClearAllBookmarks}\n          />\n\n          {/* Video Modal */}\n          <VideoModal\n            video={selectedVideo}\n            onClose={() => setSelectedVideo(null)}\n            allVideos={videos}\n            onSelectOtherVideo={(v) => setSelectedVideo(v)}\n          />\n\n          {/* Social Platform Modal */}\n          <SocialPlatformModal\n            platform={selectedSocialPlatform}\n            onClose={() => setSelectedSocialPlatform(null)}\n          />\n\n          {/* Newsletter Modal */}\n          <NewsletterModal\n            isOpen={isNewsletterOpen}\n            onClose={() => setIsNewsletterOpen(false)}\n          />\n        </div>\n      </AppContext.Provider>\n    </ErrorBoundary>\n  );\n}
