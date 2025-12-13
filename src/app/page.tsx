'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import OreegamiMessages from '@/components/OreegamiMessages';
import LoginModal from '@/components/LoginModal';

// --- Types ---

interface Article {
  id: number | string;
  title: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  date: string;
  link?: string;
  image: string;
  score?: number;
}

interface Tutorial {
  id: number;
  software: string;
  channel_name: string;
  url: string;
  image_url: string;
}

interface JtVideo {
  id: number;
  video_url: string;
  thumbnail_url?: string;
  title?: string;
  date: string;
  article_ids?: number[];
}

// --- Constants & Helpers ---
// Removed unused categoryTags

const globalFallbackImages = [
  "/images/placeholders/placeholder_0.jpg",
  "/images/placeholders/placeholder_1.jpg",
  "/images/placeholders/placeholder_2.jpg",
  "/images/placeholders/placeholder_3.jpg",
  "/images/placeholders/placeholder_4.jpg",
  "/images/placeholders/placeholder_5.jpg",
  "/images/placeholders/placeholder_6.jpg",
  "/images/placeholders/placeholder_7.jpg",
  "/images/placeholders/placeholder_8.jpg",
  "/images/placeholders/placeholder_9.jpg",
  "/images/placeholders/placeholder_11.jpg",
  "/images/placeholders/placeholder_12.jpg"
];

function getDeterministicImage(inputString: string) {
  if (!inputString) return globalFallbackImages[0];
  let hash = 0;
  for (let i = 0; i < inputString.length; i++) {
    hash = inputString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % globalFallbackImages.length;
  return globalFallbackImages[index];
}

function formatDate(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('fr-FR', options);
}

function getJtDateLabel(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  // Reset hours to compare dates only
  date.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  yesterday.setHours(0,0,0,0);

  if (date.getTime() === today.getTime()) return "Aujourd'hui";
  if (date.getTime() === yesterday.getTime()) return "Hier";
  
  return `JT du ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;
}

// --- Hardcoded Fallback Data ---
const fallbackJtArticles: Article[] = [
  {
    id: 1,
    title: "L'IA générative révolutionne le développement d'applications",
    excerpt: "Découvrez comment les outils d'IA générative transforment la façon dont nous créons des applications.",
    category: "IA",
    tags: ["ChatGPT", "Claude"],
    date: "2024-01-15",
    link: "#",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800"
  },
  {
    id: 2,
    title: "No-Code : La démocratisation de la création digitale",
    excerpt: "Les plateformes No-Code permettent désormais à tous de créer des applications professionnelles.",
    category: "No-Code",
    tags: ["Bubble", "Webflow"],
    date: "2024-01-14",
    link: "#",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800"
  },
  {
    id: 3,
    title: "ChatGPT et les assistants IA : Nouveaux outils de productivité",
    excerpt: "Comment les assistants IA comme ChatGPT changent la productivité.",
    category: "IA",
    tags: ["ChatGPT"],
    date: "2024-01-13",
    link: "#",
    image: "https://images.unsplash.com/photo-1676299080923-6c98c0cf4e48?w=800"
  }
];

const fallbackCoursePrepArticles: Article[] = [
  {
    id: 8,
    title: "Les fondamentaux de l'IA pour débutants",
    excerpt: "Comprendre les bases de l'intelligence artificielle avant de plonger dans les outils avancés.",
    category: "IA",
    tags: ["ChatGPT", "Gemini"],
    date: "2024-01-17",
    link: "#",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800"
  },
  {
    id: 9,
    title: "Premiers pas avec les prompts efficaces",
    excerpt: "Apprenez à formuler des prompts qui donnent des résultats précis et pertinents.",
    category: "IA",
    tags: ["ChatGPT", "Claude"],
    date: "2024-01-17",
    link: "#",
    image: "https://images.unsplash.com/photo-1676299080923-6c98c0cf4e48?w=800"
  },
  {
    id: 10,
    title: "Introduction aux outils No-Code",
    excerpt: "Découvrez les plateformes No-Code les plus populaires et leurs cas d'usage.",
    category: "No-Code",
    tags: ["Bubble", "Webflow"],
    date: "2024-01-16",
    link: "#",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800"
  }
];

// --- Main Component ---

// --- Main Component ---
export default function Home() {
  const [supabase] = useState(() => createClient());
  
  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFormatMenuOpen, setIsFormatMenuOpen] = useState(false);
  const [activeFormat, setActiveFormat] = useState<'video' | 'podcast' | 'text'>('video');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  // Data State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [jtVideo, setJtVideo] = useState<JtVideo | null>(null);
  const [jtVideosList, setJtVideosList] = useState<JtVideo[]>([]);
  const [currentJtIndex, setCurrentJtIndex] = useState(0);
  const [jtSubjects, setJtSubjects] = useState<Article[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [coursePrepArticles, _setCoursePrepArticles] = useState<Article[]>(fallbackCoursePrepArticles);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const isNavigatingRef = useRef(false);

  // Fetch Session on Mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Helper to close format menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.format-controls')) {
        setIsFormatMenuOpen(false);
      }
      if (!target.closest('.auth-position')) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch Data
   useEffect(() => {
    async function fetchData() {
      // 0. Get User and Promo Config
      const { data: { user } } = await supabase.auth.getUser();
      let promoConfig: { tuto_sources?: string[], video_tags?: string[] } = {};

      if (user && user.email) {
          const { data: studentData } = await supabase
              .from('students')
              .select('promos!inner(tuto_config, video_config)')
              .eq('email', user.email)
              .single();
          
          if (studentData && studentData.promos) {
              const promosRaw = studentData.promos;
              // Handle case where it might be array or object due to joined query
              const p = Array.isArray(promosRaw) ? promosRaw[0] : promosRaw;
              
              if (p) {
                  promoConfig = {
                      tuto_sources: p.tuto_config?.sources || [],
                      video_tags: p.video_config?.tags || []
                  };
              }
          }
      }

      // 1. Fetch Latest JTs (History)
      // If we have video tags config, we could try to filter, but current JTs might not have explicit tags in DB easily queryable. 
      // For now, we assume "Vidéos" column is just the history.
      const { data: jtDataList } = await supabase
        .from('daily_news_videos')
        .select('*')
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .limit(10);

      if (jtDataList && jtDataList.length > 0) {
        setJtVideosList(jtDataList);
        setJtVideo(jtDataList[0]);
        setCurrentJtIndex(0);
      }

      // 2. Fetch Articles for Buzz & Trending
      const { data: articlesData } = await supabase
        .from('articles')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(30);

      if (articlesData && articlesData.length > 0) {
        // Scoring logic logic from script.js
        const interestingKeywords = ['nouveau', 'révolution', 'innovation', 'découverte', 'important', 'majeur', 'exclusif', 'outil', 'guide', 'comment', 'gpt-5', 'llm', 'agent'];
        
        const mapped = articlesData.map((article: { id: number; title: string; excerpt: string; tags: string[]; published_at: string; url: string; image_url: string }) => {
           let score = 0;
           const lowerTitle = article.title?.toLowerCase() || '';
           // Keyword Bonus
           interestingKeywords.forEach(k => {
             if (lowerTitle.includes(k)) score += 10;
           });
           // Recency Bonus
           if (new Date(article.published_at).toDateString() === new Date().toDateString()) score += 10;
           
           return {
             id: article.id,
             title: article.title,
             excerpt: (article.excerpt || '').replace(/<[^>]*>?/gm, ''),
             category: 'IA', // Default
             tags: article.tags,
             date: article.published_at,
             link: article.url,
             image: article.image_url || getDeterministicImage(article.title),
             score
           };
        });

        // Sort by score
        mapped.sort((a, b) => (b.score || 0) - (a.score || 0));

        setTrendingArticles(mapped.slice(0, 15));
        // setBuzzArticles(mapped.slice(0, 6)); // Removed
      } else {
        // Fallback if no data
        setTrendingArticles(fallbackJtArticles); 
      }

      // 3. Fetch Tutorials with filtering
      let tutoQuery = supabase
        .from('tutorials')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (promoConfig.tuto_sources && promoConfig.tuto_sources.length > 0) {
          // Construct an OR filter for channel_name ILIKE any source or custom logic
          // Simplification: We fetch 20 and filter in JS if simple query fails.
          tutoQuery = tutoQuery.limit(20);
      } else {
          tutoQuery = tutoQuery.limit(5);
      }

      const { data: tutoData } = await tutoQuery;

      if (tutoData) {
        let filteredTutos = tutoData;
        
        // Client-side filtering for flexibility
        if (promoConfig.tuto_sources && promoConfig.tuto_sources.length > 0) {
             const lowerSources = promoConfig.tuto_sources.map(s => s.toLowerCase());
             filteredTutos = tutoData.filter((t: { channel_name?: string; software?: string }) => {
                 const c = (t.channel_name || '').toLowerCase();
                 const s = (t.software || '').toLowerCase();
                 return lowerSources.some(src => c.includes(src) || s.includes(src));
             });
        }
        
        // Take top 5 after filtering
        const limitedTutos = filteredTutos.slice(0, 5);

        const parsedTutos = limitedTutos.map((tuto: { id: number; image_url: string; software: string; channel_name: string; url: string }) => {
            let bgImage = tuto.image_url;
            if (bgImage && typeof bgImage === 'string' && (bgImage.startsWith('{') || bgImage.startsWith('['))) {
                try {
                    const parsed = JSON.parse(bgImage);
                    const imageObj = Array.isArray(parsed) ? parsed[0] : parsed;
                    if (imageObj && imageObj.url) {
                        bgImage = imageObj.url;
                    }
                } catch (e) {
                    console.warn('Failed to parse image JSON', e);
                }
            }
            return { ...tuto, image_url: bgImage };
        });
        setTutorials(parsedTutos);
      }
    }

    fetchData();
  }, [supabase]);

  // Fetch JT Subjects whenever jtVideo changes
  useEffect(() => {
    async function fetchSubjects() {
        if (!jtVideo?.article_ids || jtVideo.article_ids.length === 0) {
            setJtSubjects([]);
            return;
        }
        
        const { data: articles } = await supabase
            .from('articles')
            .select('id, title, image_url, url, published_at')
            .in('id', jtVideo.article_ids)
            .limit(5);
            
        if (articles) {
             setJtSubjects(articles.map((a: { id: number; title: string; image_url: string; url: string; published_at: string }) => ({
              id: a.id,
              title: a.title,
              image: a.image_url || getDeterministicImage(a.title),
              link: a.url,
              date: a.published_at,
              category: 'JT'
            })));
        }
    }
    fetchSubjects();
  }, [jtVideo, supabase]);

  const handlePrevJt = () => {
    if (currentJtIndex < jtVideosList.length - 1) {
        isNavigatingRef.current = true;
        const newIndex = currentJtIndex + 1;
        setCurrentJtIndex(newIndex);
        setJtVideo(jtVideosList[newIndex]);
    }
  };

  const handleNextJt = () => {
    if (currentJtIndex > 0) {
        isNavigatingRef.current = true;
        const newIndex = currentJtIndex - 1;
        setCurrentJtIndex(newIndex);
        setJtVideo(jtVideosList[newIndex]);
    }
  };

  // Video Jingle Logic
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !jtVideo) return;

    const jingleUrl = '/video/Jingle.mp4';
    const mainVideoUrl = jtVideo.video_url;

    // Handle Unmute
    const handleUnmute = () => {
        if (video.muted) {
            video.muted = false;
        }
    }
    video.addEventListener('click', handleUnmute);

    // Jingle transition handler
    const handleEnded = () => {
      if (video.src.includes('Jingle.mp4')) {
        video.src = mainVideoUrl;
        video.load();
        video.play().catch(console.error);
      }
    };

    if (isNavigatingRef.current) {
        // Skip jingle if navigating
        video.src = mainVideoUrl;
        video.muted = false; // Unmute for user-initiated navigation
        video.play().catch(console.error);
        isNavigatingRef.current = false;
    } else {
        // Play jingle for initial load
        video.src = jingleUrl;
        video.playsInline = true;
        video.muted = true; // Start muted for autoplay
        
        video.addEventListener('ended', handleEnded);
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Autoplay failed
            });
        }
    }

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('click', handleUnmute);
    };
  }, [jtVideo]);

  // Fullscreen Logic
  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    
    if (!document.fullscreenElement) {
        videoContainerRef.current.requestFullscreen().catch(console.error);
        setIsFullscreen(true);
    } else {
        document.exitFullscreen();
        setIsFullscreen(false);
    }
  };


  return (
    <>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        {/* Header */}
        <header className="header">
          <div className="header-container">
            {/* Mobile Menu Toggle */}
            <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Menu">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </button>

            <Link href="/" className="logo-link">
                <div className="logo">
                    <div className="logo-wrapper">
                         {/* Showing SVG logo as default since we copied it */}
                        <Image src="/logo.svg" alt="OREEGAM'IA Logo" width={32} height={32} className="logo-img" style={{display: 'block'}} unoptimized />
                    </div>
                    <div className="logo-placeholder" style={{display: 'none'}}>
                        <span className="logo-text">OREEGAM&apos;IA</span>
                    </div>
                </div>
            </Link>

            <nav className="main-nav hidden md:flex">
                <a href="#jtnews" className="nav-link">JTNews</a>
                <a href="#categories" className="nav-link">Catégories</a>
                <a href="#actualite" className="nav-link">Actualité</a>
                <a href="#courseprep" className="nav-link">Cours</a>
                <a href="/shortnews.html" className="nav-link">ShortNews</a>
            </nav>

            <div className="search-container">
                <button className="search-toggle-btn" onClick={() => setIsSearchOpen(!isSearchOpen)} aria-label="Rechercher">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                </button>
            </div>

            {user ? (
              <div className="auth-position relative">
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="auth-button flex items-center gap-2 p-1.5 focus:outline-none"
                >
                  {user.user_metadata?.avatar_url ? (
                     <div className="relative w-8 h-8 rounded-full border border-gray-200 overflow-hidden">
                       <Image 
                          src={user.user_metadata.avatar_url} 
                          alt="Profile" 
                          fill
                          className="object-cover"
                          unoptimized
                       />
                     </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                        <span className="font-bold text-xs">{user.email?.charAt(0).toUpperCase() || 'U'}</span>
                    </div>
                  )}
                  <span className="auth-text hidden sm:inline font-medium text-black truncate max-w-[60px]">
                      {user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.name?.split(' ')[0] || 'Mon Profil'}
                  </span>
                </button>
                
                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-150 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 mb-1">
                      <p className="text-sm font-bold text-gray-900 truncate">
                          {user.user_metadata?.full_name || user.user_metadata?.name || 'Utilisateur'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    {/* Admin / Trainer Menu */}
                    {(user.email?.toLowerCase().includes('benjamin') || user.email?.toLowerCase().includes('oreegami')) && (
                        <Link href="/teacher" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                          </svg>
                          Espace formateur
                        </Link>
                    )}
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.reload();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
                <button 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="auth-button auth-position"
                >
                    <span className="auth-text hidden sm:inline">S&apos;inscrire / Se connecter</span>
                    <svg className="auth-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </button>
            )}
          </div>
        </header>

        {/* Search Overlay */}
        <div className={`search-overlay ${isSearchOpen ? 'active' : ''}`} id="searchOverlay">
            <div className="search-overlay-content">
                <form className="search-overlay-form" onSubmit={(e) => e.preventDefault()}>
                    <input type="search" className="search-overlay-input" placeholder="Rechercher des articles..." aria-label="Rechercher" autoFocus={isSearchOpen} />
                    <button type="submit" className="search-overlay-submit" aria-label="Rechercher">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </button>
                    <button type="button" className="search-overlay-close" onClick={() => setIsSearchOpen(false)} aria-label="Fermer">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </form>
            </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
             <div className="mobile-menu-container active" id="mobileMenuContainer" style={{display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'white', zIndex: 200, padding: '2rem'}}>
                <button className="mobile-menu-close" onClick={() => setIsMobileMenuOpen(false)} aria-label="Fermer le menu" style={{position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none'}}>
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <nav className="mobile-nav" style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem'}}>
                    <a href="#jtnews" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>JTNews</a>
                    <a href="#categories" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Catégories</a>
                    <a href="#actualite" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Actualité</a>
                    <a href="#courseprep" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Cours</a>
                </nav>
            </div>
        )}

        <main className="main-content">
            {/* Hero Section */}
            <section className="hero-section" id="jtnews">
                <div className="container">
                    <div className="hero-container">
                        {/* Video Column */}
                        <div className={`video-column ${isFullscreen ? 'fullscreen' : ''}`} ref={videoContainerRef}>

                            <div className="video-wrapper">
                                <button className="fullscreen-btn" onClick={toggleFullscreen} aria-label="Plein écran">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d={isFullscreen ? "M4 14h6v6M10 14L3 21M20 10h-6V4M14 10l7-7" : "M15 3h6v6M21 3l-7 7M9 21H3v-6M3 21l7-7"} />
                                    </svg>
                                </button>
                                
                                <div className="format-controls">
                                    <button className="format-btn" onClick={() => setIsFormatMenuOpen(!isFormatMenuOpen)}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path>
                                            <path d="M12 8v8"></path>
                                            <path d="M8 12h8"></path>
                                        </svg>
                                        Changer de format
                                    </button>
                                    <div className={`format-menu ${isFormatMenuOpen ? 'show' : ''}`} id="formatMenu">
                                        <button className="format-option" onClick={() => { setActiveFormat('video'); setIsFormatMenuOpen(false); }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                            </svg>
                                            Vidéo
                                        </button>
                                        <button className="format-option" onClick={() => { setActiveFormat('podcast'); setIsFormatMenuOpen(false); }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                                <line x1="8" y1="23" x2="16" y2="23"></line>
                                            </svg>
                                            Podcast
                                        </button>
                                        <button className="format-option" onClick={() => { setActiveFormat('text'); setIsFormatMenuOpen(false); }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                                <polyline points="10 9 9 9 8 9"></polyline>
                                            </svg>
                                            Texte
                                        </button>
                                    </div>
                                </div>

                                <div id="format-video" className={`format-content ${activeFormat === 'video' ? 'active' : ''}`} style={activeFormat !== 'video' ? {display: 'none'} : {}}>
                                    <video 
                                        ref={videoRef}
                                        className="video-player" 
                                        controls 
                                        poster={jtVideo?.thumbnail_url || "https://placehold.co/1920x1080?text=Chargement+du+JT..."}
                                        style={{width: '100%', height: '100%', objectFit: 'cover', background: 'black'}}
                                    >
                                        {jtVideo?.video_url && (
                                            <source src="/video/Jingle.mp4" type="video/mp4" />
                                        )}
                                        {/* Fallback managed by JS via video.src */}
                                        Votre navigateur ne supporte pas la lecture de vidéos.
                                    </video>

                                    
                                </div>
                                <div id="format-podcast" className={`format-content ${activeFormat === 'podcast' ? 'active' : ''}`} style={activeFormat !== 'podcast' ? {display: 'none'} : {}}>
                                    <div className="placeholder-content">
                                        <div className="audio-player-mock">
                                            <div className="play-btn">▶</div>
                                            <div className="progress-bar">
                                                <div className="progress" style={{width: '30%'}}></div>
                                            </div>
                                            <div className="time">04:20 / 12:45</div>
                                        </div>
                                        <h3>Version Audio (Podcast)</h3>
                                        <p>Écoutez le résumé de l&apos;actualité IA & No-Code de la semaine.</p>
                                    </div>
                                </div>
                                <div id="format-text" className={`format-content ${activeFormat === 'text' ? 'active' : ''}`} style={activeFormat !== 'text' ? {display: 'none'} : {}}>
                                    <div className="placeholder-content text-mode">
                                        <h3>Transcription du JT</h3>
                                        <p><strong>00:00</strong> - Introduction et sommaire...</p>
                                        <p><strong>01:15</strong> - L&apos;IA générative bouleverse le marché...</p>
                                        <button className="read-more-btn">Lire la transcription complète</button>
                                    </div>
                                </div>
                            </div>
                        
                        {/* JT Navigation Controls - Moved outside wrapper to avoid overflow clipping */}
                        {activeFormat === 'video' && (
                            <div className="flex items-center justify-center gap-6 mt-4 pb-2 select-none">
                                <button 
                                    onClick={handlePrevJt} 
                                    disabled={currentJtIndex >= jtVideosList.length - 1}
                                    className={`p-2 rounded-full transition-colors flex items-center justify-center group ${currentJtIndex >= jtVideosList.length - 1 ? 'opacity-30 cursor-not-allowed text-gray-400' : 'hover:bg-gray-200 text-black'}`}
                                    aria-label="JT Précédent"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:-translate-x-1 transition-transform">
                                        <polyline points="15 18 9 12 15 6"></polyline>
                                    </svg>
                                </button>

                                <div className="text-lg font-bold text-black min-w-[150px] text-center">
                                    {jtVideo ? getJtDateLabel(jtVideo.date) : "Chargement..."}
                                </div>

                                <div className="min-w-[40px]">
                                    {currentJtIndex > 0 && (
                                        <button 
                                            onClick={handleNextJt} 
                                            className="p-2 rounded-full hover:bg-gray-200 text-black transition-colors flex items-center justify-center group"
                                            aria-label="JT Suivant"
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:translate-x-1 transition-transform">
                                                <polyline points="9 18 15 12 9 6"></polyline>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        </div>

                        <div className="articles-column">
                            <div className="vignettes-container">
                                {/* Sujets du JT Column */}
                                <div className="vignette-column">
                                    <h3 className="vignette-title">Sujets du JT</h3>
                                    <div className="vignettes-list">
                                        {jtSubjects.length > 0 ? jtSubjects.map(article => (
                                            <div key={article.id} className="vignette-card" onClick={() => article.link && window.open(article.link, '_blank')}>
                                                <div className="relative w-full h-[120px]">
                                                    <Image 
                                                        src={article.image} 
                                                        className="vignette-image object-cover" 
                                                        alt={article.title} 
                                                        fill
                                                        unoptimized
                                                    />
                                                </div>
                                                <div className="vignette-info">{article.title}</div>
                                            </div>
                                        )) : (
                                            <div className="empty-state"><p>Chargement...</p></div>
                                        )}
                                    </div>
                                </div>

                                {/* Vidéos Column (formerly Tutos) */}
                                <div className="vignette-column">
                                    <h3 className="vignette-title">Vidéos</h3>
                                    <div className="vignettes-list">
                                        {jtVideosList.map((video, index) => (
                                            <div key={video.id || index} className="vignette-card" onClick={() => {
                                                setJtVideo(video);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}>
                                                <div className="relative w-full h-[120px]">
                                                    <Image 
                                                        src={video.thumbnail_url || "https://placehold.co/1920x1080?text=Vidéo"} 
                                                        className="vignette-image object-cover" 
                                                        alt={video.title || "Vidéo JT"} 
                                                        fill
                                                        unoptimized
                                                    />
                                                </div>
                                                <div className="vignette-info">
                                                    <div style={{fontWeight: 900, fontSize: '0.9em', color: '#000', marginBottom: '4px'}}>
                                                        {getJtDateLabel(video.date)}
                                                    </div>
                                                    <div className="text-sm text-gray-600 line-clamp-2">{video.title}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Oreegami Messages & Tutos Column */}
                                <div className="vignette-column" style={{gap: '1.5rem'}}>
                                    <div style={{flex: '0 0 auto', maxHeight: '45%', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                                        <OreegamiMessages />
                                    </div>
                                    
                                    <div style={{flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
                                        <h3 className="vignette-title">Tutos</h3>
                                        <div className="vignettes-list">
                                            {tutorials.map(tuto => (
                                                <div key={tuto.id} className="vignette-card" onClick={() => window.open(tuto.url, '_blank')}>
                                                    <div className="relative w-full h-[120px]">
                                                        <Image 
                                                            src={tuto.image_url || getDeterministicImage(tuto.software)} 
                                                            className="vignette-image object-cover" 
                                                            alt={tuto.software} 
                                                            fill
                                                            unoptimized
                                                        />
                                                    </div>
                                                    <div className="vignette-info">
                                                        <div style={{fontWeight: 900, fontSize: '1.1em', color: '#000', marginBottom: '4px'}}>{tuto.software}</div>
                                                        <div style={{fontSize: '0.9em', color: '#666'}}>{tuto.channel_name}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* Trending Articles */}
            <section className="articles-section trending-articles" id="actualite">
                <div className="container">
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                        <h2 className="section-title mb-0!">Les news de l&apos;IA</h2>
                        <div className="flex-1 flex gap-2 ml-12 flex-wrap">
                            <a href="/category.html?category=IA" className="flex-1 text-center justify-center flex items-center px-3 py-2 rounded-xl text-sm font-bold text-white bg-linear-to-br from-blue-600 to-cyan-500 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
                                IA
                            </a>
                            <a href="/category.html?category=No-Code" className="flex-1 text-center justify-center flex items-center px-3 py-2 rounded-xl text-sm font-bold text-white bg-linear-to-br from-purple-600 to-pink-600 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
                                No-Code
                            </a>
                            <a href="/category.html?category=Automatisation" className="flex-1 text-center justify-center flex items-center px-3 py-2 rounded-xl text-sm font-bold text-white bg-linear-to-br from-orange-600 to-amber-500 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
                                Automatisation
                            </a>
                            <a href="/category.html?category=Vibe-coding" className="flex-1 text-center justify-center flex items-center px-3 py-2 rounded-xl text-sm font-bold text-white bg-linear-to-br from-violet-500 via-pink-500 to-rose-500 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
                                Vibe-coding
                            </a>
                            <a href="/category.html?category=Multimedia" className="flex-1 text-center justify-center flex items-center px-3 py-2 rounded-xl text-sm font-bold text-white bg-linear-to-br from-emerald-500 to-blue-500 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
                                Multimédia
                            </a>
                        </div>
                    </div>
                    <div className="articles-grid">
                        {trendingArticles.map(article => (
                             <article key={article.id} className="article-card" onClick={() => article.link && window.open(article.link, '_blank')}>
                                <div className="article-image-container relative h-48 w-full">
                                    <Image 
                                        src={article.image} 
                                        alt={article.title} 
                                        fill 
                                        className="article-image object-cover" 
                                        unoptimized 
                                    />
                                </div>
                                <div className="article-content">
                                    {article.tags && (
                                        <div className="article-tags">
                                            {article.tags.map(tag => (
                                                <span key={tag} className="article-tag">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                    <h3 className="article-title">{article.title}</h3>
                                    <div className="article-meta">
                                        <span className="article-date">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <polyline points="12 6 12 12 16 14"></polyline>
                                            </svg>
                                            {formatDate(article.date)}
                                        </span>
                                        <span className="article-link" onClick={(e) => { e.stopPropagation(); if (article.link) window.open(article.link, '_blank'); }}>
                                            Lire →
                                        </span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

             {/* Course Prep */}
             <section className="course-prep-section" id="courseprep">
                <div className="container">
                    <h2 className="section-title">Préparez le prochain cours</h2>
                    <p className="section-subtitle">Articles recommandés pour bien démarrer votre prochaine session de formation</p>
                    <div className="articles-grid">
                        {coursePrepArticles.map(article => (
                             <article key={article.id} className="article-card" onClick={() => article.link && window.open(article.link, '_blank')}>
                                <div className="article-image-container relative h-48 w-full">
                                    <Image 
                                        src={article.image} 
                                        alt={article.title} 
                                        fill 
                                        className="article-image object-cover" 
                                        unoptimized 
                                    />
                                </div>
                                <div className="article-content">
                                     <div className="article-tags">
                                        {article.category && <span className="article-tag">{article.category}</span>}
                                    </div>
                                    <h3 className="article-title">{article.title}</h3>
                                    <div className="article-meta">
                                        <span className="article-link">Lire →</span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

        </main>

        {/* Footer */}
        <footer className="footer">
            <div className="container">
                <p>&copy; 2024 OREEGAM&apos;IA - Veille IA & No-Code</p>
            </div>
        </footer>
      </div>
    </>
  );
}
