'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client'; // Using utils as seen in ShortsFeed
import { useRouter } from 'next/navigation';
import {
    Book,
    Target,
    TrendingUp,
    Clock,
    Trash2,
    ExternalLink,
    Calendar,
    Bookmark,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import './EspacePersonnel.css';
import Link from 'next/link';
import toast from 'react-hot-toast';


// Types
interface Article {
    id: number | string;
    title: string;
    description?: string;
    excerpt?: string; // JS used excerpt
    image_url?: string;
    article_url?: string;
    category?: string;
    published_at?: string;
    created_at: string; // Saved date
    status: 'saved' | 'watch_later';
    user_id: string;
    article_id?: string; // Original article ID from articles table
}


interface ReadingHistoryItem {
    id: number | string;
    article_title: string;
    article_category?: string;
    article_tags?: string[];
    read_at: string;
    reading_duration?: number;
}

interface UserStats {
    totalReadings: number;
    favoriteCategory: string;
    readingStreak: number;
    totalTime: number;
    categories: Record<string, number>;
    topTags: Record<string, number>;
    recentActivity: {
        date: string;
        title: string;
        category: string;
    }[];
}

export default function EspacePersonnelClient() {
    const [savedArticles, setSavedArticles] = useState<Article[]>([]);
    const [watchLaterArticles, setWatchLaterArticles] = useState<Article[]>([]);
    const [readArticles, setReadArticles] = useState<Article[]>([]);
    const [historyStats, setHistoryStats] = useState<UserStats>({
        totalReadings: 0,
        favoriteCategory: '-',
        readingStreak: 0,
        totalTime: 0,
        categories: {},
        topTags: {},
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const supabase = createClient();


    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/auth');
                return;
            }
            setUser(session.user);
            await loadData(session.user.id);

            // Set up real-time subscriptions for this user
            setupRealtimeSubscriptions(session.user.id);
        };

        checkUser();

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                router.push('/auth');
            } else if (session) {
                setUser(session.user);
                loadData(session.user.id);
                setupRealtimeSubscriptions(session.user.id);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
            // Clean up realtime subscriptions
            supabase.channel('saved_articles_changes').unsubscribe();
            supabase.channel('reading_history_changes').unsubscribe();
        };
    }, []);

    // Set up real-time subscriptions
    const setupRealtimeSubscriptions = (userId: string) => {
        // Subscribe to saved_articles changes
        supabase
            .channel('saved_articles_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'saved_articles',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    console.log('Saved articles changed:', payload);
                    loadSavedArticles(userId);
                }
            )
            .subscribe();

        // Subscribe to reading_history changes
        supabase
            .channel('reading_history_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'reading_history',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    console.log('Reading history changed:', payload);
                    loadLearningHistory(userId);
                }
            )
            .subscribe();
    };

    const loadData = async (userId: string) => {
        console.log('🔄 Loading data for user:', userId);
        setLoading(true);
        try {
            await Promise.all([
                loadSavedArticles(userId),
                loadLearningHistory(userId)
            ]);
            console.log('✅ Data loaded successfully');
        } catch (error) {
            console.error("❌ Error loading data", error);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const loadSavedArticles = async (userId: string) => {
        try {
            console.log('📚 Loading saved articles for user:', userId);
            // First, get saved articles metadata
            const { data: savedData, error: savedError } = await supabase
                .from('saved_articles')
                .select('id, article_id, status, saved_at, user_id')
                .eq('user_id', userId)
                .order('saved_at', { ascending: false });

            if (savedError) {
                console.error('❌ Error fetching saved articles:', savedError);
                return;
            }

            console.log(`📊 Found ${savedData?.length || 0} saved articles`);

            if (!savedData || savedData.length === 0) {
                console.log('ℹ️ No saved articles found');
                setSavedArticles([]);
                setWatchLaterArticles([]);
                return;
            }

            // Get unique article IDs
            const articleIds = savedData.map(item => item.article_id);

            // Fetch article details
            const { data: articlesData, error: articlesError } = await supabase
                .from('articles')
                .select('*')
                .in('id', articleIds);

            if (articlesError) {
                console.error('Error fetching articles details:', articlesError);
                return;
            }

            // Create a map of articles by ID for quick lookup
            const articlesMap = new Map();
            if (articlesData) {
                articlesData.forEach(article => {
                    articlesMap.set(article.id.toString(), article);
                });
            }

            // Map saved articles with their details
            const mappedArticles: Article[] = savedData
                .map((item: any) => {
                    const article = articlesMap.get(item.article_id);
                    if (!article) {
                        console.warn(`Article ${item.article_id} not found`);
                        return null;
                    }

                    return {
                        id: item.id,
                        title: article.title || 'Article indisponible',
                        description: article.excerpt || '',
                        excerpt: article.excerpt || '',
                        image_url: article.image_url || '',
                        article_url: article.url || '#',
                        category: article.category || 'IA',
                        published_at: article.published_at,
                        created_at: item.saved_at,
                        status: item.status || 'saved',
                        user_id: item.user_id,
                        article_id: item.article_id
                    };
                })
                .filter((a): a is NonNullable<typeof a> => a !== null) as Article[];

            console.log('Loaded articles:', mappedArticles);
            setSavedArticles(mappedArticles.filter(a => a.status === 'saved'));
            setWatchLaterArticles(mappedArticles.filter(a => a.status === 'watch_later'));
        } catch (error) {
            console.error('Error in loadSavedArticles:', error);
        }
    };

    const loadLearningHistory = async (userId: string) => {
        console.log('📖 Loading learning history for user:', userId);
        const { data, error } = await supabase
            .from('reading_history')
            .select('*')
            .eq('user_id', userId)
            .order('read_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching history:', error);
            return;
        }

        console.log(`📈 Found ${data?.length || 0} reading history entries`);

        if (data && data.length > 0) {
            console.log('📊 Sample history data:', data.slice(0, 3));

            // Calculate stats
            const stats = calculateReadingStats(data);
            console.log('📉 Calculated stats:', stats);
            setHistoryStats(stats);

            // Load article details for read articles
            try {
                const articleIds = [...new Set(data.map(item => item.article_id))];
                console.log(`🔍 Loading details for ${articleIds.length} unique articles`);

                const { data: articlesData, error: articlesError } = await supabase
                    .from('articles')
                    .select('*')
                    .in('id', articleIds);

                if (articlesError) {
                    console.error('❌ Error fetching article details:', articlesError);
                    return;
                }

                // Create a map of articles by ID
                const articlesMap = new Map();
                if (articlesData) {
                    articlesData.forEach(article => {
                        articlesMap.set(article.id.toString(), article);
                    });
                }

                // Map reading history with article details
                const mappedReadArticles: Article[] = data
                    .map((item: any) => {
                        const article = articlesMap.get(item.article_id);
                        if (!article) {
                            console.warn(`Article ${item.article_id} not found in articles table`);
                            return null;
                        }

                        return {
                            id: item.id,
                            title: article.title || item.article_title || 'Article indisponible',
                            description: article.excerpt || '',
                            excerpt: article.excerpt || '',
                            image_url: article.image_url || '',
                            article_url: article.url || '#',
                            category: article.category || item.article_category || 'Non catégorisé',
                            published_at: article.published_at,
                            created_at: item.read_at,
                            status: 'saved' as const,
                            user_id: item.user_id,
                            article_id: item.article_id
                        };
                    })
                    .filter((a): a is NonNullable<typeof a> => a !== null) as Article[];

                console.log(`✅ Loaded ${mappedReadArticles.length} read articles with details`);
                setReadArticles(mappedReadArticles);
            } catch (error) {
                console.error('❌ Error loading read articles details:', error);
            }
        } else {
            setReadArticles([]);
        }
    };

    const removeArticle = async (articleId: number | string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;

        // Show confirmation toast with custom buttons
        toast((t) => (
            <div className="flex flex-col gap-4 p-2">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <svg
                            className="w-6 h-6 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">Confirmer la suppression</h3>
                        <p className="text-gray-600 text-sm">Êtes-vous sûr de vouloir retirer cet article de votre liste ?</p>
                    </div>
                </div>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all duration-200 hover:scale-105"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);

                            try {
                                const { error } = await supabase
                                    .from('saved_articles')
                                    .delete()
                                    .eq('id', articleId)
                                    .eq('user_id', user.id);

                                if (error) throw error;

                                // Optimistic update
                                setSavedArticles(prev => prev.filter(a => a.id !== articleId));
                                setWatchLaterArticles(prev => prev.filter(a => a.id !== articleId));

                                toast.success('🗑️ Article retiré avec succès', { duration: 2000 });
                            } catch (err) {
                                console.error("Error deleting:", err);
                                toast.error('❌ Erreur lors de la suppression');
                            }
                        }}
                        className="px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        Supprimer
                    </button>
                </div>
            </div>
        ), {
            duration: Infinity,
            position: 'top-center',
            style: {
                background: 'white',
                padding: '16px',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                minWidth: '400px',
            },
        });
    };

    // Helper Functions
    const calculateReadingStats = (history: ReadingHistoryItem[]): UserStats => {
        if (!history.length) return {
            totalReadings: 0, favoriteCategory: '-', readingStreak: 0, totalTime: 0, categories: {}, topTags: {}, recentActivity: []
        };

        const totalReadings = history.length;
        const totalTime = Math.round(history.reduce((sum, item) => sum + (item.reading_duration || 0), 0) / 60);

        const categoryCounts: Record<string, number> = {};
        const tagCounts: Record<string, number> = {};

        history.forEach(item => {
            if (item.article_category) {
                categoryCounts[item.article_category] = (categoryCounts[item.article_category] || 0) + 1;
            }
            if (item.article_tags) {
                item.article_tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        const favoriteCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

        // Streak Logic
        const dates = history.map(item => {
            const d = new Date(item.read_at);
            return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        });
        const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);

        let streak = 0;
        if (uniqueDates.length > 0) {
            streak = 1;
            const oneDayMs = 24 * 60 * 60 * 1000;
            for (let i = 0; i < uniqueDates.length - 1; i++) {
                if (uniqueDates[i] - uniqueDates[i + 1] <= oneDayMs) { // Allow for same day or previous day? Code said diff === oneDayMs.
                    // Original code logic:
                    // diff === oneDayMs -> streak++
                    // My enhanced logic: usually streak means consecutive dates.
                    // The original JS strictly checked `diff === oneDayMs`.
                    if (uniqueDates[i] - uniqueDates[i + 1] === oneDayMs) {
                        streak++;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
        }

        const recentActivity = history.slice(0, 10).map(item => ({
            date: item.read_at,
            title: item.article_title || 'Article sans titre',
            category: item.article_category || 'Non catégorisé'
        }));

        return {
            totalReadings,
            favoriteCategory,
            readingStreak: streak,
            totalTime,
            categories: categoryCounts,
            topTags: tagCounts,
            recentActivity
        };
    };

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'À l\'instant';
        if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
        if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
        if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)}j`;
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-xl animate-pulse">Chargement de votre espace...</div>
            </div>
        );
    }

    return (
        <div className="personal-space-container">
            <div className="page-header">
                <h1 className="page-title">Espace Personnel</h1>
                <p className="page-subtitle">Gérez vos articles sauvegardés et suivez votre activité</p>
            </div>

            {/* Intelligent Learning History */}
            <div className="learning-history-container mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Historique d'apprentissage</h2>

                {/* Key Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 border border-pink-200">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-pink-500 rounded-xl">
                                <Book className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">{historyStats.totalReadings}</div>
                                <div className="text-sm text-gray-600">Articles lus</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500 rounded-xl">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{historyStats.favoriteCategory}</div>
                                <div className="text-sm text-gray-600">Catégorie favorite</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500 rounded-xl">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">{historyStats.readingStreak}</div>
                                <div className="text-sm text-gray-600">Jours consécutifs</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500 rounded-xl">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">{historyStats.totalTime}</div>
                                <div className="text-sm text-gray-600">Minutes de lecture</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories & Topics Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Top Categories */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                            Catégories explorées
                        </h3>
                        <div className="space-y-3">
                            {Object.keys(historyStats.categories).length > 0 ? (
                                Object.entries(historyStats.categories)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 5)
                                    .map(([category, count]) => {
                                        const total = Object.values(historyStats.categories).reduce((a, b) => a + b, 0);
                                        const percentage = Math.round((count / total) * 100);
                                        return (
                                            <div key={category} className="space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-700">{category}</span>
                                                    <span className="text-xs text-gray-500">{count} articles ({percentage}%)</span>
                                                </div>
                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                            ) : (
                                <p className="text-gray-400 text-sm italic text-center py-4">Commencez à lire des articles pour voir vos catégories favorites</p>
                            )}
                        </div>
                    </div>

                    {/* Top Tags */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Sujets d'intérêt
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(historyStats.topTags).length > 0 ? (
                                Object.entries(historyStats.topTags)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 12)
                                    .map(([tag, count]) => (
                                        <span
                                            key={tag}
                                            className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-full text-sm font-medium text-gray-700 hover:scale-105 transition-transform cursor-default"
                                        >
                                            {tag} <span className="text-xs text-gray-500">({count})</span>
                                        </span>
                                    ))
                            ) : (
                                <p className="text-gray-400 text-sm italic text-center w-full py-4">Aucun tag pour le moment</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Activity Timeline */}
                {historyStats.recentActivity.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Activité récente
                        </h3>
                        <div className="space-y-3">
                            {historyStats.recentActivity.slice(0, 5).map((activity, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                                {activity.category}
                                            </span>
                                            <span className="text-xs text-gray-500">{getTimeAgo(activity.date)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Saved Articles Section */}
            <h2 className="section-title">Mes Articles Sauvegardés</h2>
            <div className="saved-articles-grid">
                {savedArticles.length > 0 ? savedArticles.map(article => (
                    <div key={article.id} className="article-card" onClick={() => article.article_url && window.open(article.article_url, '_blank')}>
                        {article.image_url && (
                            <img src={article.image_url} alt={article.title} className="article-image" />
                        )}
                        <div className="article-content">
                            {article.category && <span className="article-category">{article.category}</span>}
                            <h3 className="article-title">{article.title}</h3>
                            {article.excerpt && <p className="article-excerpt line-clamp-2">{article.excerpt}</p>}
                            <div className="article-meta">
                                <span className="article-date">
                                    <Calendar size={14} className="mr-1" />
                                    {new Date(article.created_at).toLocaleDateString()}
                                </span>
                                <button className="remove-btn" onClick={(e) => removeArticle(article.id, e)} title="Retirer">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="empty-state">
                        <Bookmark size={80} strokeWidth={1} className="mx-auto mb-4 opacity-30" />
                        <h3>Aucun article sauvegardé</h3>
                        <p>Commencez à sauvegarder des articles pour les retrouver ici</p>
                    </div>
                )}
            </div>

            <h2 className="section-title">À regarder plus tard</h2>
            <div className="saved-articles-grid">
                {watchLaterArticles.length > 0 ? watchLaterArticles.map(article => (
                    <div key={article.id} className="article-card" onClick={() => article.article_url && window.open(article.article_url, '_blank')}>
                        {article.image_url && (
                            <img src={article.image_url} alt={article.title} className="article-image" />
                        )}
                        <div className="article-content">
                            {article.category && <span className="article-category">{article.category}</span>}
                            <h3 className="article-title">{article.title}</h3>
                            <div className="article-meta">
                                <span className="article-date">
                                    <Calendar size={14} className="mr-1" />
                                    {new Date(article.created_at).toLocaleDateString()}
                                </span>
                                <button className="remove-btn" onClick={(e) => removeArticle(article.id, e)} title="Retirer">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="empty-state">
                        <Clock size={80} strokeWidth={1} className="mx-auto mb-4 opacity-30" />
                        <h3>Aucun article à regarder plus tard</h3>
                        <p>Ajoutez des articles à votre liste pour les consulter ultérieurement</p>
                    </div>
                )}
            </div>
        </div>
    );
}
