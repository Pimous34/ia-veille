'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

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
export default function Home() {
  const supabase = createClientComponentClient();
  
  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFormatMenuOpen, setIsFormatMenuOpen] = useState(false);
  const [activeFormat, setActiveFormat] = useState<'video' | 'podcast' | 'text'>('video');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Data State
  const [jtVideo, setJtVideo] = useState<JtVideo | null>(null);
  const [jtSubjects, setJtSubjects] = useState<Article[]>([]);
  const [buzzArticles, setBuzzArticles] = useState<Article[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [coursePrepArticles, _setCoursePrepArticles] = useState<Article[]>(fallbackCoursePrepArticles);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Helper to close format menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.format-controls')) {
        setIsFormatMenuOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch Data
   useEffect(() => {
    async function fetchData() {
      // 1. Fetch Latest JT
      const { data: jtData } = await supabase
        .from('daily_news_videos')
        .select('*')
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (jtData) {
        setJtVideo(jtData);
        // Fetch JT Subjects
        if (jtData.article_ids && jtData.article_ids.length > 0) {
          const { data: articles } = await supabase
            .from('articles')
            .select('id, title, image_url, url, published_at')
            .in('id', jtData.article_ids)
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
        setBuzzArticles(mapped.slice(0, 6));
      } else {
        // Fallback if no data
        setTrendingArticles(fallbackJtArticles); 
      }

      // 3. Fetch Tutorials
      const { data: tutoData } = await supabase
        .from('tutorials')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (tutoData) {
        const parsedTutos = tutoData.map((tuto: { id: number; image_url: string; software: string; channel_name: string; url: string }) => {
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

  // Video Jingle Logic
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !jtVideo) return;

    const jingleUrl = '/video/Jingle.mp4';
    const mainVideoUrl = jtVideo.video_url;

    video.src = jingleUrl;
    video.playsInline = true;
    video.muted = true; // Start muted for autoplay
    
    // Play attempt
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay failed
      });
    }

    const handleEnded = () => {
      if (video.src.includes('Jingle.mp4')) {
        video.src = mainVideoUrl;
        video.load();
        video.play().catch(console.error);
      }
    };
    
    const handleUnmute = () => {
        if (video.muted) {
            video.muted = false;
        }
    }

    video.addEventListener('ended', handleEnded);
    video.addEventListener('click', handleUnmute);
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
                        <img src="/logo.svg" alt="OREEGAM'IA Logo" className="logo-img" style={{display: 'block'}} />
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

            <Link href="/auth" className="auth-button">
                <span className="auth-text hidden sm:inline">S&apos;inscrire / Se connecter</span>
                <svg className="auth-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </Link>
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
                                        <source src="" type="video/mp4" />
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
                        </div>

                        <div className="articles-column">
                            <div className="vignettes-container">
                                {/* Sujets du JT Column */}
                                <div className="vignette-column">
                                    <h3 className="vignette-title">Sujets du JT</h3>
                                    <div className="vignettes-list">
                                        {jtSubjects.length > 0 ? jtSubjects.map(article => (
                                            <div key={article.id} className="vignette-card" onClick={() => article.link && window.open(article.link, '_blank')}>
                                                <img 
                                                    src={article.image} 
                                                    className="vignette-image" 
                                                    alt={article.title} 
                                                />
                                                <div className="vignette-info">{article.title}</div>
                                            </div>
                                        )) : (
                                            <div className="empty-state"><p>Chargement...</p></div>
                                        )}
                                    </div>
                                </div>

                                {/* News Column */}
                                <div className="vignette-column">
                                    <h3 className="vignette-title">News</h3>
                                    <div className="vignettes-list">
                                        {buzzArticles.map(article => (
                                            <div key={article.id} className="vignette-card" onClick={() => article.link && window.open(article.link, '_blank')}>
                                                <div style={{position: 'relative'}}>
                                                    <img src={article.image} className="vignette-image" alt={article.title} />
                                                    {article.score && article.score > 20 && (
                                                        <span style={{position:'absolute', top:'5px', right:'5px', background:'red', color:'white', fontSize:'0.7em', padding:'2px 6px', borderRadius:'10px'}}>HOT</span>
                                                    )}
                                                </div>
                                                <div className="vignette-info">
                                                    <div style={{fontWeight: 'bold', marginBottom: '4px'}}>{article.title}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tutos Column */}
                                <div className="vignette-column">
                                    <h3 className="vignette-title">Tutos</h3>
                                    <div className="vignettes-list">
                                        {tutorials.map(tuto => (
                                            <div key={tuto.id} className="vignette-card" onClick={() => window.open(tuto.url, '_blank')}>
                                                <img 
                                                    src={tuto.image_url || getDeterministicImage(tuto.software)} 
                                                    className="vignette-image" 
                                                    alt={tuto.software} 
                                                />
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
            </section>

            {/* Categories Section */}
            <section className="categories-section" id="categories">
                <div className="container">
                    <h2 className="section-title">Toutes les catégories</h2>
                    <div className="categories-grid">
                        <a href="/category.html?category=IA" className="category-card cat-ia">
                            <span className="category-name">IA</span>
                        </a>
                        <a href="/category.html?category=No-Code" className="category-card cat-nocode">
                            <span className="category-name">No-Code & Back-end</span>
                        </a>
                        <a href="/category.html?category=Automatisation" className="category-card cat-auto">
                            <span className="category-name">Automatisation</span>
                        </a>
                        <a href="/category.html?category=Vibe-coding" className="category-card cat-vibe">
                            <span className="category-name">Vibe-coding</span>
                        </a>
                        <a href="/category.html?category=Multimedia" className="category-card cat-multimedia">
                            <span className="category-name">Outils Multimédias</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* Trending Articles */}
            <section className="articles-section trending-articles" id="actualite">
                <div className="container">
                    <h2 className="section-title">Articles Tendances</h2>
                    <div className="articles-grid">
                        {trendingArticles.map(article => (
                             <article key={article.id} className="article-card" onClick={() => article.link && window.open(article.link, '_blank')}>
                                <div className="article-image-container">
                                    <img src={article.image} alt={article.title} className="article-image" />
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
                                <div className="article-image-container">
                                    <img src={article.image} alt={article.title} className="article-image" />
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
