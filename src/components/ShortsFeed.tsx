'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

// --- Types ---
interface ShortItem {
  id: string | number;
  type: 'article' | 'video';
  title: string;
  description?: string; // resume_ia, excerpt, etc.
  imageUrl: string;
  date: string;
  source?: string;
  link: string;
  tags: string[];
  originalData?: any; // Keep original data for actions like save
}

// --- Helper: Deterministic Image ---
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
];

function getDeterministicImage(inputString: string) {
    let hash = 0;
    for (let i = 0; i < inputString.length; i++) {
        hash = inputString.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % globalFallbackImages.length;
    return globalFallbackImages[index];
}

function extractYouTubeVideoId(url: string) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// --- Helper Component: Safe Image ---
const SafeShortImage = ({ src, alt, title, className, isBackground = false }: { src: string, alt: string, title: string, className?: string, isBackground?: boolean }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setImgSrc(src); // Reset if src prop changes
        setHasError(false);
    }, [src]);

    const handleError = () => {
        if (!hasError) {
            setHasError(true);
            setImgSrc(getDeterministicImage(title));
        }
    };

    if (isBackground && hasError) return null; // Logic from original: hide bg if fail

    return (
        <img 
            src={imgSrc || getDeterministicImage(title)} 
            alt={alt} 
            className={className} 
            onError={handleError}
        />
    );
};

// --- Main Component ---
export default function ShortsFeed() {
    const [items, setItems] = useState<ShortItem[]>([]);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialId = searchParams.get('id');
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        fetchContent();
    }, []);

    // Helper for safe URL
    const getSafeHostname = (url: string) => {
        if (!url) return 'Source inconnue';
        try {
            return new URL(url).hostname;
        } catch {
            return 'OREEGAM\'IA';
        }
    };

    const fetchContent = async () => {
        setLoading(true);
        console.log("🚀 Starting Shorts fetch (Articles + Ext Videos)...");

        try {
            // 1. Identify Video Sources
            const videoSourceNames = ['Micode', 'Underscore_', 'Ludovic Salenne', 'GEEK CONCEPT'];
            const { data: videoSources } = await supabase
                .from('sources')
                .select('id')
                .in('name', videoSourceNames);
            
            const videoSourceIds = videoSources?.map(s => s.id) || [];

            // 2. Fetch Content
            const { data: rawContent, error } = await supabase
                .from('articles')
                .select('*')
                .order('published_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error("❌ Content fetch error:", error);
                setLoading(false);
                return;
            }

            let mixedContent = rawContent || [];

            // Handle Initial ID (Specific Article)
            if (initialId) {
                 const exists = mixedContent.find(item => item.id.toString() === initialId);
                 if (!exists) {
                     // Fetch specific item if not in the random batch
                     const { data: specificItem } = await supabase
                        .from('articles')
                        .select('*')
                        .eq('id', initialId)
                        .single();
                     
                     if (specificItem) {
                         mixedContent = [specificItem, ...mixedContent];
                     }
                 }
            }

            // 3. Separate & Verify Items
            const formattedItems: ShortItem[] = mixedContent.map(item => {
                const isVideo = videoSourceIds.includes(item.source_id);
                
                // For videos, try to get a better high-res thumb
                let imageUrl = item.image_url;
                if (isVideo && item.url) {
                    const vidId = extractYouTubeVideoId(item.url);
                    if (vidId) {
                        imageUrl = `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`;
                    }
                }

                return {
                    id: item.id,
                    type: isVideo ? 'video' : 'article',
                    title: item.title,
                    description: item.resume_ia || item.excerpt || 'Pas de résumé disponible.',
                    imageUrl: imageUrl, // Pass raw (could be null/expired), component handles fallback
                    date: item.published_at || item.created_at,
                    source: isVideo ? 'YouTube' : getSafeHostname(item.url),
                    link: item.url || item.link,
                    tags: item.tags || [],
                    originalData: item
                };
            });

            // Shuffle logic with Initial ID priority
            const otherItems = formattedItems.filter(i => i.id.toString() !== initialId);
            const firstItem = formattedItems.find(i => i.id.toString() === initialId);

            // Shuffle others
            otherItems.sort(() => Math.random() - 0.5);

            // Construct final list
            const finalItems = firstItem ? [firstItem, ...otherItems] : otherItems;
            
            setItems(finalItems);

        } catch (error) {
            console.error('Error in fetchContent:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScroll = () => {
        // Scroll logic placeholder
    };

    if (loading) {
        return <div className="h-screen w-full flex items-center justify-center text-white text-xl font-light tracking-wide animate-pulse">Chargement de votre flux...</div>;
    }

    return (
        <div 
            ref={containerRef}
            className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
            onScroll={handleScroll}
            style={{ scrollSnapType: 'y mandatory' }}
        >
            {/* Close Button */}
            <button 
                onClick={() => router.push('/')}
                className="fixed top-6 left-6 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
                aria-label="Retour"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
            </button>

            {items.map((item, index) => (
                <div 
                    key={`${item.type}-${item.id}-${index}`} 
                    className="w-full h-screen snap-start relative flex items-center justify-center bg-gray-900 overflow-hidden"
                >
                    {/* Background Image (Blurred) */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-black/60 z-10" />
                        <SafeShortImage
                            src={item.imageUrl}
                            title={item.title}
                            alt="Background"
                            className="w-full h-full object-cover opacity-50 blur-xl scale-110"
                            isBackground={true}
                        />
                    </div>

                    {/* Main Content Card */}
                    <div className="relative z-20 w-full max-w-md h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col mx-4 my-auto animate-in fade-in duration-500">
                        
                        {/* Image or Video Section (Top 45%) */}
                        <div className="relative h-[45%] w-full bg-black">
                            {item.type === 'video' && extractYouTubeVideoId(item.link) ? (
                                <iframe
                                    src={`https://www.youtube.com/embed/${extractYouTubeVideoId(item.link)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${extractYouTubeVideoId(item.link)}&modestbranding=1&rel=0&iv_load_policy=3&fs=0`}
                                    title={item.title}
                                    className="w-full h-full pointer-events-none" // pointer-events-none to prevent stealing scroll interaction, remove if user wants to click video
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <SafeShortImage 
                                    src={item.imageUrl} 
                                    title={item.title}
                                    alt={item.title} 
                                    className="w-full h-full object-cover"
                                />
                            )}
                            
                            {/* Type Badge (Visible mainly on articles now, or overlay on video) */}
                            <div className="absolute top-4 left-4 flex gap-2 z-10">
                                {item.type === 'video' ? (
                                    <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                                         <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                                         Vidéo
                                    </span>
                                ) : (
                                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                        Article
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Text Content Logic (Bottom) */}
                        <div className="flex-1 p-6 flex flex-col relative bg-white">
                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {(item.tags || []).slice(0, 3).map(tag => (
                                    <span key={tag} className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md uppercase">
                                        #{tag}
                                    </span>
                                ))}
                            </div>

                            {/* Title */}
                            <h2 className="text-xl font-bold text-gray-900 leading-tight mb-3 line-clamp-3">
                                {item.title}
                            </h2>

                            {/* Description / Excerpt */}
                            <div className="text-sm text-gray-600 mb-6 overflow-y-auto max-h-[150px] leading-relaxed pr-2">
                                {item.description}
                            </div>

                            {/* Footer Actions */}
                            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                    {item.source} • {new Date(item.date).toLocaleDateString()}
                                </span>

                                <a 
                                    href={item.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bg-black text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-800 transition-transform active:scale-95 flex items-center gap-2"
                                >
                                    {item.type === 'video' ? 'Regarder' : 'Lire'}
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
