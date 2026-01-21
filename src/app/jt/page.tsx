import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import Image from 'next/image';

interface DailyNewsVideo {
  id: string;
  date: string;
  title: string;
  video_url: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  article_ids: string[];
  view_count: number;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function getSlugFromDate(date: string): string {
  return date.split('T')[0];
}

export const dynamic = 'force-dynamic';

export default async function JTListPage() {
  const supabase = await createClient();
  let videos: DailyNewsVideo[] = [];
  let error = null;

  try {
    const { data, error: fetchError } = await supabase
      .from('daily_news_videos')
      .select('id, date, title, thumbnail_url, video_url, duration, view_count, article_ids, status')
      .eq('status', 'completed')
      .order('date', { ascending: false })
      .limit(20);

    if (fetchError) throw fetchError;
    videos = data || [];
  } catch (err) {
    console.error('Error loading videos:', err);
    error = 'Impossible de charger les JT';
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-48 pb-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 section-title">
            Les JT news de l&apos;IA
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Retrouvez tous les épisodes de notre JT quotidien pour ne rien manquer de l&apos;actualité de l&apos;intelligence artificielle.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {!error && videos.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <p className="text-blue-800 text-lg">
              Aucun JT disponible pour le moment. Le premier JT sera généré automatiquement ce soir à 18h.
            </p>
          </div>
        )}

        {videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video) => (
              <Link 
                key={video.id} 
                href={`/jt/${getSlugFromDate(video.date)}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-white/50"
              >
                <div className="relative aspect-[9/16] w-full overflow-hidden bg-gray-900 border-b border-gray-100/10">
                  {video.thumbnail_url && !video.thumbnail_url.endsWith('.mp4') ? (
                    <Image
                      src={video.thumbnail_url}
                      alt={video.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (video.video_url || (video.thumbnail_url && video.thumbnail_url.endsWith('.mp4'))) ? (
                     <video
                      src={video.thumbnail_url?.endsWith('.mp4') ? video.thumbnail_url : `${video.video_url}#t=0.1`}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                      preload="metadata"
                      muted
                      playsInline
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-6 text-center">
                      <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                        <svg className="w-10 h-10 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-white/60 text-sm font-medium tracking-wider uppercase">JT Quotidien</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:via-black/40 transition-all duration-300" />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-75 group-hover:scale-100">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30 shadow-2xl">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded-md">
                    {formatDuration(video.duration)}
                  </div>

                  <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md uppercase shadow-lg">
                    News du Jour
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-indigo-600 uppercase tracking-wide">
                      {formatDate(video.date)}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {video.view_count}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {video.title}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-gray-500 border-t border-gray-100 pt-4 mt-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    {video.article_ids.length} sujets traités
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
