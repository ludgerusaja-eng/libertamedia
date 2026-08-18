export type CategoryType = 
  | 'Semua'
  | 'Pemerintahan'
  | 'Politik'
  | 'Mahasiswa'
  | 'Sosial Budaya'
  | 'Ekonomi'
  | 'Olahraga & Seni'
  | 'Organisasi & Komunitas'
  | 'Opini'
  | 'Gagasan'
  | 'Cerita Inspiratif'
  | 'Internasional'
  | 'Teknologi';

export interface CommentItem {
  id: string;
  author: string;
  avatar: string;
  date: string;
  content: string;
  likes: number;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string[];
  category: CategoryType;
  subcategory?: string;
  pillar: 'news' | 'cerita' | 'internasional';
  author: {
    name: string;
    role: string;
    avatar: string;
    institution?: string;
  };
  publishedAt: string;
  readTime: string;
  views: number;
  image: string;
  caption?: string;
  tags: string[];
  isEditorChoice?: boolean;
  isHero?: boolean;
  isTrending?: boolean;
  trendingRank?: number;
  audioDuration?: string;
  reactions: {
    claps: number;
    insightful: number;
    inspiring: number;
    critical: number;
  };
  aiSummary: string[];
  comments: CommentItem[];
}

export interface VideoItem {
  id: string;
  title: string;
  category: string;
  duration: string;
  views: string;
  publishedAt: string;
  thumbnail: string;
  videoEmbedUrl: string;
  description: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollData {
  id: string;
  question: string;
  topic: string;
  endDate: string;
  options: PollOption[];
}

export interface CitizenSubmission {
  id: string;
  title: string;
  category: string;
  authorName: string;
  email: string;
  institution: string;
  abstract: string;
  content: string;
  submittedAt: string;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  description: string;
  defaultOgImage: string;
  copyrightText: string;
  socialLinks: {
    instagram: string;
    twitter: string;
    youtube: string;
    tiktok: string;
    facebook: string;
  };
  sectionToggles: {
    breakingNews: boolean;
    heroSlider: boolean;
    editorsPicks: boolean;
    citizenVoice: boolean;
    multimedia: boolean;
    newsletter: boolean;
  };
  cardDisplayStyle: 'grid' | 'list';
  customCategories: string[];
  adSlots: {
    headerBanner: string;
    inArticleBanner: string;
    mobileStickyBottom: string;
  };
  analyticsScripts: {
    ga4Id: string;
    searchConsoleTag: string;
    facebookPixel: string;
    customHeadScript: string;
  };
}

export interface StaticPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

