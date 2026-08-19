import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { TopBar } from './components/TopBar';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CeritaSection } from './components/CeritaSection';
import { InternasionalSection } from './components/InternasionalSection';
import { TrendingSidebar } from './components/TrendingSidebar';
import { Footer } from './components/Footer';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { INITIAL_ARTICLES, MOCK_VIDEOS, INITIAL_POLL } from './data/mockArticles';
import { Article, VideoItem, CitizenSubmission, SiteSettings } from './types';
import { api } from './services/api';

const ArticleModal = lazy(() => import('./components/ArticleModal').then(m => ({ default: m.ArticleModal })));
const SubmitStoryModal = lazy(() => import('./components/SubmitStoryModal').then(m => ({ default: m.SubmitStoryModal })));
const SearchModal = lazy(() => import('./components/SearchModal').then(m => ({ default: m.SearchModal })));
const BookmarkDrawer = lazy(() => import('./components/BookmarkDrawer').then(m => ({ default: m.BookmarkDrawer })));
const EditorialModal = lazy(() => import('./components/EditorialModal').then(m => ({ default: m.EditorialModal })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const SocialPlatformModal = lazy(() => import('./components/SocialPlatformModal').then(m => ({ default: m.SocialPlatformModal })));
const NewsletterModal = lazy(() => import('./components/SocialPlatformModal').then(m => ({ default: m.NewsletterModal })));
const AboutModal = lazy(() => import('./components/AboutModal').then(m => ({ default: m.AboutModal })));

export default function App() {
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [videos] = useState<VideoItem[]>(MOCK_VIDEOS);
  const [poll] = useState(INITIAL_POLL);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSubmitStoryOpen, setIsSubmitStoryOpen] = useState(false);
  const [isEditorialOpen, setIsEditorialOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const [selectedSocialPlatform, setSelectedSocialPlatform] = useState<string | null>(null);
  const [audioArticle, setAudioArticle] = useState<Article | null>(null);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>(() => {
    try { const saved = localStorage.getItem('liberta_saved_articles'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [submissions, setSubmissions] = useState<CitizenSubmission[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  void videos; void poll;

  const fetchLiveArticles = useCallback(async () => { try { setArticles(await api.getArticles()); } catch (err) { console.warn('Fallback to local state:', err); } }, []);
  const fetchSubmissions = useCallback(async () => { try { setSubmissions(await api.getSubmissions()); } catch (err) { console.warn(err); } }, []);
  const fetchSiteSettings = useCallback(async () => { try { const data = await api.getSettings(); if (data) setSiteSettings(data); } catch (err) { console.warn('Settings fetch error:', err); } }, []);

  useEffect(() => { fetchLiveArticles(); fetchSubmissions(); fetchSiteSettings(); }, [fetchLiveArticles, fetchSubmissions, fetchSiteSettings]);
  useEffect(() => {
    if (window.location.pathname.startsWith('/admin') || window.location.search.includes('admin=true') || window.location.hash.includes('admin')) setIsAdminOpen(true);
    const match = window.location.pathname.match(/\/berita\/(.+)/);
    if (match?.[1]) {
      const key = decodeURIComponent(match[1]);
      const found = articles.find(a => a.id === key || a.slug === key);
      if (found) setSelectedArticle(found);
    }
  }, [articles]);
  useEffect(() => { localStorage.setItem('liberta_saved_articles', JSON.stringify(savedArticleIds)); }, [savedArticleIds]);

  const toggleSave = (articleId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSavedArticleIds(prev => prev.includes(articleId) ? prev.filter(id => id !== articleId) : [...prev, articleId]);
  };
  const selectArticle = (article: Article) => setSelectedArticle(article);

  return <div className={fontSize === 'large' ? 'text-lg' : ''}>
    <TopBar /><Header /><Navbar />
    <main>
      <HeroSection articles={articles} onSelectArticle={selectArticle} />
      <CeritaSection articles={articles} onSelectArticle={selectArticle} />
      <InternasionalSection articles={articles} onSelectArticle={selectArticle} />
      <TrendingSidebar articles={articles} onSelectArticle={selectArticle} />
    </main>
    <Footer />
    <Suspense fallback={null}>
      {selectedArticle && <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} onSelectArticle={selectArticle} allArticles={articles} savedArticleIds={savedArticleIds} onToggleSave={toggleSave} fontSize={fontSize} />}
      {isAdminOpen && <AdminDashboard isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} articles={articles} onArticlesChange={fetchLiveArticles} />}
      {isSubmitStoryOpen && <SubmitStoryModal isOpen={isSubmitStoryOpen} onClose={() => setIsSubmitStoryOpen(false)} onSubmit={s => setSubmissions(prev => [s, ...prev])} />}
      {isEditorialOpen && <EditorialModal isOpen={isEditorialOpen} onClose={() => setIsEditorialOpen(false)} onArticleCreated={a => setArticles(prev => [a, ...prev])} />}
      {isSearchOpen && <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} articles={articles} onSelectArticle={selectArticle} />}
      {isBookmarksOpen && <BookmarkDrawer isOpen={isBookmarksOpen} onClose={() => setIsBookmarksOpen(false)} articles={articles} savedArticleIds={savedArticleIds} />}
      {isAboutOpen && <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />}
      {isNewsletterOpen && <NewsletterModal isOpen={isNewsletterOpen} onClose={() => setIsNewsletterOpen(false)} />}
      {selectedSocialPlatform && <SocialPlatformModal platform={selectedSocialPlatform} onClose={() => setSelectedSocialPlatform(null)} />}
    </Suspense>
    {audioArticle && <AudioPlayerBar article={audioArticle} onClose={() => setAudioArticle(null)} />}
  </div>;
}
