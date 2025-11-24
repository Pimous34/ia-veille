'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import LoginModal from './LoginModal';
const PLAYLIST = [
  {
    src: '/video/video%20pour%20appli.mp4',
    poster: '/videos/hero-phone-poster.jpg',
    news: {
      imageSrc: '/images/news-placeholder.jpg',
      title: "Google lance sa meilleure IA : ce qu'il faut retenir",
    }
  },
  {
    src: '/video/video%20pour%20appli.mp4', // Placeholder: use same video for demo
    poster: '/videos/hero-phone-poster.jpg',
    news: {
      imageSrc: '/images/news-placeholder.jpg',
      title: "OpenAI : La mise à jour tant attendue",
    }
  },
  {
    src: '/video/video%20pour%20appli.mp4', // Placeholder
    poster: '/videos/hero-phone-poster.jpg',
    news: {
      imageSrc: '/images/news-placeholder.jpg',
      title: "Le futur de l'IA générative en 2025",
    }
  }
];

const NEWS_ITEMS = [
  {
    title: "Google lance sa meilleure IA : ce qu'il faut retenir",
    url: "#"
  },
  {
    title: "OpenAI : La mise à jour tant attendue",
    url: "#"
  },
  {
    title: "Le futur de l'IA générative en 2025",
    url: "#"
  }
];

const Hero = () => {
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [heroHeight, setHeroHeight] = useState<number | null>(null);
  const [heroWidth, setHeroWidth] = useState<number | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const shareFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const supabase = createClient();

  const currentVideo = PLAYLIST[currentVideoIndex];

  const showShareFeedback = (message: string) => {
    setShareFeedback(message);
    if (shareFeedbackTimeout.current) {
      clearTimeout(shareFeedbackTimeout.current);
    }
    shareFeedbackTimeout.current = setTimeout(() => {
      setShareFeedback(null);
    }, 2500);
  };

  useEffect(() => {
    // Check for user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    if (!videoRef.current) return;

    // Re-initialize player if needed or just update src
    if (!playerRef.current) {
      const player = videojs(videoRef.current, {
        controls: true,
        autoplay: true,
        muted: true,
        loop: true, // Loop individual video, scroll to change
        preload: 'auto',
        fill: true,
      });
      playerRef.current = player;
      player.on('error', () => setVideoUnavailable(true));
    } else {
      playerRef.current.src({ type: 'video/mp4', src: currentVideo.src });
      playerRef.current.play();
    }

    return () => {
      // Don't dispose here to allow smooth transitions, dispose on unmount only
    };
  }, [currentVideoIndex, currentVideo.src]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    const container = videoContainerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault(); // Always prevent page scroll when hovering video

      if (isTransitioning) return;

      const direction = event.deltaY > 0 ? 1 : -1;
      const nextIndex = currentVideoIndex + direction;

      // Check bounds
      if (nextIndex >= 0 && nextIndex < PLAYLIST.length) {
        setIsTransitioning(true);
        setCurrentVideoIndex(nextIndex);
        
        // Simple timeout to debounce rapid scrolls
        setTimeout(() => {
          setIsTransitioning(false);
        }, 500);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [currentVideoIndex, isTransitioning]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const NAV_OFFSET_MOBILE = 48; // ≈3rem navbar
    const NAV_OFFSET_DESKTOP = 96; // ≈6rem (nav + breathing room)
    const ASPECT_RATIO = 9 / 16; // video native ratio (w/h)

    const updateHeroHeight = () => {
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
      const isMobile = viewportWidth < 640;
      const isLandscape = viewportWidth > viewportHeight;

      if (isMobile && isLandscape) {
        // Mobile Landscape: Fit video within viewport height
        const height = viewportHeight - 20; // Small buffer
        setHeroHeight(height);
        
        // Calculate width to maintain aspect ratio
        const width = height * ASPECT_RATIO;
        setHeroWidth(width);
      } else {
        // Portrait or Desktop
        const offset = isMobile ? NAV_OFFSET_MOBILE : NAV_OFFSET_DESKTOP;
        const minHeight = isMobile ? 320 : 480;
        const height = Math.max(viewportHeight - offset, minHeight);
        setHeroHeight(height);

        if (isMobile) {
          setHeroWidth(null);
        } else {
          const widthFromHeight = height * ASPECT_RATIO;
          // On desktop, the video is in a 4/12 (1/3) column of a max-w-7xl container
          const containerWidth = Math.min(window.innerWidth, 1280); // 7xl is approx 1280px
          const columnWidth = (containerWidth * 0.33) - 32; // 33% width minus padding
          
          const maxWidth = Math.max(columnWidth, 300);
          setHeroWidth(Math.min(widthFromHeight, maxWidth));
        }
      }
    };

    updateHeroHeight();
    window.addEventListener('resize', updateHeroHeight);

    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener('resize', updateHeroHeight);

    return () => {
      window.removeEventListener('resize', updateHeroHeight);
      visualViewport?.removeEventListener('resize', updateHeroHeight);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (shareFeedbackTimeout.current) {
        clearTimeout(shareFeedbackTimeout.current);
      }
    };
  }, []);

  const handleInteraction = async (type: 'share' | 'like' | 'watch_later') => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    if (type === 'share') {
      await handleShareClick();
    } else {
      // Placeholder for other actions
      console.log(`${type} clicked by user ${user.email}`);
    }
  };

  const handleShareClick = async () => {
    if (typeof window === 'undefined') return;

    const shareUrl = window.location.href;
    const shareData = {
      title: document?.title ?? 'IA Veille',
      text: "Découvre cette veille IA intéressante",
      url: shareUrl,
    };

    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (navigator.share && isMobile) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Si l'utilisateur annule ou si le partage échoue, on essaie la copie classique
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showShareFeedback('Lien copié dans le presse-papiers !');
    } catch {
      showShareFeedback('Impossible de copier le lien.');
    }
  };

  return (
    <section className="pt-20 md:pt-24 pb-0 mt-0">
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      <div className="w-full px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 max-w-7xl mx-auto items-center">
          <div className="md:col-span-5 lg:col-span-4 lg:col-start-3 flex flex-col items-center md:items-end">
            {!videoUnavailable ? (
              <div
                ref={videoContainerRef}
                className="hero-video relative w-full min-h-[320px] sm:min-h-[480px] overflow-hidden rounded-none sm:rounded-3xl shadow-2xl transition-opacity duration-300"
                style={{
                  height: heroHeight ? `${heroHeight}px` : undefined,
                  width: heroWidth ? `${heroWidth}px` : undefined,
                  opacity: isTransitioning ? 0.5 : 1, // Visual feedback for transition
                }}
                data-hero-height={heroHeight ?? undefined}
              >
                {(currentVideo.news.imageSrc || currentVideo.news.title) && (
                  <div className="pointer-events-auto absolute left-4 right-4 top-4 flex items-center gap-3 rounded-2xl bg-white/85 px-4 py-2 text-left shadow-xl backdrop-blur z-10">
                    {currentVideo.news.imageSrc && (
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-gray-200 shrink-0">
                        <Image
                          src={currentVideo.news.imageSrc}
                          alt={currentVideo.news.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    {currentVideo.news.title && (
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                        {currentVideo.news.title}
                      </p>
                    )}
                  </div>
                )}
                <video
                  ref={videoRef}
                  className="video-js vjs-default-skin vjs-fill block w-full h-full"
                  poster={currentVideo.poster}
                  playsInline
                >
                  <source src={currentVideo.src} type="video/mp4" />
                  Votre navigateur ne supporte pas la vidéo HTML5.
                </video>
                <div className="pointer-events-none absolute inset-x-2 bottom-16 flex flex-wrap items-end justify-center gap-2">
                  <button
                    onClick={() => handleInteraction('watch_later')}
                    className="pointer-events-auto flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-900 shadow-lg backdrop-blur transition hover:bg-white"
                  >
                    <span aria-hidden="true">⏱️</span>
                    <span className="whitespace-nowrap">Regarder plus tard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInteraction('share')}
                    className="pointer-events-auto flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-900 shadow-lg backdrop-blur transition hover:bg-white"
                  >
                    <span aria-hidden="true">🔗</span>
                    <span className="whitespace-nowrap">Partager</span>
                  </button>
                  <button
                    onClick={() => handleInteraction('like')}
                    className="pointer-events-auto flex items-center justify-center gap-1.5 rounded-full bg-indigo-600/90 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:bg-indigo-600"
                  >
                    <span aria-hidden="true">❤️</span>
                    <span className="whitespace-nowrap">J&apos;aime</span>
                  </button>
                  {shareFeedback && (
                    <p
                      aria-live="polite"
                      className="pointer-events-none w-full text-center text-xs font-semibold text-white drop-shadow-sm"
                    >
                      {shareFeedback}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full h-[calc(100dvh-4rem)] sm:h-auto flex flex-col items-center justify-center bg-gray-900 text-gray-200 px-6 text-sm rounded-none sm:rounded-3xl">
                <p className="font-semibold mb-2">Vidéo manquante</p>
                <p>
                  Ajoutez votre démo 9:16 dans <code>public/video/video pour appli.mp4</code> (poster optionnel :
                  hero-phone-poster.jpg).
                </p>
              </div>
            )}
          </div>

          <div className="md:col-span-7 lg:col-span-6 text-left mt-8 md:mt-0">
            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white flex items-center gap-3">
              <span className="bg-indigo-600 w-2 h-8 rounded-full block"></span>
              News du jour
            </h2>
            <div className="space-y-4 max-w-2xl">
              {NEWS_ITEMS.map((item, index) => (
                <a key={index} href={item.url} className="block p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 group hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                    <span className="text-gray-400 group-hover:text-indigo-600 transition-colors">→</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
