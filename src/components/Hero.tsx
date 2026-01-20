'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import { createClient } from '@/lib/supabase/client';
import LoginModal from './LoginModal';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';



interface DailyNewsVideo {
  id: string;
  date: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  article_ids: string[];
}

interface PlaylistItem {
  src: string;
  poster: string;
  news: {
    imageSrc: string;
    title: string;
  };
}



const Hero = () => {
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [heroHeight, setHeroHeight] = useState<number | null>(null);
  const [heroWidth, setHeroWidth] = useState<number | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { user } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [newsItems, setNewsItems] = useState<Array<{ title: string; url: string }>>([]);
  const [isLoadingJT, setIsLoadingJT] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const shareFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const supabase = createClient();

  const currentVideo = playlist.length > 0 ? playlist[currentVideoIndex] : null;

  const showShareFeedback = (message: string) => {
    setShareFeedback(message);
    if (shareFeedbackTimeout.current) {
      clearTimeout(shareFeedbackTimeout.current);
    }
    shareFeedbackTimeout.current = setTimeout(() => {
      setShareFeedback(null);
    }, 2500);
  };

  // Charger les JT depuis Supabase
  useEffect(() => {
    const loadDailyJT = async () => {
      try {
        setIsLoadingJT(true);

        // Récupérer les JT complétés, triés par date décroissante
        const { data: jts, error } = await supabase
          .from('daily_news_videos')
          .select('*')
          .eq('status', 'completed')
          .order('date', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Error loading JT videos:', error);
          return;
        }

        if (jts && jts.length > 0) {
          // Convertir les JT en format playlist
          const jtPlaylist: PlaylistItem[] = jts.map((jt: DailyNewsVideo) => ({
            src: jt.video_url,
            poster: (jt.thumbnail_url && jt.thumbnail_url.startsWith('http')) ? jt.thumbnail_url : '/videos/hero-phone-poster.jpg',
            news: {
              imageSrc: (jt.thumbnail_url && jt.thumbnail_url.startsWith('http')) ? jt.thumbnail_url : '/images/news-placeholder.jpg',
              title: jt.title,
            }
          }));

          setPlaylist(jtPlaylist);

          // Créer les news items pour la liste
          const news = jts.map((jt: DailyNewsVideo) => ({
            title: jt.title,
            url: `/jt/${jt.id}`,
          }));
          setNewsItems(news);
        }
      } catch (error) {
        console.error('Error in loadDailyJT:', error);
      } finally {
        setIsLoadingJT(false);
      }
    };

    loadDailyJT();
  }, [supabase]);



  const currentVideoRef = useRef(currentVideo);

  useEffect(() => {
    currentVideoRef.current = currentVideo;
  }, [currentVideo]);

  useEffect(() => {
    if (!videoRef.current) return;

    // Re-initialize player if needed or just update src
    if (!playerRef.current) {
      if (currentVideoRef.current && currentVideoRef.current.src) {
        const player = videojs(videoRef.current, {
          controls: true,
          autoplay: true,
          muted: true,
          loop: true, // Loop the main video directly
          preload: 'auto',
          fill: true,
          sources: [{ type: 'video/mp4', src: currentVideoRef.current.src }]
        });
        playerRef.current = player;

        player.on('error', () => {
          const error = player.error();
          console.error('Video player error:', error);
          setVideoUnavailable(true);
        });
      }
    }

    // When current video changes (e.g. scroll)
    const player = playerRef.current;
    if (player && currentVideoRef.current && currentVideoRef.current.src) {
      // Play Main Video directly
      player.src({ type: 'video/mp4', src: currentVideoRef.current.src });
      player.loop(true);
      player.play()?.catch(e => console.log('Autoplay prevented:', e));
    }

    return () => {
      // Don't dispose here to allow smooth transitions, dispose on unmount only
    };
  }, [currentVideoIndex, currentVideo?.src, playlist]);

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
      if (nextIndex >= 0 && nextIndex < playlist.length) {
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
  }, [currentVideoIndex, isTransitioning, playlist.length]);

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

  const handleInteraction = async (type: 'share' | 'like' | 'watch_later' | 'save') => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    if (type === 'share') {
      await handleShareClick();
    } else if (type === 'save' || type === 'watch_later') {
      // Save to database
      try {
        if (!currentVideo || currentVideoIndex >= playlist.length) {
          toast.error('Erreur: aucune vidéo sélectionnée');
          return;
        }

        // Get the current JT ID from newsItems
        const currentJT = newsItems[currentVideoIndex];
        if (!currentJT) {
          toast.error('Erreur: impossible de sauvegarder');
          return;
        }

        // Extract JT ID from URL (format: /jt/{id})
        const jtId = currentJT.url.split('/').pop();
        const status = type === 'save' ? 'saved' : 'watch_later';

        // Check if already saved
        const { data: existing } = await supabase
          .from('saved_articles')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('article_id', jtId)
          .single();

        if (existing) {
          // If same status, remove it
          if (existing.status === status) {
            const { error: deleteError } = await supabase
              .from('saved_articles')
              .delete()
              .eq('id', existing.id);

            if (deleteError) throw deleteError;

            toast.success(
              type === 'save' ? '❤️ JT retiré des favoris' : '🕐 JT retiré de "À regarder plus tard"',
              { duration: 2000 }
            );
          } else {
            // Update status if different
            const { error: updateError } = await supabase
              .from('saved_articles')
              .update({
                status,
                saved_at: new Date().toISOString()
              })
              .eq('id', existing.id);

            if (updateError) throw updateError;

            toast.success(
              type === 'save' ? '❤️ JT sauvegardé !' : '🕐 Ajouté à "À regarder plus tard" !',
              { duration: 2000 }
            );
          }
        } else {
          // Insert new saved article
          const { error: insertError } = await supabase
            .from('saved_articles')
            .insert({
              user_id: user.id,
              article_id: jtId,
              status,
              saved_at: new Date().toISOString()
            });

          if (insertError) throw insertError;

          toast.success(
            type === 'save' ? '❤️ JT sauvegardé !' : '🕐 Ajouté à "À regarder plus tard" !',
            { duration: 2000 }
          );
        }
      } catch (error) {
        console.error('Error saving article:', error);
        toast.error('Erreur lors de la sauvegarde');
      }
    } else if (type === 'like') {
      // Placeholder for like action
      console.log(`${type} clicked by user ${user.email}`);
      toast.success('Merci pour votre retour !', { duration: 2000 });
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

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <section className="pt-20 md:pt-24 pb-0 mt-0">
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
      <div className="w-full px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 max-w-7xl mx-auto items-center">
          <div className="md:col-span-5 lg:col-span-4 lg:col-start-2 flex flex-col items-center md:items-end">
            {!videoUnavailable && currentVideo ? (
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
                  {/* Source is handled by videojs init */}
                  Votre navigateur ne supporte pas la vidéo HTML5.
                </video>
                <div className="pointer-events-none absolute inset-x-2 bottom-16 flex flex-wrap items-end justify-center gap-2">
                  <button
                    onClick={() => handleInteraction('save')}
                    className="pointer-events-auto flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-900 shadow-lg backdrop-blur transition hover:bg-pink-500 hover:text-white"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-4 h-4"
                      aria-hidden="true"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span className="whitespace-nowrap">Sauvegarder</span>
                  </button>
                  <button
                    onClick={() => handleInteraction('watch_later')}
                    className="pointer-events-auto flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-900 shadow-lg backdrop-blur transition hover:bg-pink-500 hover:text-white"
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
                {isLoadingJT ? (
                  <p className="font-semibold mb-2">Chargement du JT...</p>
                ) : (
                  <>
                    <p className="font-semibold mb-2">Aucun JT disponible</p>
                    <p>Revenez plus tard pour les actualités du jour.</p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-7 lg:col-span-6 text-left mt-8 md:mt-0">
            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white flex items-center gap-3">
              <span className="bg-indigo-600 w-2 h-8 rounded-full block"></span>
              News du jour
            </h2>
            <div className="space-y-4 max-w-2xl">
              {isLoadingJT ? (
                <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400">Chargement des JT quotidiens...</p>
                </div>
              ) : newsItems.length > 0 ? (
                newsItems.map((item, index) => (
                  <a key={index} href={item.url} className="block p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 group hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                      <span className="text-gray-400 group-hover:text-indigo-600 transition-colors">→</span>
                    </div>
                  </a>
                ))
              ) : (
                <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400">Aucun JT disponible pour le moment.</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Les JT quotidiens seront générés automatiquement chaque jour à 18h UTC.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
