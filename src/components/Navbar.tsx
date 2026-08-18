import React, { useState } from 'react';
import { 
  ChevronDown, 
  Menu, 
  X, 
  Globe, 
  BookOpen, 
  Newspaper, 
  Share2, 
  ExternalLink,
  Flame,
  Check,
  Info
} from 'lucide-react';
import { CategoryType } from '../types';

interface NavbarProps {
  selectedCategory: CategoryType;
  onSelectCategory: (category: CategoryType) => void;
  onScrollToSection: (sectionId: string) => void;
  onOpenSocialModal: (platformName: string) => void;
  onOpenAbout?: () => void;
  customCategories?: string[];
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedCategory,
  onSelectCategory,
  onScrollToSection,
  onOpenSocialModal,
  onOpenAbout,
  customCategories
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const newsSubcategories: { name: CategoryType; desc: string }[] = [
    { name: 'Pemerintahan', desc: 'Kebijakan publik, regulasi & pemilu' },
    { name: 'Politik', desc: 'Dinamika parpol, parlemen & isu strategis' },
    { name: 'Mahasiswa', desc: 'Gerakan aksi, riset & prestasi kampus' },
    { name: 'Sosial Budaya', desc: 'Aspirasi masyarakat & tradisi daerah' },
    { name: 'Ekonomi', desc: 'Bisnis, UMKM, pasar & keuangan' },
    { name: 'Olahraga & Seni', desc: 'Prestasi atlet & kreasi seniman' },
    { name: 'Organisasi & Komunitas', desc: 'Gerakan sosial & aksi kerelawanan' },
  ];

  const ceritaSubcategories: { name: CategoryType; desc: string }[] = [
    { name: 'Opini', desc: 'Analisis kritis para pakar & akademisi' },
    { name: 'Gagasan', desc: 'Ide solutif untuk kemajuan bangsa' },
    { name: 'Cerita Inspiratif', desc: 'Kisah keteladanan dari pelosok nusantara' },
  ];

  const socialPlatforms = [
    { name: 'Instagram', handle: '@officiallibertamedia', url: 'https://instagram.com/officiallibertamedia' },
    { name: 'Threads', handle: '@officiallibertamedia', url: 'https://threads.net/@officiallibertamedia' },
    { name: 'X', handle: '@libertamedia_', url: 'https://x.com/libertamedia_' },
    { name: 'TikTok', handle: '@libertamedia', url: 'https://tiktok.com/@libertamedia' },
  ];

  const quickFilterPills: CategoryType[] = (customCategories && customCategories.length > 0)
    ? (customCategories as CategoryType[])
    : [
        'Pemerintahan',
        'Politik',
        'Mahasiswa',
        'Ekonomi',
        'Opini',
        'Cerita Inspiratif',
        'Internasional',
        'Sosial Budaya',
        'Olahraga & Seni'
      ];

  const handleCategoryClick = (cat: CategoryType) => {
    onSelectCategory(cat);
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  return (
    <div id="main-navigation-wrapper" className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Desktop 4 Main Pillar Menus */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            
            {/* Pillar 1: News with Dropdown */}
            <div 
              className="relative group"
              onMouseEnter={() => setActiveDropdown('news')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                id="nav-menu-news"
                onClick={() => {
                  onSelectCategory('Semua');
                  onScrollToSection('hero-section');
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-bold text-sm transition-colors ${
                  activeDropdown === 'news' || ['Pemerintahan', 'Politik', 'Mahasiswa', 'Sosial Budaya', 'Ekonomi', 'Olahraga & Seni', 'Organisasi & Komunitas'].includes(selectedCategory)
                    ? 'text-[#E5252A] bg-red-50'
                    : 'text-slate-800 hover:text-[#E5252A] hover:bg-slate-50'
                }`}
              >
                <Newspaper className="w-4 h-4 text-[#E5252A]" />
                <span>News</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#E5252A] transition-transform duration-200 group-hover:rotate-180" />
              </button>

              {/* News Mega Dropdown */}
              <div className="absolute top-full left-0 w-80 bg-white rounded-b-xl shadow-xl border-t-2 border-[#E5252A] border-x border-b border-slate-200 py-3 px-2 hidden group-hover:block animate-in fade-in slide-in-from-top-1 duration-200 z-50">
                <div className="px-3 pb-2 mb-1 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kanal Berita Utama</span>
                  <span className="text-[10px] text-red-600 font-semibold">7 Kanal</span>
                </div>
                <div className="space-y-0.5">
                  {newsSubcategories.map((sub) => (
                    <button
                      key={sub.name}
                      onClick={() => handleCategoryClick(sub.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-start justify-between group/item transition-all ${
                        selectedCategory === sub.name
                          ? 'bg-red-50 text-[#E5252A]'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-[#E5252A]'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 group-hover/item:text-[#E5252A]">{sub.name}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{sub.desc}</div>
                      </div>
                      {selectedCategory === sub.name && (
                        <Check className="w-3.5 h-3.5 text-[#E5252A] mt-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pillar 2: liberta cerita */}
            <div 
              className="relative group"
              onMouseEnter={() => setActiveDropdown('cerita')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                id="nav-menu-cerita"
                onClick={() => {
                  onSelectCategory('Opini');
                  onScrollToSection('cerita-section');
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-bold text-sm transition-colors ${
                  activeDropdown === 'cerita' || ['Opini', 'Gagasan', 'Cerita Inspiratif'].includes(selectedCategory)
                    ? 'text-[#E5252A] bg-red-50'
                    : 'text-slate-800 hover:text-[#E5252A] hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4 text-[#E5252A]" />
                <span>liberta cerita</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#E5252A] transition-transform duration-200 group-hover:rotate-180" />
              </button>

              {/* Cerita Dropdown */}
              <div className="absolute top-full left-0 w-72 bg-white rounded-b-xl shadow-xl border-t-2 border-[#E5252A] border-x border-b border-slate-200 py-3 px-2 hidden group-hover:block animate-in fade-in slide-in-from-top-1 duration-200 z-50">
                <div className="px-3 pb-2 mb-1 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ruang Gagasan</span>
                  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Terbuka untuk Publik</span>
                </div>
                <div className="space-y-0.5">
                  {ceritaSubcategories.map((sub) => (
                    <button
                      key={sub.name}
                      onClick={() => handleCategoryClick(sub.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-start justify-between group/item transition-all ${
                        selectedCategory === sub.name
                          ? 'bg-red-50 text-[#E5252A]'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-[#E5252A]'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 group-hover/item:text-[#E5252A]">{sub.name}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{sub.desc}</div>
                      </div>
                      {selectedCategory === sub.name && (
                        <Check className="w-3.5 h-3.5 text-[#E5252A] mt-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pillar 3: Internasional */}
            <button
              id="nav-menu-internasional"
              onClick={() => {
                onSelectCategory('Internasional');
                onScrollToSection('internasional-section');
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-bold text-sm transition-colors ${
                selectedCategory === 'Internasional'
                  ? 'text-[#E5252A] bg-red-50'
                  : 'text-slate-800 hover:text-[#E5252A] hover:bg-slate-50'
              }`}
            >
              <Globe className="w-4 h-4 text-[#E5252A]" />
              <span>Internasional</span>
            </button>

            {/* Pillar 5: Tentang Kami */}
            <div 
              className="relative group"
              onMouseEnter={() => setActiveDropdown('about')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                id="nav-menu-about"
                onClick={() => onOpenAbout && onOpenAbout()}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-bold text-sm transition-colors ${
                  activeDropdown === 'about'
                    ? 'text-[#E5252A] bg-red-50'
                    : 'text-slate-800 hover:text-[#E5252A] hover:bg-slate-50'
                }`}
              >
                <Info className="w-4 h-4 text-[#E5252A]" />
                <span>Tentang Kami</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#E5252A] transition-transform duration-200 group-hover:rotate-180" />
              </button>

              {/* Tentang Kami Dropdown Card */}
              <div 
                onClick={() => onOpenAbout && onOpenAbout()}
                className="absolute top-full right-0 w-80 bg-white rounded-b-xl shadow-xl border-t-2 border-[#E5252A] border-x border-b border-slate-200 p-4 hidden group-hover:block animate-in fade-in slide-in-from-top-1 duration-200 z-50 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2 text-[#E5252A]">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-4 h-4" />
                    <span className="font-extrabold text-xs uppercase tracking-wider">Tentang Kami</span>
                  </div>
                  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Buka Halaman →</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  <strong>libertamedia.com</strong> adalah media dan platform opini independen yang menyuarakan aspirasi publik, mahasiswa, dan masyarakat luas dengan semangat "Media Untuk Semua".
                </p>
              </div>
            </div>

          </nav>

          {/* Mobile menu hamburger toggle */}
          <div className="flex md:hidden items-center justify-end w-full">
            <button
              id="mobile-nav-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Horizontal Category Scroll Pills Bar */}
      <div className="bg-slate-50 border-t border-slate-200/80 overflow-x-auto no-scrollbar py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 whitespace-nowrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex-shrink-0">
            Pilihan:
          </span>
          {quickFilterPills.map((pill) => {
            const isActive = selectedCategory === pill;
            return (
              <button
                key={pill}
                onClick={() => onSelectCategory(pill)}
                className={`text-xs px-3 py-1 rounded-full font-semibold transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-[#E5252A] text-white shadow-sm ring-2 ring-red-300'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {pill}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 shadow-xl max-h-[80vh] overflow-y-auto">
          <div className="px-4 pt-3 pb-6 space-y-4">
            
            {/* News Section */}
            <div>
              <div className="font-extrabold text-sm text-slate-900 mb-2 flex items-center gap-1.5 text-[#E5252A]">
                <Newspaper className="w-4 h-4" />
                <span>News (Kanal Berita)</span>
              </div>
              <div className="grid grid-cols-2 gap-1 pl-2">
                {newsSubcategories.map((sub) => (
                  <button
                    key={sub.name}
                    onClick={() => handleCategoryClick(sub.name)}
                    className={`text-left p-2 rounded text-xs font-semibold ${
                      selectedCategory === sub.name
                        ? 'bg-red-50 text-[#E5252A] font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    • {sub.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Cerita Section */}
            <div className="border-t border-slate-100 pt-3">
              <div className="font-extrabold text-sm text-slate-900 mb-2 flex items-center gap-1.5 text-[#E5252A]">
                <BookOpen className="w-4 h-4" />
                <span>liberta cerita</span>
              </div>
              <div className="grid grid-cols-2 gap-1 pl-2">
                {ceritaSubcategories.map((sub) => (
                  <button
                    key={sub.name}
                    onClick={() => handleCategoryClick(sub.name)}
                    className={`text-left p-2 rounded text-xs font-semibold ${
                      selectedCategory === sub.name
                        ? 'bg-red-50 text-[#E5252A] font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    • {sub.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Internasional */}
            <div className="border-t border-slate-100 pt-3">
              <button
                onClick={() => handleCategoryClick('Internasional')}
                className="w-full font-extrabold text-sm text-slate-900 flex items-center justify-between p-2 rounded hover:bg-slate-100"
              >
                <div className="flex items-center gap-1.5 text-[#E5252A]">
                  <Globe className="w-4 h-4" />
                  <span>Kabar Internasional</span>
                </div>
                <span className="text-xs text-slate-400">Buka →</span>
              </button>
            </div>

            {/* Platforms */}
            <div className="border-t border-slate-100 pt-3">
              <div className="font-extrabold text-sm text-slate-900 mb-2 flex items-center gap-1.5 text-[#E5252A]">
                <Share2 className="w-4 h-4" />
                <span>Media Sosial & Platform</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {socialPlatforms.map((soc) => (
                  <button
                    key={soc.name}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenSocialModal(soc.name);
                    }}
                    className="p-2 rounded bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 text-left"
                  >
                    <span className="truncate block font-semibold">{soc.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tentang Kami Section */}
            <div 
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAbout && onOpenAbout();
              }}
              className="border-t border-slate-100 pt-3 space-y-1.5 cursor-pointer group"
            >
              <div className="font-extrabold text-sm text-slate-900 flex items-center justify-between text-[#E5252A]">
                <div className="flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  <span>Tentang Kami</span>
                </div>
                <span className="text-xs text-slate-400 font-medium group-hover:text-[#E5252A]">Buka →</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 group-hover:bg-red-50/50 transition-colors">
                <strong>libertamedia.com</strong> adalah media dan platform opini independen yang menyuarakan aspirasi publik, mahasiswa, dan masyarakat luas dengan semangat "Media Untuk Semua".
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
