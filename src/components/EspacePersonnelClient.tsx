'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
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
        };

        checkUser();

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                router.push('/auth');
            } else if (session) {
                setUser(session.user);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const loadData = async (userId: string) => {
        setLoading(true);
        try {
            await Promise.all([
                loadSavedArticles(userId),
                loadLearningHistory(userId)
            ]);
        } catch (error) {
            console.error("Error loading data", error);
        } finally {
            setLoading(false);
        }
    };

    const loadSavedArticles = async (userId: string) => {
        const { data, error } = await supabase
            .from('article_interactions')
            .select(`
                article_id, is_liked, is_bookmarked, last_interacted_at,
                articles (
                    id, title, excerpt, image_url, url, published_at
                )
            `)
            .eq('user_id', userId)
            .or('is_liked.eq.true,is_bookmarked.eq.true')
            .order('last_interacted_at', { ascending: false });

        if (error) {
            console.error('Error fetching interactions:', error);
            return;
        }

        if (data) {
            const loadedSaved: Article[] = [];
            const loadedWatchLater: Article[] = [];

            data.forEach((item: any) => {
                if (!item.articles) return;

                const art: Article = {
                    id: item.articles.id,
                    title: item.articles.title || 'Article indisponible',
                    description: item.articles.excerpt || '',
                    excerpt: item.articles.excerpt || '',
                    image_url: item.articles.image_url || '',
                    article_url: item.articles.url || '#',
                    category: 'IA',
                    published_at: item.articles.published_at,
                    created_at: item.last_interacted_at,
                    status: 'saved',
                    user_id: userId
                };

                if (item.is_liked) {
                    loadedSaved.push({ ...art, status: 'saved' });
                }
                if (item.is_bookmarked) {
                    loadedWatchLater.push({ ...art, status: 'watch_later' });
                }
            });

            setSavedArticles(loadedSaved);
            setWatchLaterArticles(loadedWatchLater);
        }
    };

    const loadLearningHistory = async (userId: string) => {
        // Fetch legacy history for charts/timeline
        const { data: historyData, error } = await supabase
            .from('reading_history')
            .select('id, read_at, reading_duration, article_category, article_tags, article_title')
            .eq('user_id', userId)
            .order('read_at', { ascending: false });

        if (error) {
            console.error('Error fetching history:', error);
            // Don't return, try to fetch profile stats anyway
        }

        // Fetch New User Profile Stats
        const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        // Calculate stats from history (legacy or partial)
        const stats = calculateReadingStats(historyData || []);

        // Override with official profile stats if available
        if (profileData) {
            // Prioritize the profile counters if they are non-zero or authoritative
            stats.totalReadings = profileData.articles_read_count ?? stats.totalReadings;
            stats.readingStreak = profileData.current_streak ?? stats.readingStreak;
            // You could also add XP or other new stats here if the UI supported them
        } else {
            // Optional: Create profile if missing?
            // For now, we just rely on existing calculations or 0
        }

        setHistoryStats(stats);
    };

    const removeArticle = async (articleId: number | string, type: 'liked' | 'bookmarked', e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;

        // Confirm logic removed for better UX

        try {
            // Optimistic update
            if (type === 'liked') {
                setSavedArticles(prev => prev.filter(a => a.id !== articleId));
                toast.success("Article retiré des favoris", {
                    icon: '🗑️',
                    style: { borderRadius: '10px', background: '#333', color: '#fff' }
                });
            } else {
                setWatchLaterArticles(prev => prev.filter(a => a.id !== articleId));
                toast.success("Retiré de 'À regarder plus tard'", {
                    icon: '🗑️',
                    style: { borderRadius: '10px', background: '#333', color: '#fff' }
                });
            }

            // Sync with LocalStorage
            const storageKey = type === 'liked' ? 'oreegamia_liked_items' : 'oreegamia_bookmarked_items';
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                    const ids = JSON.parse(stored);
                    const newIds = ids.filter((id: string) => id !== articleId.toString());
                    localStorage.setItem(storageKey, JSON.stringify(newIds));
                }
            } catch (e) { console.error("LS update error", e); }

            const updatePayload: any = {};
            if (type === 'liked') updatePayload.is_liked = false;
            if (type === 'bookmarked') updatePayload.is_bookmarked = false;
            updatePayload.last_interacted_at = new Date().toISOString();

            const { error } = await supabase
                .from('article_interactions')
                .update(updatePayload)
                .eq('article_id', articleId)
                .eq('user_id', user.id);

            if (error) throw error;

        } catch (err) {
            console.error("Error updating interaction:", err);
            toast.error("Erreur lors de la mise à jour.");
        }
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
                <p className="page-subtitle dark:text-gray-400">Gérez vos articles sauvegardés et suivez votre activité</p>
            </div>

            {/* Learning History Section */}
            <div className="learning-history-container bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10">
                {/* Stats Grid */}
                <div className="learning-stats-grid">
                    <div className="learning-stat-card shadow-sm border border-gray-100 dark:border-white/10 dark:bg-slate-900 bg-white">
                        <div className="stat-icon-container">
                            <Book className="stat-icon text-[#FF6B9D]" />
                        </div>
                        <div className="stat-info">
                            <div className="stat-value text-[#FF6B9D]">{historyStats.totalReadings}</div>
                            <div className="stat-label">Articles lus</div>
                        </div>
                    </div>
                    <div className="learning-stat-card shadow-sm border border-gray-100 dark:border-white/10 dark:bg-slate-900 bg-white">
                        <div className="stat-icon-container">
                            <Target className="stat-icon text-[#9C27B0]" />
                        </div>
                        <div className="stat-info">
                            <div className="stat-value text-[#9C27B0]">{historyStats.favoriteCategory}</div>
                            <div className="stat-label">Catégorie favorite</div>
                        </div>
                    </div>
                    <div className="learning-stat-card shadow-sm border border-gray-100 dark:border-white/10 dark:bg-slate-900 bg-white">
                        <div className="stat-icon-container">
                            <TrendingUp className="stat-icon text-[#2196F3]" />
                        </div>
                        <div className="stat-info">
                            <div className="stat-value text-[#2196F3]">{historyStats.readingStreak}</div>
                            <div className="stat-label">Jours consécutifs</div>
                        </div>
                    </div>
                    <div className="learning-stat-card shadow-sm border border-gray-100 dark:border-white/10 dark:bg-slate-900 bg-white">
                        <div className="stat-icon-container">
                            <Clock className="stat-icon text-orange-400" />
                        </div>
                        <div className="stat-info">
                            <div className="stat-value text-orange-400">{historyStats.totalTime} min</div>
                            <div className="stat-label">Temps de lecture</div>
                        </div>
                    </div>
                </div>

                {/* Category & Tags Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Category Breakdown */}
                    <div className="category-breakdown">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Répartition par catégorie</h3>
                        <div className="category-chart">
                            {Object.keys(historyStats.categories).length > 0 ? Object.entries(historyStats.categories)
                                .sort((a, b) => b[1] - a[1])
                                .map(([category, count]) => {
                                    const total = Object.values(historyStats.categories).reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((count / total) * 100);
                                    return (
                                        <div key={category} className="category-bar">
                                            <div className="category-name dark:text-gray-300 font-semibold">{category}</div>
                                            <div className="category-progress bg-gray-100 dark:bg-slate-800">
                                                <div className="category-progress-fill" style={{ width: `${percentage}%` }}>
                                                    {count} ({percentage}%)
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }) : <p className="text-gray-400 italic">Pas de données.</p>}
                        </div>
                    </div>

                    {/* Top Tags */}
                    <div className="top-tags-section !mt-0 !pt-30 md:!pt-0 md:!mt-8 md:!border-t-0 border-t border-gray-100 dark:border-white/5">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Sujets explorés</h3>
                        <div className="tags-cloud">
                            {Object.keys(historyStats.topTags).length > 0 ? Object.entries(historyStats.topTags)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 10)
                                .map(([tag, count]) => (
                                    <div key={tag} className="tag-item bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-indigo-400 border border-transparent dark:border-white/10">
                                        <span>{tag}</span>
                                        <span className="tag-count dark:bg-indigo-900/30">{count}</span>
                                    </div>
                                )) : <p className="text-gray-400 italic">Pas de tags.</p>}
                        </div>
                    </div>
                </div>

                {/* Activity Timeline */}
                <div className="activity-timeline">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Activité récente</h3>
                    <div className="timeline-container">
                        {historyStats.recentActivity.length > 0 ? historyStats.recentActivity.map((activity, idx) => (
                            <div key={idx} className="timeline-item bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 p-3 rounded-lg mb-2 shadow-sm">
                                <div className="timeline-date">{getTimeAgo(activity.date)}</div>
                                <div className="timeline-content flex items-center justify-between flex-1">
                                    <div className="timeline-title text-gray-800 dark:text-gray-200 font-medium">{activity.title}</div>
                                    <span className="timeline-category bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-xs">{activity.category}</span>
                                </div>
                            </div>
                        )) : <p className="text-gray-400 text-center">Aucune activité récente</p>}
                    </div>
                </div>
            </div>

            {/* Saved Articles Section */}
            <h2 className="section-title dark:text-white">Mes Articles Sauvegardés</h2>
            <div className="saved-articles-grid">
                {savedArticles.length > 0 ? savedArticles.map(article => (
                    <div key={article.id} className="article-card dark:bg-slate-900/50 dark:border-white/10 dark:shadow-2xl" onClick={() => article.article_url && window.open(article.article_url, '_blank')}>
                        {article.image_url && (
                            <img src={article.image_url} alt={article.title} className="article-image" />
                        )}
                        <div className="article-content">
                            {article.category && <span className="article-category">{article.category}</span>}
                            <h3 className="article-title dark:text-white group-hover:text-indigo-600 transition-colors">{article.title}</h3>
                            {article.excerpt && <p className="article-excerpt line-clamp-2 dark:text-gray-400">{article.excerpt}</p>}
                            <div className="article-meta">
                                <span className="article-date dark:text-gray-500">
                                    <Calendar size={14} className="mr-1" />
                                    {new Date(article.created_at).toLocaleDateString()}
                                </span>
                                <button className="remove-btn" onClick={(e) => removeArticle(article.id, 'liked', e)} title="Retirer">
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

            <h2 className="section-title dark:text-white">À regarder plus tard</h2>
            <div className="saved-articles-grid">
                {watchLaterArticles.length > 0 ? watchLaterArticles.map(article => (
                    <div key={article.id} className="article-card dark:bg-slate-900/50 dark:border-white/10 dark:shadow-2xl" onClick={() => article.article_url && window.open(article.article_url, '_blank')}>
                        {article.image_url && (
                            <img src={article.image_url} alt={article.title} className="article-image" />
                        )}
                        <div className="article-content">
                            {article.category && <span className="article-category">{article.category}</span>}
                            <h3 className="article-title dark:text-white group-hover:text-indigo-600 transition-colors">{article.title}</h3>
                            <div className="article-meta">
                                <span className="article-date dark:text-gray-500">
                                    <Calendar size={14} className="mr-1" />
                                    {new Date(article.created_at).toLocaleDateString()}
                                </span>
                                <button className="remove-btn" onClick={(e) => removeArticle(article.id, 'bookmarked', e)} title="Retirer">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="empty-state">
                        <Clock size={80} strokeWidth={1} className="mx-auto mb-4 opacity-30 dark:text-white" />
                        <h3 className="dark:text-gray-400">Aucun article à regarder plus tard</h3>
                        <p className="dark:text-gray-500">Ajoutez des articles à votre liste pour les consulter ultérieurement</p>
                    </div>
                )}
            </div>
        </div>
    );
}
