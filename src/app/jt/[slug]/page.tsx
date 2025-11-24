'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

export default function JTWatchPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (videoRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        autoplay: false,
        preload: 'auto',
        fluid: true,
        sources: [{
          src: '/video/video%20pour%20appli.mp4',
          type: 'video/mp4'
        }]
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black">
      <Navbar />
      
      {/* Section 1: Video / JT */}
      <section className="h-screen w-full snap-start relative flex items-center justify-center bg-gray-900 pt-16">
        <div className="w-full max-w-6xl px-4 flex flex-col items-center">
          <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black relative z-10">
            <div data-vjs-player>
              <video ref={videoRef} className="video-js vjs-big-play-centered" />
            </div>
          </div>
          
          <div className="mt-8 text-white text-center animate-bounce cursor-pointer" onClick={() => {
            document.getElementById('article-section')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            <p className="text-sm font-medium uppercase tracking-widest mb-2">Lire l'article</p>
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
              Google lance sa meilleure IA : ce qu'il faut retenir
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
              Une avancée majeure dans le domaine de l'intelligence artificielle générative qui promet de révolutionner nos usages quotidiens.
            </p>
            
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            
            <h3>Les points clés</h3>
            <ul>
              <li>Performance accrue sur les tâches complexes</li>
              <li>Intégration multimodale native</li>
              <li>Disponibilité immédiate pour les développeurs</li>
            </ul>

            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
