'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import Chatbot from '@/components/Chatbot';
import Footer from '@/components/Footer';


// import Navbar from '@/components/Navbar'; // Removed to avoid duplication with Layout
import { useRouter, useSearchParams } from 'next/navigation';
import { useReadTracking } from '@/hooks/useReadTracking';
import { useAuth } from '@/contexts/AuthContext';
import { widgetsDb } from '@/lib/widgets-firebase';
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, Loader2 } from 'lucide-react';

// --- Types ---

interface Article {
    id: number | string;
    title: string;
    excerpt?: string;
    category?: string;
    tags?: string[];
    date: string;
    link?: string;
    image: string;
    score?: number;
}

interface Tutorial {
    id: number;
    software: string;
    channel_name: string;
    url: string;
    image_url: string;
}

interface JtVideo {
    id: number | string;
    video_url: string;
    thumbnail_url?: string;
    title?: string;
    date: string;
    article_ids?: number[];
    script?: string;
}

interface NextCourse {
    title: string;
    location: string;
    instructor?: string;
    meetLink?: string;
    date: string;
}

// --- Constants & Helpers ---
// Removed unused categoryTags

const globalFallbackImages = [
    "/images/placeholders/placeholder_0.jpg",
    "/images/placeholders/placeholder_1.jpg",
    "/images/placeholders/placeholder_3.jpg",
    "/images/placeholders/placeholder_4.jpg",
    "/images/placeholders/placeholder_5.jpg",
    "/images/placeholders/placeholder_6.jpg",
    "/images/placeholders/placeholder_8.jpg",
    "/images/placeholders/placeholder_9.jpg",
    "/images/placeholders/placeholder_11.jpg",
    "/images/placeholders/placeholder_12.jpg"
];

function getDeterministicImage(inputString: string) {
    if (!inputString) return globalFallbackImages[0];
    let hash = 0;
    for (let i = 0; i < inputString.length; i++) {
        hash = inputString.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % globalFallbackImages.length;
    return globalFallbackImages[index];
}

function formatDate(dateString: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

function getJtDateLabel(dateString: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    // Reset hours to compare dates only
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) return "Aujourd'hui";
    if (date.getTime() === yesterday.getTime()) return "Hier";

    return `JT du ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;
}

// --- Hardcoded Fallback Data ---
const fallbackJtArticles: Article[] = [
    {
        id: 1,
        title: "L'IA générative révolutionne le développement d'applications",
        excerpt: "Découvrez comment les outils d'IA générative transforment la façon dont nous créons des applications.",
        category: "IA",
        tags: ["ChatGPT", "Claude"],
        date: "2024-01-15",
        link: "#",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800"
    },
    {
        id: 2,
        title: "No-Code : La démocratisation de la création digitale",
        excerpt: "Les plateformes No-Code permettent désormais à tous de créer des applications professionnelles.",
        category: "No-Code",
        tags: ["Bubble", "Webflow"],
        date: "2024-01-14",
        link: "#",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800"
    },
    {
        id: 3,
        title: "ChatGPT et les assistants IA : Nouveaux outils de productivité",
        excerpt: "Comment les assistants IA comme ChatGPT changent la productivité.",
        category: "IA",
        tags: ["ChatGPT"],
        date: "2024-01-13",
        link: "#",
        image: "https://images.unsplash.com/photo-1676299080923-6c98c0cf4e48?w=800"
    }
];

const fallbackCoursePrepArticles: Article[] = [
    {
        id: 8,
        title: "Les fondamentaux de l'IA pour débutants",
        excerpt: "Comprendre les bases de l'intelligence artificielle avant de plonger dans les outils avancés.",
        category: "IA",
        tags: ["ChatGPT", "Gemini"],
        date: "2024-01-17",
        link: "#",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800"
    },
    {
        id: 9,
        title: "Premiers pas avec les prompts efficaces",
        excerpt: "Apprenez à formuler des prompts qui donnent des résultats précis et pertinents.",
        category: "IA",
        tags: ["ChatGPT", "Claude"],
        date: "2024-01-17",
        link: "#",
        image: "https://images.unsplash.com/photo-1676299080923-6c98c0cf4e48?w=800"
    },
    {
        id: 10,
        title: "Introduction aux outils No-Code",
        excerpt: "Découvrez les plateformes No-Code les plus populaires et leurs cas d'usage.",
        category: "No-Code",
        tags: ["Bubble", "Webflow"],
        date: "2024-01-16",
        link: "#",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800"
    }
];

// --- Helper Components ---

interface SafeImageProps {
    src: string;
    alt: string;
    className?: string;
    fallbackTitle: string;
    fill?: boolean;
    priority?: boolean;
}

const SafeImage = ({ src, alt, className, fallbackTitle, fill, priority = false }: SafeImageProps) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setImgSrc(src);
        setHasError(false);
    }, [src]);

    const handleError = () => {
        if (!hasError) {
            setImgSrc(getDeterministicImage(fallbackTitle));
            setHasError(true);
        }
    };

    return (
        <Image
            src={imgSrc || getDeterministicImage(fallbackTitle)}
            alt={alt}
            className={className}
            fill={fill}
            priority={priority}
            unoptimized
            onError={handleError}
        />
    );
};

const getYoutubeThumbnail = (url: string) => {
    if (!url) return null;
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (videoIdMatch && videoIdMatch[1]) {
        return `https://img.youtube.com/vi/${videoIdMatch[1]}/mqdefault.jpg`;
    }
    return null;
};



// --- Main Component ---
// --- Client Component ---
// --- Props Interface ---
interface HomeClientProps {
    initialJtVideos: JtVideo[];
    initialArticles: Article[];
    initialTutorials: Tutorial[];
    initialVideosColumn: JtVideo[];
}

// --- Client Component ---
export default function HomeClient({
    initialJtVideos,
    initialArticles,
    initialTutorials,
    initialVideosColumn
}: HomeClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isRead } = useReadTracking();
    const { supabase, user } = useAuth(); // Use shared client
    // Auth check moved to Server Component wrapper

    // UI State

    // UI State
    const [isFormatMenuOpen, setIsFormatMenuOpen] = useState(false);
    const [activeFormat, setActiveFormat] = useState<'video' | 'podcast' | 'text'>('video');
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Data State

    // Data State
    const [dataError, setDataError] = useState<string | null>(null);

    // Initialize directly from Props
    // const [jtVideosList, setJtVideosList] = useState<JtVideo[]>(initialJtVideos); // REMOVED DUPLICATE

    /* ---------------------- STATE ---------------------- */
    const [activeTab, setActiveTab] = useState('tous');
    const [trendingArticles, setTrendingArticles] = useState<Article[]>(initialArticles || []);
    const [coursePrepArticles, setCoursePrepArticles] = useState<Article[]>([]); // Assuming this needs separate logic or filter from articles
    const [tutorials, setTutorials] = useState<Tutorial[]>(initialTutorials || []);

    // JT & AI States
    const [isSearching, setIsSearching] = useState(false);
    const [isWaitingForAi, setIsWaitingForAi] = useState(false);
    const [searchResultArticles, setSearchResultArticles] = useState<Article[]>([]); // To display AI results (vignettes)
    const [searchQuery, setSearchQuery] = useState(''); // Renamed back from currentSearchQuery for consistency with existing code usage or refactoring
    const [searchResultSummary, setSearchResultSummary] = useState(''); // Text summary from AI

    // --- Restored AI Search Missing States ---
    const [searchAnswer, setSearchAnswer] = useState<Article | null>(null);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [loadingAiMessage, setLoadingAiMessage] = useState('Analyse en cours...');

    // New States for Videos and Next Course

    // New States for Videos and Next Course
    const [jtVideosList, setJtVideosList] = useState<JtVideo[]>(initialJtVideos || []); // Kept this one, initialized with props
    const [jtSubjects, setJtSubjects] = useState<Article[]>([]);
    const [isLoadingSubjects, setIsLoadingSubjects] = useState(false); // Restored missing state
    const [currentJtIndex, setCurrentJtIndex] = useState(0); // Index of currently playing JT in the list

    // Set initial video if available
    const [jtVideo, setJtVideo] = useState<JtVideo | null>(
        initialJtVideos && initialJtVideos.length > 0 ? initialJtVideos[0] : {
            id: 'fallback-1',
            video_url: '#',
            title: "JT IA (Démo)",
            date: new Date().toISOString(),
            thumbnail_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800"
        }
    );

    const [videosColumnList, setVideosColumnList] = useState<JtVideo[]>(initialVideosColumn || []); // List for right column (mixed)
    const [searchResultVideos, setSearchResultVideos] = useState<JtVideo[]>([]); // List for right column (search results)
    const [nextCourse, setNextCourse] = useState<NextCourse | null>(null);

    /* ---------------------- EFFECTS ---------------------- */

    // Fetch Next Course
    useEffect(() => {
        const fetchNextCourse = async () => {
            try {
                const response = await fetch('/api/next-course');
                if (response.ok) {
                    const data = await response.json();
                    if (data.found) {
                        setNextCourse(data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch next course", error);
            }
        };
        fetchNextCourse();
    }, []);

    const videoRef = useRef<HTMLVideoElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const isNavigatingRef = useRef(false);



    // Helper to close format menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as HTMLElement;
            if (!target.closest('.format-controls')) {
                setIsFormatMenuOpen(false);
            }
            if (!target.closest('.format-controls')) {
                setIsFormatMenuOpen(false);
            }
        }
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Fetch Data
    // Removed fetchData useEffect as data is now passed via props

    // Fetch JT Subjects whenever jtVideo changes
    useEffect(() => {
        async function fetchSubjects() {
            setIsLoadingSubjects(true);
            try {
                if (!jtVideo?.article_ids || jtVideo.article_ids.length === 0) {
                    setJtSubjects([]);
                    return;
                }

                const { data: articles, error } = await supabase
                    .from('articles')
                    .select('id, title, image_url, url, published_at')
                    .in('id', jtVideo.article_ids)
                    .limit(5);

                if (error) {
                    console.error("Error fetching subjects:", error);
                }

                if (articles) {
                    setJtSubjects(articles.map((a: { id: number; title: string; image_url: string; url: string; published_at: string }) => ({
                        id: a.id,
                        title: a.title,
                        image: a.image_url || getDeterministicImage(a.title),
                        link: a.url,
                        date: a.published_at,
                        category: 'JT'
                    })));
                }
            } catch (err) {
                console.error("Unexpected error fetching subjects:", err);
            } finally {
                setIsLoadingSubjects(false);
            }
        }
        fetchSubjects();

    }, [jtVideo, supabase, user]);




    // Added Logic: Sync URL 'q' with search state
    useEffect(() => {
        const query = searchParams.get('q');
        if (query && query !== searchQuery) {
            handleSearch(query);
        } else if (!query && searchQuery) {
            // Optional: clear search if URL param removed, or keep it. 
            // Letting it clear is safer for deep linking back to home.
            handleSearch('');
        }
    }, [searchParams]);

    // --- Search Logic ---
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query || query.length < 2) {
            setIsSearching(false);
            setSearchResultArticles([]);
            setSearchResultVideos([]);
            setSearchResultVideos([]);
            setSearchAnswer(null);
            setAiResponse(null);
            setIsWaitingForAi(false);
        } else {
            setIsSearching(true);
        }
    };

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!searchQuery || searchQuery.length < 2) return;

            try {
                // Search Articles (Title & Excerpt)
                const { data: articles } = await supabase
                    .from('articles')
                    .select('*')
                    .or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`)
                    .limit(10);

                // Search Videos (Title)
                const { data: videos } = await supabase
                    .from('daily_news_videos')
                    .select('*')
                    .ilike('title', `%${searchQuery}%`)
                    .limit(10);

                if (articles) {
                    const mappedArticles = articles.map((article: any) => ({
                        id: article.id,
                        title: article.title,
                        excerpt: (article.excerpt || '').replace(/<[^>]*>?/gm, ''),
                        category: 'Recherche',
                        tags: article.tags,
                        date: article.published_at,
                        link: article.url,
                        image: article.image_url || getDeterministicImage(article.title),
                    }));
                    setSearchResultArticles(mappedArticles);
                    setSearchAnswer(mappedArticles.length > 0 ? mappedArticles[0] : null);
                }

                if (videos) {
                    setSearchResultVideos(videos.map((v: any) => ({
                        ...v,
                        thumbnail_url: v.thumbnail_url || getDeterministicImage(v.title || 'Video')
                    })));
                }

            } catch (error) {
                console.error("Search error:", error);
            }

        };

        const fetchRealYoutubeVideos = async () => {
            if (!searchQuery || searchQuery.length < 2) return;
            try {
                const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(searchQuery)}`);
                const data = await res.json();

                if (data.videos && Array.isArray(data.videos)) {
                    const realVideos = data.videos.map((v: any) => ({
                        id: v.id,
                        video_url: v.url,
                        thumbnail_url: v.thumbnail,
                        title: v.title || `Vidéo YouTube : ${searchQuery}`, // Use real title if available
                        date: new Date().toISOString()
                    }));
                    // Set these as the primary video results
                    setSearchResultVideos(realVideos);
                }
            } catch (e) {
                console.error("Youtube API Error:", e);
            }
        };

        const generateAiResponse = async (promptText: string) => {
            setIsWaitingForAi(true);
            setAiResponse(null);
            setLoadingAiMessage(`Recherche sur : ${promptText}...`);

            const persona = `PERSONA: Tu es le Senior Mentor d'OREEGAMI.
Ton rôle est de transformer des concepts complexes en insights clairs.

CONTEXTE DOMAINE PRIORITAIRE :
Tu es un expert en Informatique, Intelligence Artificielle, Développement Logiciel et Tech.
Si un terme a plusieurs sens (ex: "Antigravity", "Eclipse", "Pipeline", "Virus"), TU DOIS TOUJOURS DONNER LA DÉFINITION LIÉE À LA TECH/LOGICIEL/IA.
Ignore les sens liés à la physique, la biologie ou la mécanique classique, sauf si l'utilisateur le précise explicitement.

CONNAISSANCES SPÉCIFIQUES (A UTILISER EN PRIORITÉ) :
- "Antigravity" : C'est le nouvel IDE agentique de Google Deepmind conçu pour le "Vibe Coding" (programmation fluide assistée par IA). Ce n'est PAS de la physique.

ATTENTION - FORMAT DE RÉPONSE STRICT:
Tu dois répondre en deux parties séparées par "---METADATA---".

PARTIE 1 : L'EXPLICATION (Markdown)
Structure :
- ## [TITRE]
- **L'essentiel :** (1 phrase)
- **Comment ça marche ?** (3 bullets)
- **L'œil de l'Expert :** (1 conseil)
(Ne mets pas de titre "PARTIE 1", commence direct).

---METADATA---
{
  "keywords": ["mot_cle_1", "mot_cle_2"]
}

CONSIGNES POUR METADATA :
- "keywords": Donne 2-3 termes de recherche (français ou anglais) pour trouver des articles techniques liés dans une base de données (ex: pour "prompts", mets ["Prompt Engineering", "LLM"]).
`;

            const context = `CONTEXTE: L'utilisateur veut comprendre : "${promptText}"`;
            const instructions = `TA MISSION: Explique le concept et fournis les métadonnées JSON à la fin.`;
            const prompt = `${persona}\n\n${context}\n\n${instructions}`;

            try {
                if (!widgetsDb) throw new Error("Firebase not initialized");

                const docRef = await addDoc(collection(widgetsDb, 'generate'), {
                    prompt: prompt,
                    status: 'PENDING',
                    createdAt: serverTimestamp(),
                    valid_artisan_context_bot_id: 'ia_veille_bot'
                });

                const unsubscribe = onSnapshot(docRef, async (doc) => {
                    const data = doc.data();
                    if (data && data.response) {
                        const fullResponse = data.response;

                        // Parsing Metadata
                        const parts = fullResponse.split('---METADATA---');
                        const displayText = parts[0].trim();
                        let metadata = { keywords: [] };

                        if (parts.length > 1) {
                            try {
                                // Clean potential markdown code blocks around JSON and extract the JSON object
                                let jsonStr = parts[1].trim();
                                // Remove markdown code block markers
                                jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '');
                                // Extract just the JSON object part (first { to last })
                                const firstBrace = jsonStr.indexOf('{');
                                const lastBrace = jsonStr.lastIndexOf('}');
                                if (firstBrace !== -1 && lastBrace !== -1) {
                                    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
                                }

                                metadata = JSON.parse(jsonStr);

                                console.log("AI Metadata extracted:", metadata);

                                // 1. Trigger Refined Search using Keywords
                                if (metadata.keywords && metadata.keywords.length > 0) {
                                    // Create a compound OR query for all keywords
                                    const keywordQuery = metadata.keywords.map((k: string) => `title.ilike.%${k}%,excerpt.ilike.%${k}%`).join(',');

                                    // Fetch Articles with AI Keywords
                                    const { data: aiArticles } = await supabase
                                        .from('articles')
                                        .select('*')
                                        .or(keywordQuery)
                                        .limit(5);

                                    if (aiArticles && aiArticles.length > 0) {
                                        const mappedAiArticles = aiArticles.map((article: any) => ({
                                            id: article.id,
                                            title: article.title,
                                            excerpt: (article.excerpt || '').replace(/<[^>]*>?/gm, ''),
                                            category: 'Suggéré par IA',
                                            tags: article.tags,
                                            date: article.published_at,
                                            link: article.url,
                                            image: article.image_url || getDeterministicImage(article.title),
                                        }));
                                        setSearchResultArticles(mappedAiArticles);
                                    }

                                    // Fetch Videos with AI Keywords (Internal DB)
                                    const videoKeywordQuery = metadata.keywords.map((k: string) => `title.ilike.%${k}%`).join(',');
                                    const { data: aiDbVideos } = await supabase
                                        .from('daily_news_videos')
                                        .select('*')
                                        .or(videoKeywordQuery)
                                        .limit(5);

                                    let newVideosList: JtVideo[] = [];

                                    // 2. Add AI suggested YouTube links (External)
                                    // DISABLED: We now use real YouTube Search API results
                                    /*
                                    if (metadata.youtube && Array.isArray(metadata.youtube)) {
                                       ...
                                    }
                                    */

                                    // 3. Fallback: Removed as we fetch real videos now

                                    if (aiDbVideos && aiDbVideos.length > 0) {
                                        const mappedDbVideos = aiDbVideos.map((v: any) => ({
                                            ...v,
                                            thumbnail_url: v.thumbnail_url || getDeterministicImage(v.title || 'Video')
                                        }));
                                        // Merge with existing results, avoiding duplicates if possible (simple append for now)
                                        setSearchResultVideos(prev => {
                                            const existingIds = new Set(prev.map(p => p.id));
                                            const uniqueNew = mappedDbVideos.filter((n: any) => !existingIds.has(n.id));
                                            return [...prev, ...uniqueNew];
                                        });
                                    }
                                }

                            } catch (e) {
                                console.error("Error parsing AI metadata:", e);
                            }
                        }

                        setAiResponse(displayText);
                        setIsWaitingForAi(false);
                        unsubscribe();
                    } else if (data && data.status && data.status.state === 'ERROR') {
                        setAiResponse("Désolé, je n'ai pas pu générer d'explication pour le moment.");
                        setIsWaitingForAi(false);
                        unsubscribe();
                    }
                });
            } catch (err) {
                console.error("AI Error:", err);
                setAiResponse("Erreur de connexion à l'assistant IA.");
                setIsWaitingForAi(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchSearchResults();
            fetchRealYoutubeVideos(); // Call real YouTube search
            if (searchQuery && searchQuery.length > 2) {
                generateAiResponse(searchQuery);
            }
        }, 800); // Debounce increased to 800ms for AI
        return () => clearTimeout(timeoutId);
    }, [searchQuery, supabase]);

    const handlePrevJt = () => {
        if (currentJtIndex < jtVideosList.length - 1) {
            isNavigatingRef.current = true;
            const newIndex = currentJtIndex + 1;
            setCurrentJtIndex(newIndex);
            setJtVideo(jtVideosList[newIndex]);
        }
    };

    const handleNextJt = () => {
        if (currentJtIndex > 0) {
            isNavigatingRef.current = true;
            const newIndex = currentJtIndex - 1;
            setCurrentJtIndex(newIndex);
            setJtVideo(jtVideosList[newIndex]);
        }
    };

    // Video Jingle Logic
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !jtVideo) return;

        const jingleUrl = '/video/Jingle.mp4';
        const mainVideoUrl = jtVideo.video_url;

        // Handle Unmute
        const handleUnmute = () => {
            if (video.muted) {
                video.muted = false;
            }
        }
        video.addEventListener('click', handleUnmute);

        // Jingle transition handler
        const handleEnded = () => {
            if (video.src.includes('Jingle.mp4')) {
                // Prevent setting src to '#' or invalid URL
                if (mainVideoUrl && mainVideoUrl !== '#' && mainVideoUrl.startsWith('http')) {
                    video.src = mainVideoUrl;
                    video.load();
                    video.play().catch(console.error);
                } else {
                    console.log("No valid video URL for playback, stopping.");
                    // Optionally set it to a placeholder video or just stop
                }
            }
        };

        if (isNavigatingRef.current) {
            // Check for YouTube Search URL (AI Fallback)
            if (mainVideoUrl && mainVideoUrl.includes('youtube.com/results')) {
                window.open(mainVideoUrl, '_blank');
                return; // Don't try to play this in the video tag
            }

            // Skip jingle if navigating
            if (mainVideoUrl && mainVideoUrl !== '#' && mainVideoUrl.startsWith('http')) {
                video.src = mainVideoUrl;
                video.muted = false; // Unmute for user-initiated navigation
                video.play().catch(console.error);
            }
            isNavigatingRef.current = false;
        } else {
            // Play jingle for initial load IF valid AND not already playing
            if (jingleUrl && !jingleUrl.endsWith('#')) {
                // Check if already playing Jingle to avoid interruption
                if (!video.src.includes('Jingle.mp4')) {
                    video.src = jingleUrl;
                    video.playsInline = true;
                    video.muted = true; // Start muted for autoplay

                    video.addEventListener('ended', handleEnded);

                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise.catch((e) => {
                            console.warn("Autoplay/Jingle prevented:", e);
                        });
                    }
                }
            } else if (mainVideoUrl && mainVideoUrl !== '#' && mainVideoUrl.startsWith('http')) {
                // Fallback direct play if jingle invalid but main video exists
                video.src = mainVideoUrl;
            }
        }

        return () => {
            if (video) {
                video.removeEventListener('ended', handleEnded);
                video.removeEventListener('click', handleUnmute);
            }
        };
    }, [jtVideo]);

    // Fullscreen Logic
    const toggleFullscreen = () => {
        if (!videoContainerRef.current) return;

        if (!document.fullscreenElement) {
            videoContainerRef.current.requestFullscreen().catch(console.error);
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };






    return (
        <>
            <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
                {/* <Navbar onSearch={handleSearch} /> */}

                <main className="main-content grow pt-20 !ml-0">
                    {/* Hero Section */}
                    <section className="hero-section" id="jtnews">
                        <div className="container mx-auto">
                            {dataError && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-center shadow-xs border border-red-100 flex items-center justify-center gap-2">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    <strong>Erreur :</strong> {dataError}
                                </div>
                            )}
                            <div className="hero-container">
                                {/* Search Results Mode for Hero */}
                                {isSearching && aiResponse ? (
                                    <div className="video-column border-2 border-dashed border-gray-800 rounded-2xl p-6 bg-black flex flex-col gap-4 max-h-[700px] overflow-hidden">
                                        {searchAnswer && (
                                            <div className="flex gap-4 items-center bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-800 mb-2">
                                                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                                                    <SafeImage
                                                        src={searchAnswer.image}
                                                        alt={searchAnswer.title}
                                                        fallbackTitle={searchAnswer.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    {isRead(searchAnswer.id) && (
                                                        <div className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-10 font-bold uppercase tracking-wide">
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                            Lu
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-white line-clamp-1">{searchAnswer.title}</h4>
                                                    <button
                                                        onClick={() => router.push(`/shorts?id=${searchAnswer.id}`)}
                                                        className="text-xs text-indigo-400 font-semibold hover:underline"
                                                    >
                                                        Lire l'article complet →
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 prose prose-sm prose-invert max-w-none">
                                            <div className="p-4 rounded-xl">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        h2: ({ node, ...props }) => <h2 className="text-xl font-black text-white mt-0 mb-4 pb-2 border-b-2 border-gray-700" {...props} />,
                                                        strong: ({ node, ...props }) => <strong className="font-black text-indigo-400" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="space-y-2 my-4 text-gray-300" {...props} />,
                                                        li: ({ node, ...props }) => <li className="flex gap-2 items-start" {...props} />,
                                                        p: ({ node, ...props }) => <p className="text-gray-300 leading-relaxed" {...props} />,
                                                    }}
                                                >
                                                    {aiResponse}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`video-column ${isFullscreen ? 'fullscreen' : ''}`} ref={videoContainerRef}>

                                        <div className="video-wrapper">
                                            <button className="fullscreen-btn" onClick={toggleFullscreen} aria-label="Plein écran">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d={isFullscreen ? "M4 14h6v6M10 14L3 21M20 10h-6V4M14 10l7-7" : "M15 3h6v6M21 3l-7 7M9 21H3v-6M3 21l7-7"} />
                                                </svg>
                                            </button>

                                            <div className="format-controls">
                                                <button className="format-btn" onClick={() => setIsFormatMenuOpen(!isFormatMenuOpen)}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path>
                                                        <path d="M12 8v8"></path>
                                                        <path d="M8 12h8"></path>
                                                    </svg>
                                                    Changer de format
                                                </button>
                                                <div className={`format-menu ${isFormatMenuOpen ? 'show' : ''}`} id="formatMenu">
                                                    <button className="format-option" onClick={() => { setActiveFormat('video'); setIsFormatMenuOpen(false); }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                                        </svg>
                                                        Vidéo
                                                    </button>
                                                    <button className="format-option" onClick={() => { setActiveFormat('podcast'); setIsFormatMenuOpen(false); }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                                            <line x1="12" y1="19" x2="12" y2="23"></line>
                                                            <line x1="8" y1="23" x2="16" y2="23"></line>
                                                        </svg>
                                                        Podcast
                                                    </button>
                                                    <button className="format-option" onClick={() => { setActiveFormat('text'); setIsFormatMenuOpen(false); }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                            <polyline points="14 2 14 8 20 8"></polyline>
                                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                                            <polyline points="10 9 9 9 8 9"></polyline>
                                                        </svg>
                                                        Texte
                                                    </button>
                                                </div>
                                            </div>

                                            <div id="format-video" className={`format-content ${activeFormat === 'video' ? 'active' : ''}`} style={activeFormat !== 'video' ? { display: 'none' } : {}}>
                                                <video
                                                    ref={videoRef}
                                                    className="video-player"
                                                    controls
                                                    autoPlay
                                                    muted
                                                    playsInline
                                                    poster={jtVideo?.thumbnail_url || "https://placehold.co/1920x1080?text=Chargement+du+JT..."}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', background: 'black' }}
                                                >
                                                    {jtVideo?.video_url && (
                                                        <source src="/video/Jingle.mp4" type="video/mp4" />
                                                    )}
                                                    {/* Fallback managed by JS via video.src */}
                                                    Votre navigateur ne supporte pas la lecture de vidéos.
                                                </video>


                                            </div>
                                            <div id="format-podcast" className={`format-content ${activeFormat === 'podcast' ? 'active' : ''}`} style={activeFormat !== 'podcast' ? { display: 'none' } : {}}>
                                                <div className="placeholder-content">
                                                    <div className="audio-player-mock">
                                                        <div className="play-btn">▶</div>
                                                        <div className="progress-bar">
                                                            <div className="progress" style={{ width: '30%' }}></div>
                                                        </div>
                                                        <div className="time">04:20 / 12:45</div>
                                                    </div>
                                                    <h3>Version Audio (Podcast)</h3>
                                                    <p>Écoutez le résumé de l&apos;actualité IA & No-Code de la semaine.</p>
                                                </div>
                                            </div>
                                            <div id="format-text" className={`format-content ${activeFormat === 'text' ? 'active' : ''}`} style={activeFormat !== 'text' ? { display: 'none' } : {}}>
                                                <div className="text-format-content" style={{ height: '100%', overflowY: 'auto', padding: '2rem', backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', fontSize: '1.1rem', lineHeight: '1.8', whiteSpace: 'pre-wrap', textAlign: 'justify', hyphens: 'auto' }}>
                                                    {jtVideo?.script ? (
                                                        <>
                                                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Transcription du JT</h3>
                                                            <div className="script-content">
                                                                {jtVideo.script.replace(/<break[^>]*>/g, '\n\n')}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="placeholder-content">
                                                            <p>Le script de ce JT n&apos;est pas encore disponible.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* JT Navigation Controls - Moved outside wrapper to avoid overflow clipping */}
                                        {activeFormat === 'video' && (
                                            <div className="flex items-center justify-center gap-6 mt-4 pb-2 select-none">
                                                <button
                                                    onClick={handlePrevJt}
                                                    disabled={currentJtIndex >= jtVideosList.length - 1}
                                                    className={`p-2 rounded-full transition-colors flex items-center justify-center group ${currentJtIndex >= jtVideosList.length - 1 ? 'opacity-30 cursor-not-allowed text-gray-400' : 'hover:bg-gray-200 text-black'}`}
                                                    aria-label="JT Précédent"
                                                >
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:-translate-x-1 transition-transform">
                                                        <polyline points="15 18 9 12 15 6"></polyline>
                                                    </svg>
                                                </button>

                                                <div className="text-lg font-bold text-black min-w-[150px] text-center">
                                                    {jtVideo ? getJtDateLabel(jtVideo.date) : "Chargement..."}
                                                </div>

                                                <div className="min-w-[40px]">
                                                    {currentJtIndex > 0 && (
                                                        <button
                                                            onClick={handleNextJt}
                                                            className="p-2 rounded-full hover:bg-gray-200 text-black transition-colors flex items-center justify-center group"
                                                            aria-label="JT Suivant"
                                                        >
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:translate-x-1 transition-transform">
                                                                <polyline points="9 18 15 12 9 6"></polyline>
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="articles-column">
                                    <div className="vignettes-container" style={{ gap: '2.5rem' }}> {/* Increased internal gap */}
                                        {/* Sujets du JT Column */}
                                        <div className="vignette-column" style={{ gap: '1rem' }}>
                                            <h3 className="text-lg font-bold mb-2 pb-2 border-b-2 border-border text-transparent bg-clip-text bg-gradient-to-br from-[#FF6B9D] via-[#9C27B0] to-[#2196F3]">
                                                {isSearching ? "Actualités liées" : "Sujets du JT"}
                                            </h3>
                                            <div className="vignettes-list" style={{ gap: '1rem' }}>
                                                {isLoadingSubjects ? (
                                                    <div className="empty-state"><p>Chargement des sujets...</p></div>
                                                ) : (isSearching ? searchResultArticles : jtSubjects).length > 0 ? (
                                                    (isSearching ? searchResultArticles : jtSubjects).map((article, index) => (
                                                        <div key={article.id} className="vignette-card" onClick={() => router.push(`/shorts?id=${article.id}`)}>
                                                            <div className="relative w-full h-[120px]">
                                                                <SafeImage
                                                                    src={article.image}
                                                                    fallbackTitle={article.title}
                                                                    className="vignette-image object-cover"
                                                                    alt={article.title}
                                                                    fill
                                                                    priority={index < 2}
                                                                />
                                                            </div>
                                                            <div className="vignette-info">{article.title}</div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="empty-state">
                                                        <p>
                                                            {isSearching
                                                                ? (isWaitingForAi ? "🧠 L'IA explore vos articles..." : "Aucune actualité trouvée.")
                                                                : "Aucun sujet associé à ce JT."}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Vidéos Column (formerly Tutos) */}
                                        <div className="vignette-column">
                                            <h3 className="text-lg font-bold mb-2 pb-2 border-b-2 border-border text-transparent bg-clip-text bg-gradient-to-br from-[#FF6B9D] via-[#9C27B0] to-[#2196F3]">
                                                {isSearching ? "Vidéos liées" : "Vidéos"}
                                            </h3>
                                            <div className="vignettes-list" style={{ gap: '1rem' }}>
                                                {(isSearching ? searchResultVideos : videosColumnList).map((video, index) => (
                                                    <div key={video.id || index} className="vignette-card" onClick={() => {
                                                        const isYouTube = video.video_url?.includes('youtube.com') || video.video_url?.includes('youtu.be');
                                                        if (isYouTube) {
                                                            window.open(video.video_url, '_blank');
                                                        } else {
                                                            // Find the index in the MAIN JT LIST to update navigation
                                                            const navIndex = jtVideosList.findIndex(v => v.id === video.id);
                                                            if (navIndex !== -1) {
                                                                setJtVideo(jtVideosList[navIndex]);
                                                                setCurrentJtIndex(navIndex);
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            } else {
                                                                // It's a JT not in the main list? Should not happen if logic is correct.
                                                                // Fallback:// (Aucun changement ici, juste une vérification) controls might be out of sync.
                                                                setJtVideo(video);
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            }
                                                        }
                                                    }}>
                                                        <div className="relative w-full h-[120px]">
                                                            <SafeImage
                                                                src={video.thumbnail_url || "https://placehold.co/1920x1080?text=Vidéo"}
                                                                fallbackTitle={video.title || "Vidéo JT"}
                                                                className="vignette-image object-cover"
                                                                alt={video.title || "Vidéo JT"}
                                                                fill
                                                                priority={index < 2}
                                                            />
                                                            {/* Optional: Add a YouTube badge or icon for external videos */}
                                                            {(video.video_url?.includes('youtube.com') || video.video_url?.includes('youtu.be')) && (
                                                                <div className="absolute top-1 right-1 bg-red-600 text-white text-[10px] px-1 rounded shadow">
                                                                    YouTube
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="vignette-info">
                                                            <div style={{ fontWeight: 900, fontSize: '0.9em', color: '#000', marginBottom: '4px' }}>
                                                                {getJtDateLabel(video.date)}
                                                            </div>
                                                            <div className="text-sm text-gray-600 line-clamp-2">{video.title}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Infos Column */}
                                        <div className="vignette-column" style={{ gap: '1rem' }}>
                                            <h3 className="text-lg font-bold mb-2 pb-2 border-b-2 border-border text-transparent bg-clip-text bg-gradient-to-br from-[#FF6B9D] via-[#9C27B0] to-[#2196F3]">
                                                Infos
                                            </h3>
                                            <div className="vignettes-list" style={{ gap: '1rem' }}>
                                                {nextCourse ? (
                                                    <div className="bg-gradient-to-br from-indigo-50 to-white p-4 rounded-xl border border-indigo-100 text-sm text-indigo-900 shadow-sm">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">Prochain cours</span>
                                                            <span className="text-xs text-gray-500">{new Date(nextCourse.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                                        </div>
                                                        <p className="font-bold text-base mb-2 leading-tight">{nextCourse.title}</p>

                                                        <div className="space-y-1.5 text-xs text-gray-700">
                                                            {nextCourse.location && (
                                                                <div className="flex items-center gap-2">
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                                                    <span>
                                                                        {nextCourse.location}
                                                                        {nextCourse.meetLink && (
                                                                            <a href={nextCourse.meetLink} target="_blank" rel="noreferrer" className="ml-1 text-indigo-600 underline font-semibold hover:text-indigo-800">
                                                                                Lien Google Meet
                                                                            </a>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {nextCourse.instructor && (
                                                                <div className="flex items-center gap-2">
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                                    <span>Formateur : <span className="font-medium">{nextCourse.instructor}</span></span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-500 italic text-center">
                                                        Aucun cours demain.
                                                    </div>
                                                )}

                                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                                                    <p className="font-bold mb-1">Mises à jour</p>
                                                    <p>Retrouvez ici les dernières annonces et informations importantes en bref.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Trending Articles */}
                    <section className="articles-section trending-articles" id="actualite">
                        <div className="container mx-auto">
                            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                                <h2 className="section-title !mb-0">Les news de l&apos;IA</h2>
                                <div className="flex-1 flex gap-2 ml-12 flex-wrap">
                                    <a href="/category.html?category=IA" className="flex-1 text-center justify-center flex items-center px-3 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-blue-600 to-cyan-500 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">IA</a>
                                    <a href="/category.html?category=No-Code" className="flex-1 text-center justify-center flex items-center px-3 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-purple-600 to-pink-600 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">No-Code</a>
                                    <a href="/category.html?category=Automatisation" className="flex-1 text-center justify-center flex items-center px-3 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-orange-600 to-amber-500 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">Automatisation</a>
                                    <a href="/category.html?category=Vibe-coding" className="flex-1 text-center justify-center flex items-center px-3 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-violet-500 via-pink-500 to-rose-500 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">Vibe-coding</a>
                                    <a href="/category.html?category=Multimedia" className="flex-1 text-center justify-center flex items-center px-3 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-emerald-500 to-blue-500 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">Multimédia</a>
                                </div>
                            </div>
                            <div className="articles-grid">
                                {trendingArticles.map(article => (
                                    <article key={article.id} className="article-card" onClick={() => router.push(`/shorts?id=${article.id}`)}>
                                        <div className="article-image-container relative h-48 w-full group">
                                            <Image
                                                src={article.image}
                                                alt={article.title}
                                                fill
                                                className="article-image object-cover"
                                                unoptimized
                                            />

                                            {/* Action Buttons */}
                                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        alert('Article sauvegardé !');
                                                    }}
                                                    className="p-2 rounded-full bg-white/90 text-gray-700 hover:bg-pink-500 hover:text-white backdrop-blur-sm transition-all duration-200 hover:scale-110 shadow-lg"
                                                    aria-label="Sauvegarder"
                                                    title="Sauvegarder"
                                                >
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        className="w-5 h-5"
                                                    >
                                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                                    </svg>
                                                </button>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        alert('Ajouté à "À regarder plus tard" !');
                                                    }}
                                                    className="p-2 rounded-full bg-white/90 text-gray-700 hover:bg-pink-500 hover:text-white backdrop-blur-sm transition-all duration-200 hover:scale-110 shadow-lg"
                                                    aria-label="À regarder plus tard"
                                                    title="À regarder plus tard"
                                                >
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        className="w-5 h-5"
                                                    >
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <polyline points="12 6 12 12 16 14"></polyline>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="article-content">
                                            {article.tags && (
                                                <div className="article-tags">
                                                    {article.tags.map(tag => (
                                                        <span key={tag} className="article-tag">{tag}</span>
                                                    ))}
                                                </div>
                                            )}
                                            <h3 className="article-title line-clamp-2" title={article.title}>{article.title}</h3>
                                            {article.excerpt && (
                                                <p className="article-excerpt line-clamp-3 mb-4 text-sm text-muted-foreground">
                                                    {article.excerpt}
                                                </p>
                                            )}
                                            <div className="article-meta">
                                                <span className="article-date">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <polyline points="12 6 12 12 16 14"></polyline>
                                                    </svg>
                                                    {formatDate(article.date)}
                                                </span>
                                                <span className="article-link" onClick={(e) => { e.stopPropagation(); if (article.link) window.open(article.link, '_blank'); }}>
                                                    Lire →
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Tutos Section */}
                    <section className="articles-section" id="tutos">
                        <div className="container mx-auto">
                            <h2 className="section-title">Nos Tutos</h2>
                            <div className="articles-grid">
                                {tutorials.map(tuto => (
                                    <article key={tuto.id} className="article-card" onClick={() => window.open(tuto.url, '_blank')}>
                                        <div className="article-image-container relative h-48 w-full">
                                            <SafeImage
                                                src={tuto.image_url || getDeterministicImage(tuto.software)}
                                                fallbackTitle={tuto.software}
                                                className="article-image object-cover"
                                                alt={tuto.software}
                                                fill
                                            />
                                        </div>
                                        <div className="article-content">
                                            <h3 className="article-title">{tuto.software}</h3>
                                            <div className="article-meta">
                                                <span className="article-link" style={{ color: 'var(--text-light)', fontWeight: 'normal' }}>{tuto.channel_name}</span>
                                                <span className="article-link ml-auto" style={{ cursor: 'pointer' }}>Voir →</span>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Course Prep */}
                    <section className="course-prep-section" id="courseprep">
                        <div className="container">
                            <h2 className="section-title">Préparez le prochain cours</h2>
                            <p className="section-subtitle">Articles recommandés pour bien démarrer votre prochaine session de formation</p>
                            <div className="articles-grid">
                                {coursePrepArticles.map(article => (
                                    <article key={article.id} className="article-card" onClick={() => article.link && window.open(article.link, '_blank')}>
                                        <div className="article-image-container relative h-48 w-full">
                                            <Image
                                                src={article.image}
                                                alt={article.title}
                                                fill
                                                className="article-image object-cover"
                                                unoptimized
                                            />
                                        </div>
                                        <div className="article-content">
                                            <div className="article-tags">
                                                {article.category && <span className="article-tag">{article.category}</span>}
                                            </div>
                                            <h3 className="article-title">{article.title}</h3>
                                            <div className="article-meta">
                                                <span className="article-link">Lire →</span>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                </main>

                {/* Footer */}
                <Footer />
            </div >
        </>
    );
}
