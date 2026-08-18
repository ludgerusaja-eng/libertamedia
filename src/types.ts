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
  | 'Internasional';

export interface Author {
  name: string;
  avatar: string;
  role?: string;
  organization?: string;
  email?: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: CategoryType;
  pillar?: 'BERITA' | 'OPINI' | 'CERITA' | 'GAGASAN';
  imageUrl: string;
  imageCaption?: string;
  author: Author;
  publishedAt: string;
  readTime: string;
  isHeroHeadline?: boolean;
  isEditorsPick?: boolean;
  isTrending?: boolean;
  views?: number;
  tags?: string[];
  commentsCount?: number;
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  audioUrl?: string;
}

export interface Comment {
  id: string;
  articleId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface VideoItem {
  id: string;
  title: string;
  youtubeId: string;
  category: CategoryType;
  duration: string;
  publishedAt: string;
  views: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
}

export interface CitizenSubmission {
  id: string;
  authorName: string;
  authorEmail: string;
  authorRole?: string;
  authorOrg?: string;
  title: string;
  category: CategoryType;
  content: string;
  submittedAt: string;
}

export type Submission = CitizenSubmission;

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  footerText: string;
  logoUrl?: string;
  
  socialLinks: {
    instagram: string;
    twitter: string;
    youtube: string;
    facebook: string;
  };

  sections: {
    showBreakingNews: boolean;
    showHeroSlider: boolean;
    showEditorChoice: boolean;
    showCitizenVoice: boolean;
    showNewsletter: boolean;
  };

  monetization: {
    headerBannerHtml: string;
    inArticleAdHtml: string;
    googleAnalyticsId: string;
  };
}

export interface StaticPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}
