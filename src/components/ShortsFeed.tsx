'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useReadTracking } from '@/hooks/useReadTracking';

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

    // Read Tracking
    const { markAsRead, isRead, toggleLike, toggleBookmark, isLiked, isBookmarked, markAsSkipped, skippedIds, isLoaded: isTrackingLoaded } = useReadTracking();
    const [activeIndex, setActiveIndex] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const currentItemIdRef = useRef<string | number | null>(null);

    useEffect(() => {
        if (isTrackingLoaded) {
            fetchContent();
        }
    }, [isTrackingLoaded]);

    // Start tracking for the first item once items are loaded
    useEffect(() => {
        if (items.length > 0 && !loading) {
            startTracking(0);
        }
        return () => stopTracking();
    }, [items, loading]);

    const startTracking = (index: number) => {
        // Stop tracking previous item first (checks if it was skipped)
        stopTracking();

        if (!items[index]) return;

        console.log(`Starting read tracking for item index ${index} (ID: ${items[index]?.id})`);
        currentItemIdRef.current = items[index].id;
        startTimeRef.current = Date.now();

        timerRef.current = setTimeout(() => {
            if (items[index]) {
                console.log(`Marking item ${items[index].id} as read`);
                const item = items[index];
                markAsRead(item.id, {
                    title: item.title,
                    category: item.tags?.[0] || 'Short',
                    tags: item.tags,
                    duration: 1 // default duration 1 min or calculate?
                });
                // Clear timer ref so stopTracking knows it finished normally
                timerRef.current = null; 
            }
        }, 7000); // 7 seconds
    };

    const stopTracking = () => {
        // If timer is still running, it means we didn't reach 7 seconds
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;

            // Check how long we stayed
            if (startTimeRef.current && currentItemIdRef.current) {
                const duration = Date.now() - startTimeRef.current;
                if (duration < 7000) {
                    console.log(`Item ${currentItemIdRef.current} skipped (time: ${duration}ms)`);
                    markAsSkipped(currentItemIdRef.current);
                }
            }
        }
        
        startTimeRef.current = null;
        currentItemIdRef.current = null;
    };

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
                .select('id, title, excerpt, image_url, published_at, created_at, url, tags, source_id')
                .order('published_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error("❌ Content fetch error:", error);
                setLoading(false);
                return;
            }

            let mixedContent = rawContent || [];
            
            // Filter out skipped items based on loaded skiplist
            if (skippedIds && skippedIds.length > 0) {
                 mixedContent = mixedContent.filter(item => !skippedIds.includes(item.id.toString()));
            }

            // Handle Initial ID (Specific Article)
            if (initialId) {
                const exists = mixedContent.find(item => item.id.toString() === initialId);
                // Even if skipped, if specifically requested via ID, we show it? 
                // Logic: Yes, usually specific ID access overrides skip.
                if (!exists) {
                    // Fetch specific item if not in the random batch
                    const { data: specificItem } = await supabase
                        .from('articles')
                        .select('id, title, excerpt, image_url, published_at, created_at, url, tags, source_id')
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
                    description: item.excerpt || 'Pas de résumé disponible.',
                    imageUrl: imageUrl, // Pass raw (could be null/expired), component handles fallback
                    date: item.published_at || item.created_at,
                    source: isVideo ? 'YouTube' : getSafeHostname(item.url),
                    link: item.url,
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
        if (!containerRef.current) return;

        const scrollTop = containerRef.current.scrollTop;
        const itemHeight = containerRef.current.clientHeight;
        const newIndex = Math.round(scrollTop / itemHeight);

        if (newIndex !== activeIndex && newIndex >= 0 && newIndex < items.length) {
            setActiveIndex(newIndex);
            startTracking(newIndex);
        }
    };

    if (loading) {
        return <div className="h-screen w-full flex items-center justify-center text-white text-xl font-light tracking-wide animate-pulse">Chargement de votre flux...</div>;
    }

    return (
        <div
            ref={containerRef}
            className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar bg-background text-foreground"
            onScroll={handleScroll}
            style={{ scrollSnapType: 'y mandatory' }}
        >
            {/* Close Button */}
            <button
                onClick={() => router.push('/')}
                className="fixed top-6 left-6 z-50 p-2 bg-background/40 backdrop-blur-md rounded-full text-foreground hover:bg-background/60 transition-colors border border-border"
                aria-label="Retour"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
            </button>

            {items.map((item, index) => (
                <div
                    key={`${item.type}-${item.id}-${index}`}
                    className="w-full h-screen snap-start relative flex items-start justify-center bg-background overflow-hidden pt-28"
                >


                    {/* Main Content Card */}
                    <div className="relative z-20 w-full max-w-2xl h-[80vh] bg-card rounded-3xl overflow-hidden shadow-2xl flex flex-col mx-4 animate-in fade-in duration-500 border border-border">

                        {/* Image or Video Section (Top 45%) */}
                        <div className="relative h-[45%] w-full bg-black">
                            {item.type === 'video' && extractYouTubeVideoId(item.link) ? (
                                index === activeIndex ? (
                                    <iframe
                                        src={`https://www.youtube.com/embed/${extractYouTubeVideoId(item.link)}?autoplay=1&mute=0&controls=1&modestbranding=1&rel=0&iv_load_policy=3&fs=1`}
                                        title={item.title}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    <div className="relative w-full h-full">
                                        <SafeShortImage
                                            src={item.imageUrl}
                                            title={item.title}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Play Icon Overlay for inactive slides */}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/30">
                                                <svg width="40" height="40" viewBox="0 0 24 24" fill="white" className="ml-2 drop-shadow-md">
                                                    <path d="M5 3l14 9-14 9V3z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <SafeShortImage
                                    src={item.imageUrl}
                                    title={item.title}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                />
                            )}

                            {/* Action Buttons (Top Right) */}
                            <div className="absolute top-4 right-4 flex flex-col gap-3 z-30">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleLike(item.id); }}
                                    className={`p-2.5 rounded-full backdrop-blur-md shadow-lg transition-all duration-200 active:scale-90 ${isLiked(item.id) ? 'bg-pink-500 text-white' : 'bg-black/40 text-white hover:bg-black/60 border border-white/20'}`}
                                    title={isLiked(item.id) ? "Retirer des favoris" : "J'aime"}
                                >
                                    <svg viewBox="0 0 24 24" fill={isLiked(item.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                    </svg>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleBookmark(item.id); }}
                                    className={`p-2.5 rounded-full backdrop-blur-md shadow-lg transition-all duration-200 active:scale-90 ${isBookmarked(item.id) ? 'bg-blue-600 text-white' : 'bg-black/40 text-white hover:bg-black/60 border border-white/20'}`}
                                    title={isBookmarked(item.id) ? "Retirer de la liste" : "À regarder plus tard"}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isBookmarked(item.id) ? "2.5" : "2"} className="w-6 h-6">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                </button>
                            </div>

                            <div className="absolute top-4 left-4 flex gap-2 z-10 flex-col">
                                <div className="flex gap-2">
                                    {item.type === 'video' ? (
                                        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                                            Vidéo
                                        </span>
                                    ) : (
                                        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                            Article
                                        </span>
                                    )}
                                </div>
                                {isRead(item.id) && (
                                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm w-fit animate-in fade-in zoom-in duration-300 flex items-center gap-1">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        Lu
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Text Content Logic (Bottom) */}
                        <div className="flex-1 p-8 flex flex-col relative bg-card text-card-foreground">
                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {(item.tags || []).slice(0, 3).map(tag => (
                                    <span key={tag} className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-md uppercase">
                                        #{tag}
                                    </span>
                                ))}
                            </div>

                            {/* Title */}
                            <h2 className="text-2xl font-bold text-card-foreground leading-tight mb-4 line-clamp-3">
                                {item.title}
                            </h2>

                            {/* Description / Excerpt */}
                            <div className="text-lg text-muted-foreground mb-6 overflow-y-auto max-h-[200px] leading-relaxed pr-2">
                                {item.description}
                            </div>

                            {/* Footer Actions */}
                            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                    {item.source} • {new Date(item.date).toLocaleDateString()}
                                </span>

                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-transform active:scale-95 flex items-center gap-2"
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
