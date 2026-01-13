'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // DEPRECATED
import { createClient } from '@/utils/supabase/client';
import { useParams } from 'next/navigation';
import Player from 'video.js/dist/types/player';

export default function ClientJT() {
  const params = useParams();
  const slug = params?.slug as string;
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // const supabase = createClientComponentClient();
  const [supabase] = useState(() => createClient());

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
        aspectRatio: '9:16', // Enforcing portrait ratio
        sources: [{
          src: videoUrl,
          type: 'video/mp4'
        }]
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
    <div className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-gray-50">
      <Navbar />
      
      {/* Section 1: Video / JT */}
      <section className="h-screen w-full snap-start relative flex items-center justify-center pt-16">
        <div className="w-full h-full flex flex-col items-center justify-center pb-20">
          <div className="w-full max-w-sm md:max-w-md aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl bg-black relative z-10 border border-gray-200">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-indigo-600 bg-white">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  <p>Chargement du JT...</p>
                </div>
              </div>
            ) : videoUrl ? (
              <div data-vjs-player className="w-full h-full">
                <video ref={videoRef} className="video-js vjs-big-play-centered w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 bg-white px-8 text-center">
                JT non disponible pour cette date.
              </div>
            )}
          </div>
          
          <div className="mt-6 text-indigo-600 text-center animate-bounce cursor-pointer absolute bottom-8 z-20 hover:text-indigo-800 transition-colors" onClick={() => {
            document.getElementById('article-section')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            <p className="text-sm font-bold uppercase tracking-widest mb-2 drop-shadow-sm">Lire l&apos;article</p>
            <svg className="w-6 h-6 mx-auto drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg hidden md:flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600">
              <div className="text-center p-8 text-white">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <div className="font-bold text-xl uppercase tracking-wider">Résumé de l&apos;actualité</div>
              </div>
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
