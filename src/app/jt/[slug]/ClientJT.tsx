'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams } from 'next/navigation';
import Player from 'video.js/dist/types/player';

export default function ClientJT() {
  const params = useParams();
  const slug = params?.slug as string;
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  const jingleUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/jt-assets/assets/jingle.mp4`;

  useEffect(() => {
    async function fetchVideo() {
      if (!slug) return;
      
      console.log('Fetching video for date:', slug);
      const { data, error } = await supabase
        .from('daily_news_videos')
        .select('*')
        .eq('date', slug)
        .maybeSingle();

      if (error) {
        console.error('Error fetching video:', error);
        setLoading(false);
        return;
      }

      if (data && data.video_url) {
        console.log('Video found:', data.video_url);
        setVideoUrl(data.video_url);
      } else {
        console.log('No video found for this date');
      }
      setLoading(false);
    }

    fetchVideo();
  }, [slug, supabase]);

  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;

    // Initialize player only once
    if (!playerRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        autoplay: true,
        preload: 'auto',
        fluid: true,
        sources: [{
          src: jingleUrl,
          type: 'video/mp4'
        }]
      });

      // Handle playlist logic
      playerRef.current.on('ended', () => {
        const currentPlayer = playerRef.current;
        if (currentPlayer && currentPlayer.currentSrc() === jingleUrl) {
          console.log('Jingle ended, playing main video...');
          currentPlayer.src({ type: 'video/mp4', src: videoUrl });
          currentPlayer.play();
        }
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [videoUrl]);

  return (
    <div className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black">
      <Navbar />
      
      {/* Section 1: Video / JT */}
      <section className="h-screen w-full snap-start relative flex items-center justify-center bg-gray-900 pt-16">
        <div className="w-full max-w-6xl px-4 flex flex-col items-center">
          <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black relative z-10">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-white">
                Chargement du JT...
              </div>
            ) : videoUrl ? (
              <div data-vjs-player>
                <video ref={videoRef} className="video-js vjs-big-play-centered" />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                JT non disponible pour cette date.
              </div>
            )}
          </div>
          
          <div className="mt-8 text-white text-center animate-bounce cursor-pointer" onClick={() => {
            document.getElementById('article-section')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            <p className="text-sm font-medium uppercase tracking-widest mb-2">Lire l&apos;article</p>
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Section 2: Article */}
      <section id="article-section" className="min-h-screen w-full snap-start bg-white dark:bg-gray-900 py-24 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header: Title & Image */}
          <div className="mb-10 space-y-6">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              JT Quotidien - {slug}
            </h1>
            
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg">
              <Image 
                src="/images/news-placeholder.jpg" 
                alt="Article Cover" 
                fill 
                className="object-cover"
              />
            </div>
          </div>

          {/* Text Content (Champs de texte) */}
          <div className="prose dark:prose-invert lg:prose-xl max-w-none">
            <p className="lead text-xl text-gray-600 dark:text-gray-300 mb-6">
              Retrouvez les actualités essentielles de l&apos;intelligence artificielle sélectionnées pour vous.
            </p>
            
            <p>
              Ce JT est généré automatiquement par notre système d&apos;IA pour vous offrir un résumé concis et pertinent des dernières avancées technologiques.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
