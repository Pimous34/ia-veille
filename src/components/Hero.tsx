'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
const HERO_VIDEO_SRC = '/video/video%20pour%20appli.mp4';
const HERO_VIDEO_POSTER = '/videos/hero-phone-poster.jpg';
const HERO_NEWS = {
  imageSrc: '/images/news-placeholder.jpg',
  title: "Google lance sa meilleure IA : ce qu'il faut retenir",
};

const Hero = () => {
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [heroHeight, setHeroHeight] = useState<number | null>(null);
  const [heroWidth, setHeroWidth] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);
  const autoScrollTriggered = useRef(false);
  const shareFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

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
    if (!videoRef.current) return;

    const player = videojs(videoRef.current, {
      controls: true,
      autoplay: true,
      muted: true,
      loop: false,
      preload: 'auto',
      fill: true,
    });

    playerRef.current = player;

    player.on('error', () => setVideoUnavailable(true));

    return () => {
      player.dispose();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleWheel = (event: WheelEvent) => {
      if (autoScrollTriggered.current) return;
      if (event.deltaY <= 0) return;
      if (window.scrollY > 16) return;

      const target = document.getElementById('dernier-article');
      if (!target) return;

      autoScrollTriggered.current = true;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const NAV_OFFSET_MOBILE = 48; // ≈3rem navbar
    const NAV_OFFSET_DESKTOP = 96; // ≈6rem (nav + breathing room)
    const DESKTOP_MARGIN = 128; // keep some space left/right on desktop
    const ASPECT_RATIO = 9 / 16; // video native ratio (w/h)

    const updateHeroHeight = () => {
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const isMobile = window.innerWidth < 640;
      const offset = isMobile ? NAV_OFFSET_MOBILE : NAV_OFFSET_DESKTOP;
      const minHeight = isMobile ? 320 : 480;
      const height = Math.max(viewportHeight - offset, minHeight);
      setHeroHeight(height);

      if (isMobile) {
        setHeroWidth(null);
      } else {
        const widthFromHeight = height * ASPECT_RATIO;
        const maxWidth = Math.max(window.innerWidth - DESKTOP_MARGIN, 320);
        setHeroWidth(Math.min(widthFromHeight, maxWidth));
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
      <div className="w-full px-4 md:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-full max-w-6xl md:max-w-none md:mx-auto">
            {!videoUnavailable ? (
              <div
                className="hero-video relative w-full min-h-[320px] sm:min-h-[480px] overflow-hidden rounded-none sm:rounded-3xl shadow-2xl mx-auto"
                style={{
                  height: heroHeight ? `${heroHeight}px` : undefined,
                  width: heroWidth ? `${heroWidth}px` : undefined,
                }}
                data-hero-height={heroHeight ?? undefined}
              >
                {(HERO_NEWS.imageSrc || HERO_NEWS.title) && (
                  <div className="pointer-events-auto absolute left-4 right-4 top-4 flex items-center gap-3 rounded-2xl bg-white/85 px-4 py-2 text-left shadow-xl backdrop-blur">
                    {HERO_NEWS.imageSrc && (
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-gray-200">
                        <Image
                          src={HERO_NEWS.imageSrc}
                          alt={HERO_NEWS.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    {HERO_NEWS.title && (
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                        {HERO_NEWS.title}
                      </p>
                    )}
                  </div>
                )}
                <video
                  ref={videoRef}
                  className="video-js vjs-default-skin vjs-fill block w-full h-full"
                  poster={HERO_VIDEO_POSTER}
                  playsInline
                >
                  <source src={HERO_VIDEO_SRC} type="video/mp4" />
                  Votre navigateur ne supporte pas la vidéo HTML5.
                </video>
                <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    className="pointer-events-auto flex items-center justify-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-gray-900 shadow-lg backdrop-blur transition hover:bg-white"
                  >
                    <span aria-hidden="true">⏱️</span>
                    Regarder plus tard
                  </button>
                  <button
                    type="button"
                    onClick={handleShareClick}
                    className="pointer-events-auto flex items-center justify-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-gray-900 shadow-lg backdrop-blur transition hover:bg-white"
                  >
                    <span aria-hidden="true">🔗</span>
                    Partager
                  </button>
                  <button
                    className="pointer-events-auto flex items-center justify-center gap-2 rounded-full bg-indigo-600/90 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:bg-indigo-600"
                  >
                    <span aria-hidden="true">❤️</span>
                    J&apos;aime
                  </button>
                  {shareFeedback && (
                    <p
                      aria-live="polite"
                      className="pointer-events-none self-end text-xs font-semibold text-white drop-shadow-sm"
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

        </div>
      </div>
    </section>
  );
};

export default Hero;
