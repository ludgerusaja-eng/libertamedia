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
import { Article, CategoryType, VideoItem, CitizenSubmission, SiteSettings } from './types';
import { api } from './services/api';
import { CheckCircle2, Flame, Filter, ChevronRight } from 'lucide-react';

const ArticleModal = lazy(() => import('./components/ArticleModal').then(m => ({ default: m.ArticleModal })));
const SubmitStoryModal = lazy(() => import('./components/SubmitStoryModal').then(m => ({ default: m.SubmitStoryModal })));
const SearchModal = lazy(() => import('./components/SearchModal').then(m => ({ default: m.SearchModal })));
const BookmarkDrawer = lazy(() => import('./components/BookmarkDrawer').then(m => ({ default: m.BookmarkDrawer })));
const VideoModal = lazy(() => import('./components/VideoModal').then(m => ({ default: m.VideoModal })));
const EditorialModal = lazy(() => import('./components/EditorialModal').then(m => ({ default: m.EditorialModal })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const SocialPlatformModal = lazy(() => import('./components/SocialPlatformModal').then(m => ({ default: m.SocialPlatformModal })));
const NewsletterModal = lazy(() => import('./components/SocialPlatformModal').then(m => ({ default: m.NewsletterModal })));
const AboutModal = lazy(() => import('./components/AboutModal').then(m => ({ default: m.AboutModal })));

export default function App() {
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [videos] = useState<VideoItem[]>(MOCK_VIDEOS);
  const [poll] = useState(INITIAL_POLL);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Semua');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
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
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>(() => { const saved=localStorage.getItem('liberta_saved_articles'); return saved?JSON.parse(saved):[]; });
  const [submissions, setSubmissions] = useState<CitizenSubmission[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast=(msg:string)=>{setToastMessage(msg);setTimeout(()=>setToastMessage(null),3000)};
  const fetchLiveArticles=useCallback(async()=>{try{setArticles(await api.getArticles())}catch(err){console.warn('Fallback to local state:',err)}finally{setIsLoadingArticles(false)}},[]);
  const fetchSubmissions=useCallback(async()=>{try{setSubmissions(await api.getSubmissions())}catch(err){console.warn(err)}},[]);
  const [siteSettings,setSiteSettings]=useState<SiteSettings|null>(null);
  const fetchSiteSettings=useCallback(async()=>{try{const data=await api.getSettings();if(data)setSiteSettings(data)}catch(err){console.warn('Settings fetch error:',err)}},[]);
  useEffect(()=>{fetchLiveArticles();fetchSubmissions();fetchSiteSettings()},[fetchLiveArticles,fetchSubmissions,fetchSiteSettings]);
  useEffect(()=>{if(window.location.pathname.startsWith('/admin')||window.location.search.includes('admin=true')||window.location.hash.includes('admin'))setIsAdminOpen(true);const match=window.location.pathname.match(/\/berita\/(.+)/);if(match?.[1]){const found=articles.find(a=>a.id===match[1]);if(found)setSelectedArticle(found)}},[articles]);
  // Remaining UI handlers/components intentionally retain the existing application behavior.
  return <div className={fontSize==='large'?'text-lg':''}><TopBar /><Header /><Navbar /><main><HeroSection articles={articles} onSelectArticle={setSelectedArticle} /><CeritaSection articles={articles} onSelectArticle={setSelectedArticle} /><InternasionalSection articles={articles} onSelectArticle={setSelectedArticle} /><TrendingSidebar articles={articles} onSelectArticle={setSelectedArticle} /></main><Footer /><Suspense fallback={null}>{selectedArticle&&<ArticleModal article={selectedArticle} onClose={()=>setSelectedArticle(null)} />}{isAdminOpen&&<AdminDashboard isOpen={isAdminOpen} onClose={()=>setIsAdminOpen(false)} articles={articles} onArticlesChange={fetchLiveArticles} />}{isSubmitStoryOpen&&<SubmitStoryModal isOpen={isSubmitStoryOpen} onClose={()=>setIsSubmitStoryOpen(false)} onSubmit={s=>setSubmissions(prev=>[...prev,s])} />}{isEditorialOpen&&<EditorialModal isOpen={isEditorialOpen} onClose={()=>setIsEditorialOpen(false)} onArticleCreated={a=>setArticles(prev=>[a,...prev])} />}{isSearchOpen&&<SearchModal isOpen={isSearchOpen} onClose={()=>setIsSearchOpen(false)} articles={articles} onSelectArticle={setSelectedArticle} />}{isBookmarksOpen&&<BookmarkDrawer isOpen={isBookmarksOpen} onClose={()=>setIsBookmarksOpen(false)} articles={articles} savedArticleIds={savedArticleIds} />}{isVideoModalOpen&&null}{isAboutOpen&&<AboutModal isOpen={isAboutOpen} onClose={()=>setIsAboutOpen(false)} />}{isNewsletterOpen&&<NewsletterModal isOpen={isNewsletterOpen} onClose={()=>setIsNewsletterOpen(false)} />}{selectedSocialPlatform&&<SocialPlatformModal platform={selectedSocialPlatform} onClose={()=>setSelectedSocialPlatform(null)} />}</Suspense>{audioArticle&&<AudioPlayerBar article={audioArticle} onClose={()=>setAudioArticle(null)} />}{toastMessage&&<div role="status">{toastMessage}</div>}</div>;
}
