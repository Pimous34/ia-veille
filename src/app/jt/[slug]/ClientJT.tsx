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
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isArticleOpen, setIsArticleOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<any>(null);
  
  // const supabase = createClientComponentClient();
  const [supabase] = useState(() => createClient());

  // Refs for observers
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    async function fetchVideos() {
      if (!slug) return;
      
      console.log('Fetching videos starting from date:', slug);
      // Fetch current video and previous ones (older dates)
      const { data, error } = await supabase
        .from('daily_news_videos')
        .select('*')
        .lte('date', slug)
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching videos:', error);
      } else if (data) {
        setVideos(data);
        if (data.length > 0) {
            setCurrentVideo(data[0]);
        }
      }
      setLoading(false);
    }

    fetchVideos();
  }, [slug, supabase]);

  // Handle Scroll / URL update
  useEffect(() => {
    if (loading || videos.length === 0) return;

    observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const index = Number(entry.target.getAttribute('data-index'));
                const video = videos[index];
                if (video) {
                    setCurrentVideo(video);
                    // Update URL without reload if needed, or just track state
                    // window.history.replaceState(null, '', `/jt/${video.date}`);
                }
            }
        });
    }, { threshold: 0.6 });

    sectionsRef.current.forEach((section) => {
        if (section) observerRef.current?.observe(section);
    });

    return () => {
        observerRef.current?.disconnect();
    };
  }, [loading, videos]);


  return (
    <div className="h-screen w-full bg-gray-900 text-white overflow-y-scroll snap-y snap-mandatory scroll-smooth">
      <Navbar />

      {loading ? (
         <div className="h-screen w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
         </div>
      ) : (
        videos.map((video, index) => (
            <JTVideoSection 
                key={video.id} 
                video={video} 
                index={index}
                isActive={currentVideo?.id === video.id}
                onOpenArticle={() => setIsArticleOpen(true)}
                sectionRef={(el) => (sectionsRef.current[index] = el)}
            />
        ))
      )}

      {/* Article Modal */}
      {isArticleOpen && currentVideo && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end transition-opacity duration-300">
            <div className="w-full md:w-2/3 lg:w-1/2 h-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto transform transition-transform duration-300 animate-slide-in-right p-8 relative">
                <button 
                    onClick={() => setIsArticleOpen(false)}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 mt-8">JT du {currentVideo.date}</h1>
                
                {currentVideo.thumbnail_url && !currentVideo.thumbnail_url.endsWith('.mp4') && (
                     <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-8">
                        <Image src={currentVideo.thumbnail_url} alt={currentVideo.title} fill className="object-cover" />
                     </div>
                )}

                <div className="prose dark:prose-invert max-w-none">
                    <p className="lead text-xl text-gray-600 dark:text-gray-300">
                        {currentVideo.title || "Retrouvez les actualités essentielles de l'intelligence artificielle."}
                    </p>
                    <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-500 text-center italic">Transcription et détails générés automatiquement.</p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for individual Video Section
const JTVideoSection = ({ video, index, isActive, onOpenArticle, sectionRef }: { video: any, index: number, isActive: boolean, onOpenArticle: () => void, sectionRef: (el: HTMLElement | null) => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<Player | null>(null);

    // Init Player logic similar to before, but handled per section
    useEffect(() => {
        if (!videoRef.current || !isActive) return;

        if (!playerRef.current) {
            playerRef.current = videojs(videoRef.current, {
                controls: true,
                autoplay: false, // Don't auto-play all, strict control via isActive could be added
                preload: 'auto',
                fill: true,
                responsive: true,
                sources: [{ src: video.video_url, type: 'video/mp4' }]
            });
        }
        
        // Auto play if active
        if (isActive && playerRef.current) {
             playerRef.current.play()?.catch(() => console.log('Autoplay prevented'));
        } else if (!isActive && playerRef.current) {
             playerRef.current.pause();
        }

    }, [isActive, video.video_url]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, []);

    return (
      <section ref={sectionRef} data-index={index} className="h-screen w-full snap-start relative flex flex-col items-center justify-center bg-black border-b border-gray-800">
        <div className="w-full h-full max-w-6xl relative">
            <div data-vjs-player className="w-full h-full">
                <video ref={videoRef} className="video-js vjs-big-play-centered w-full h-full object-contain" />
            </div>
            
             <div className="absolute bottom-20 left-0 right-0 flex justify-center z-20 pointer-events-none">
                <div onClick={onOpenArticle} className="pointer-events-auto bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2 rounded-full cursor-pointer hover:bg-white/20 transition-all flex items-center gap-2 group">
                    <span className="font-bold text-sm tracking-widest uppercase">Lire l&apos;article</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </div>
            </div>
        </div>
      </section>
    );
}
