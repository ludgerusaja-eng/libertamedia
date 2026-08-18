import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowLeft,
  Clock, 
  Eye, 
  Bookmark, 
  BookmarkCheck, 
  Share2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ThumbsUp, 
  Lightbulb, 
  Heart, 
  AlertCircle, 
  MessageSquare, 
  Send, 
  Check, 
  Copy,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { Article, CommentItem } from '../types';
import { api } from '../services/api';

interface ArticleModalProps {
  article: Article | null;
  onClose: () => void;
  onSelectArticle: (article: Article) => void;
  allArticles: Article[];
  savedArticleIds: string[];
  onToggleSave: (articleId: string, e: React.MouseEvent) => void;
  fontSize: 'normal' | 'large';
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  onClose,
  onSelectArticle,
  allArticles,
  savedArticleIds,
  onToggleSave,
  fontSize: initialFontSize
}) => {
  const [localFontSize, setLocalFontSize] = useState<'normal' | 'large' | 'xl'>(initialFontSize);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // Local reaction counters
  const [reactions, setReactions] = useState({
    claps: 0,
    insightful: 0,
    inspiring: 0,
    critical: 0
  });
  const [userReactions, setUserReactions] = useState<{ [key: string]: boolean }>({});

  // Local comments
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSuccess, setCommentSuccess] = useState(false);

  useEffect(() => {
    if (article) {
      setReactions(article.reactions || { claps: 120, insightful: 80, inspiring: 45, critical: 10 });
      setComments(article.comments || []);
      setIsPlayingAudio(false);
      setCommentSuccess(false);
      setUserReactions({});
      setReadingProgress(0);

      // Dynamic SEO Title & Meta update for Reader View
      const originalTitle = document.title;
      document.title = `${article.title} - libertamedia.com`;

      // Inject Schema.org/NewsArticle JSON-LD for rich snippets
      const scriptId = 'article-jsonld-schema';
      let existingScript = document.getElementById(scriptId);
      if (!existingScript) {
        existingScript = document.createElement('script');
        existingScript.id = scriptId;
        existingScript.setAttribute('type', 'application/ld+json');
        document.head.appendChild(existingScript);
      }

      const newsArticleSchema = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        'headline': article.title,
        'description': article.summary,
        'image': [article.image],
        'datePublished': '2026-08-17T08:00:00+07:00',
        'dateModified': '2026-08-17T09:30:00+07:00',
        'author': [{
          '@type': 'Person',
          'name': article.author.name,
          'jobTitle': article.author.role,
          'url': 'https://libertamedia.com/redaksi'
        }],
        'publisher': {
          '@type': 'NewsMediaOrganization',
          'name': 'libertamedia',
          'url': 'https://libertamedia.com',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80'
          }
        },
        'articleSection': article.category,
        'keywords': article.tags.join(', ')
      };

      existingScript.textContent = JSON.stringify(newsArticleSchema);

      return () => {
        document.title = originalTitle;
        const s = document.getElementById(scriptId);
        if (s) s.remove();
      };
    }
  }, [article]);

  // Handle scroll progress
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - clientHeight > 0) {
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setReadingProgress(progress);
    }
  };

  if (!article) return null;

  const isSaved = savedArticleIds.includes(article.id);
  const relatedArticles = allArticles.filter((a) => a.id !== article.id && (a.category === article.category || a.pillar === article.pillar)).slice(0, 3);

  const handleReaction = (type: 'claps' | 'insightful' | 'inspiring' | 'critical') => {
    const isCurrentlyActive = !!userReactions[type];
    const delta = isCurrentlyActive ? -1 : 1;

    setReactions((prev) => ({ ...prev, [type]: Math.max(0, prev[type] + delta) }));
    setUserReactions((prev) => ({ ...prev, [type]: !isCurrentlyActive }));

    api.sendReaction(article.id, type, delta as 1 | -1);
  };

  const handleCopyLink = () => {
    const articleUrl = `${window.location.origin}/berita/${article.slug || article.id}`;
    navigator.clipboard.writeText(articleUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getShareUrl = () => {
    return `${window.location.origin}/berita/${article.slug || article.id}`;
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`*${article.title}*\n\n${article.summary || ''}\n\nBaca selengkapnya di libertamedia.com:\n${getShareUrl()}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`"${article.title}" via @libertamedia`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(getShareUrl())}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(`*${article.title}*\n${article.summary || ''}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${text}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary || article.title,
          url: getShareUrl(),
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const author = commentName.trim() || 'Pembaca Liberta';
    const content = commentText.trim();

    const newComment: CommentItem = {
      id: `c-user-${Date.now()}`,
      author,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
      date: 'Baru saja',
      content,
      likes: 0
    };

    setComments([newComment, ...comments]);
    setCommentText('');
    setCommentName('');
    setCommentSuccess(true);
    setTimeout(() => setCommentSuccess(false), 4000);

    try {
      await api.addComment(article.id, author, content);
    } catch (err) {
      console.warn('Comment persist error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 p-0 sm:p-4 md:p-6 bg-white sm:bg-slate-950/80 backdrop-blur-sm flex justify-center animate-in fade-in duration-200">
      
      {/* Modal Container — Full Screen 100vw/100vh on Mobile, Rounded Card on Desktop */}
      <div 
        onScroll={handleScroll}
        className="bg-white text-slate-900 rounded-none sm:rounded-2xl w-full max-w-4xl shadow-2xl border-0 sm:border border-slate-200 h-full sm:h-auto sm:max-h-[92vh] flex flex-col relative overflow-y-auto overscroll-contain"
      >
        {/* Top Reading Progress Bar */}
        <div className="sticky top-0 left-0 right-0 h-1 bg-slate-100 z-30">
          <div 
            className="h-full bg-[#E5252A] transition-all duration-150"
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        {/* Modal Sticky Header Bar */}
        <div className="sticky top-1 bg-white/95 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200 flex items-center justify-between z-20">
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Thumb-friendly Mobile Back Arrow / Desktop Close Icon */}
            <button 
              onClick={onClose}
              className="p-1.5 -ml-1 mr-1 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors flex items-center justify-center min-h-[40px] min-w-[40px] active:scale-95"
              aria-label="Tutup Artikel"
            >
              <ArrowLeft className="w-5 h-5 sm:hidden text-slate-800" />
              <X className="w-5 h-5 hidden sm:inline" />
            </button>

            <span className="bg-[#E5252A] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
              {article.category}
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              {article.readTime}
            </span>
          </div>

          {/* Action Tools (Font size, Audio, Bookmark, Share, Close) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Font Size Adjuster */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setLocalFontSize('normal')}
                className={`px-2 py-1 rounded transition-colors ${
                  localFontSize === 'normal' ? 'bg-white font-bold text-red-600 shadow-sm' : 'text-slate-500'
                }`}
                title="Ukuran Normal"
              >
                A
              </button>
              <button
                onClick={() => setLocalFontSize('large')}
                className={`px-2 py-1 rounded transition-colors ${
                  localFontSize === 'large' ? 'bg-white font-bold text-red-600 shadow-sm' : 'text-slate-500'
                }`}
                title="Ukuran Besar"
              >
                A+
              </button>
              <button
                onClick={() => setLocalFontSize('xl')}
                className={`px-2 py-1 rounded transition-colors ${
                  localFontSize === 'xl' ? 'bg-white font-bold text-red-600 shadow-sm' : 'text-slate-500'
                }`}
                title="Ukuran Ekstra Besar"
              >
                A++
              </button>
            </div>

            {/* Audio Speech Simulation Button */}
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                isPlayingAudio 
                  ? 'bg-red-50 text-[#E5252A] border-red-300 ring-2 ring-red-200' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Putar Narasi Audio"
            >
              {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isPlayingAudio ? 'Jeda Audio' : 'Dengar'}</span>
            </button>

            {/* Bookmark Button */}
            <button
              onClick={(e) => onToggleSave(article.id, e)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isSaved
                  ? 'bg-amber-50 text-amber-600 border-amber-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={isSaved ? 'Hapus dari simpanan' : 'Simpan artikel ini'}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4 text-amber-600 fill-amber-500" /> : <Bookmark className="w-4 h-4" />}
            </button>

            {/* Share link button */}
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
              title="Salin tautan"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 hover:text-[#E5252A] text-slate-600 transition-all ml-1"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Audio Player Bar if active */}
        {isPlayingAudio && (
          <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-1 h-3 bg-red-500 animate-pulse"></span>
                <span className="w-1 h-5 bg-red-400 animate-pulse delay-75"></span>
                <span className="w-1 h-4 bg-red-500 animate-pulse delay-150"></span>
                <span className="w-1 h-6 bg-red-300 animate-pulse delay-100"></span>
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-200">Narasi Audio Liberta Media</p>
                <p className="text-[10px] text-slate-400">Sedang memutar pembacaan teks artikel...</p>
              </div>
            </div>
            <button
              onClick={() => setIsPlayingAudio(false)}
              className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1 rounded font-semibold text-white"
            >
              Hentikan
            </button>
          </div>
        )}

        {/* Article Content Container */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6 flex-1">
          
          {/* Article Header & Headline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
              <span className="font-bold text-red-600">{article.pillar.toUpperCase()}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Diterbitkan: {article.publishedAt}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                {article.views.toLocaleString('id-ID')} Pembaca
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight leading-tight">
              {article.title}
            </h1>

            {/* Author Profile Bar */}
            <div className="flex items-center justify-between py-3 border-y border-slate-200 gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-[#E5252A]"
                />
                <div>
                  <div className="font-black text-slate-900 text-sm">{article.author.name}</div>
                  <div className="text-xs text-slate-500">
                    {article.author.role} {article.author.institution && `• ${article.author.institution}`}
                  </div>
                </div>
              </div>

              {/* Complete Universal Social Share Toolbar */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-400 font-semibold mr-1 hidden sm:inline">Bagikan:</span>
                <button
                  onClick={handleShareWhatsApp}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  title="Bagikan ke WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={handleShareFacebook}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  title="Bagikan ke Facebook"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Facebook</span>
                </button>
                <button
                  onClick={handleShareTwitter}
                  className="bg-slate-900 hover:bg-black text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  title="Bagikan ke X (Twitter)"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">X</span>
                </button>
                <button
                  onClick={handleShareTelegram}
                  className="bg-sky-500 hover:bg-sky-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  title="Bagikan ke Telegram"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Telegram</span>
                </button>
                <button
                  onClick={handleShareLinkedIn}
                  className="bg-blue-800 hover:bg-blue-900 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  title="Bagikan ke LinkedIn"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">LinkedIn</span>
                </button>
                <button
                  onClick={handleNativeShare}
                  className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  title="Bagikan ke Aplikasi Lain"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lainnya</span>
                </button>
              </div>
            </div>
          </div>

          {/* Featured Article Image */}
          <div className="space-y-2">
            <div className="rounded-xl overflow-hidden bg-slate-100 shadow max-h-[460px]">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
            {article.caption && (
              <p className="text-xs text-slate-500 italic text-center px-4">
                Foto: {article.caption}
              </p>
            )}
          </div>

          {/* AI 3-Point Summary Box */}
          {article.aiSummary && article.aiSummary.length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-amber-50 rounded-xl p-4 sm:p-5 border border-red-200/80 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#E5252A]">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Ringkasan Cepat AI Liberta (3 Poin Kunci)</span>
              </div>
              <ul className="space-y-1.5 pl-1">
                {article.aiSummary.map((item, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-slate-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E5252A] mt-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Article Main Text (Styled with proper typography scale) */}
          <div className={`space-y-5 text-slate-800 leading-relaxed font-serif ${
            localFontSize === 'large' ? 'text-lg sm:text-xl leading-loose' :
            localFontSize === 'xl' ? 'text-xl sm:text-2xl leading-loose' :
            'text-base sm:text-lg'
          }`}>
            {article.content.map((paragraph, index) => (
              <p key={index} className="tracking-normal">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Tags */}
          <div className="pt-4 border-t border-slate-200 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500">Topik Terkait:</span>
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium border border-slate-200 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Interactive Reader Reactions (Claps, Insightful, Inspiring, Critical) */}
          <div className="bg-slate-50 rounded-xl p-4 sm:p-6 border border-slate-200 text-center space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Bagaimana tanggapan Anda terhadap artikel ini?
            </p>
            <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
              
              {/* Clap */}
              <button
                onClick={() => handleReaction('claps')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  userReactions['claps']
                    ? 'bg-red-100 text-[#E5252A] border-red-300 shadow-sm scale-105'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <ThumbsUp className="w-4 h-4 text-red-500" />
                <span>Setuju ({reactions.claps})</span>
              </button>

              {/* Insightful */}
              <button
                onClick={() => handleReaction('insightful')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  userReactions['insightful']
                    ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-sm scale-105'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Berwawasan ({reactions.insightful})</span>
              </button>

              {/* Inspiring */}
              <button
                onClick={() => handleReaction('inspiring')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  userReactions['inspiring']
                    ? 'bg-pink-100 text-pink-700 border-pink-300 shadow-sm scale-105'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Heart className="w-4 h-4 text-pink-500" />
                <span>Inspiratif ({reactions.inspiring})</span>
              </button>

              {/* Critical */}
              <button
                onClick={() => handleReaction('critical')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  userReactions['critical']
                    ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm scale-105'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <AlertCircle className="w-4 h-4 text-blue-500" />
                <span>Kritis ({reactions.critical})</span>
              </button>

            </div>
          </div>

          {/* Comments Section */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#E5252A]" />
                <span>Diskusi & Komentar Pembaca ({comments.length})</span>
              </h3>
              <span className="text-xs text-slate-400">Jaga etika & dialog sehat</span>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nama Lengkap / Instansi"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <textarea
                placeholder="Tuliskan tanggapan atau analisis kritis Anda terhadap artikel ini..."
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full text-xs p-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              <div className="flex items-center justify-between">
                {commentSuccess ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Komentar Anda telah diterbitkan!
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Komentar dimoderasi sesuai Pedoman Media Siber
                  </span>
                )}
                <button
                  type="submit"
                  className="bg-[#E5252A] hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Tanggapan</span>
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">
                  Belum ada komentar. Jadilah yang pertama memberikan pandangan!
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={c.avatar} alt={c.author} className="w-7 h-7 rounded-full object-cover" />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{c.author}</div>
                          <div className="text-[10px] text-slate-400">{c.date}</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed pl-9">
                      {c.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Related Articles Carousel / Grid */}
          {relatedArticles.length > 0 && (
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#E5252A]" />
                  <span>Artikel Terkait Lainnya</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {relatedArticles.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => {
                      onSelectArticle(rel);
                    }}
                    className="group bg-slate-50 hover:bg-red-50/50 p-3 rounded-xl border border-slate-200 cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase text-red-600">
                        {rel.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-red-700 line-clamp-2 leading-snug">
                        {rel.title}
                      </h4>
                    </div>
                    <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>{rel.publishedAt}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-red-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
