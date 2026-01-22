'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

const STORAGE_KEY_READ = 'oreegamia_read_items';
const STORAGE_KEY_LIKES = 'oreegamia_liked_items';
const STORAGE_KEY_BOOKMARKS = 'oreegamia_bookmarked_items';
const STORAGE_KEY_SKIPPED = 'oreegamia_skipped_items';

interface ArticleMetadata {
    title: string;
    category?: string;
    tags?: string[];
    duration?: number;
}

/**
 * Hook to manage the read/like/bookmark/skip status of items.
 * Persists data in localStorage and syncs with Supabase article_interactions table.
 */
export function useReadTracking() {
    const [readIds, setReadIds] = useState<string[]>([]);
    const [likedIds, setLikedIds] = useState<string[]>([]);
    const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
    const [skippedIds, setSkippedIds] = useState<string[]>([]);

    const [isLoaded, setIsLoaded] = useState(false);
    const [supabase] = useState(() => createClient());
    const [userId, setUserId] = useState<string | null>(null);

    // Track items read in this session to prevent spamming the API on scroll
    const sessionReadIds = useRef<Set<string>>(new Set());

    // Load user and interactons on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                // Get current user
                const { data: { session } } = await supabase.auth.getSession();

                let localReads: string[] = [];
                let localLikes: string[] = [];
                let localBookmarks: string[] = [];
                let localSkipped: string[] = [];

                // Load from localStorage
                try {
                    const sRead = localStorage.getItem(STORAGE_KEY_READ);
                    if (sRead) localReads = JSON.parse(sRead);

                    const sLikes = localStorage.getItem(STORAGE_KEY_LIKES);
                    if (sLikes) localLikes = JSON.parse(sLikes);

                    const sBookmarks = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
                    if (sBookmarks) localBookmarks = JSON.parse(sBookmarks);

                    const sSkipped = localStorage.getItem(STORAGE_KEY_SKIPPED);
                    if (sSkipped) localSkipped = JSON.parse(sSkipped);
                } catch (e) { console.error("Local storage error", e); }

                // If user is logged in, load from database (article_interactions)
                if (session?.user) {
                    setUserId(session.user.id);

                    const { data: interactions, error } = await supabase
                        .from('article_interactions')
                        .select('article_id, is_read, is_liked, is_bookmarked, is_skipped')
                        .eq('user_id', session.user.id);

                    if (!error && interactions) {
                        const dbReads = interactions.filter(i => i.is_read).map(i => i.article_id);
                        const dbLikes = interactions.filter(i => i.is_liked).map(i => i.article_id);
                        const dbBookmarks = interactions.filter(i => i.is_bookmarked).map(i => i.article_id);
                        const dbSkipped = interactions.filter(i => i.is_skipped).map(i => i.article_id);

                        // Merge DB and Local (DB wins for sync usually, but here we union)
                        localReads = [...new Set([...localReads, ...dbReads])];
                        localLikes = [...new Set([...localLikes, ...dbLikes])];
                        localBookmarks = [...new Set([...localBookmarks, ...dbBookmarks])];
                        localSkipped = [...new Set([...localSkipped, ...dbSkipped])];
                    }
                }

                setReadIds(localReads);
                setLikedIds(localLikes);
                setBookmarkedIds(localBookmarks);
                setSkippedIds(localSkipped);

                // Init session read cache
                localReads.forEach(id => sessionReadIds.current.add(id));

            } catch (e) {
                console.error('Failed to load interactions:', e);
            } finally {
                setIsLoaded(true);
            }
        };

        loadData();

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUserId(session.user.id);
                // Trigger reload could be better, but for now basic set
            } else {
                setUserId(null);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [supabase]);

    // Update Local Storage Helper
    const updateLocalStorage = (key: string, ids: string[]) => {
        try {
            localStorage.setItem(key, JSON.stringify(ids));
        } catch (e) { console.error("LS Error", e); }
    };

    // --- Actions ---

    const markAsRead = async (id: string | number, metadata?: ArticleMetadata, readingDuration?: number) => {
        const idStr = id.toString();

        // Anti-spam check for reads (only auto-trigger once per session usually)
        if (sessionReadIds.current.has(idStr)) return;

        // If already read, just update session cache and return (unless we want to update timestamp?)
        if (readIds.includes(idStr)) {
            sessionReadIds.current.add(idStr);
            return;
        }

        const newIds = [...readIds, idStr];
        setReadIds(newIds);
        sessionReadIds.current.add(idStr);
        updateLocalStorage(STORAGE_KEY_READ, newIds);

        // Remove from skipped if present (read overrides skipped)
        if (skippedIds.includes(idStr)) {
            const newSkipped = skippedIds.filter(i => i !== idStr);
            setSkippedIds(newSkipped);
            updateLocalStorage(STORAGE_KEY_SKIPPED, newSkipped);
            // We should ideally update DB too to set is_skipped=false, but the upsert below might not unset it unless we strictly set it to false.
            // Let's handle it in the next update.
        }

        // DB Update
        if (userId) {
            // 1. Log to reading_history (Log)
            supabase.from('reading_history').insert({
                user_id: userId,
                article_id: idStr,
                article_title: metadata?.title,
                article_category: metadata?.category,
                reading_duration: readingDuration || 7
            }).then(({ error }) => {
                if (error) console.error("Error logging read:", error);
            });

            // 2. Update interaction state (Upsert)
            // Explicitly set is_skipped to false if we mark as read
             supabase.from('article_interactions').upsert({ 
               user_id: userId, article_id: idStr, is_read: true, is_skipped: false, last_interacted_at: new Date().toISOString() 
             }, { onConflict: 'user_id, article_id' }).then(({ error }) => {
                 if (error) console.error("Error marking as read utils:", error);
             });
        }
    };

    const markAsSkipped = async (id: string | number) => {
        const idStr = id.toString();

        if (skippedIds.includes(idStr) || readIds.includes(idStr)) return;

        const newIds = [...skippedIds, idStr];
        setSkippedIds(newIds);
        updateLocalStorage(STORAGE_KEY_SKIPPED, newIds);

        if (userId) {
            const { error } = await supabase.from('article_interactions').upsert({
                user_id: userId,
                article_id: idStr,
                is_skipped: true,
                last_interacted_at: new Date().toISOString()
            }, { onConflict: 'user_id, article_id' });

            if (error) console.error("Mark as Skipped Error:", error);
        }
    };

    const toggleLike = async (id: string | number) => {
        const idStr = id.toString();
        const isLiked = likedIds.includes(idStr);
        const newStatus = !isLiked;

        const newIds = newStatus
            ? [...likedIds, idStr]
            : likedIds.filter(i => i !== idStr);

        setLikedIds(newIds);
        updateLocalStorage(STORAGE_KEY_LIKES, newIds);

        if (userId) {
            const { error } = await supabase.from('article_interactions').upsert({
                user_id: userId,
                article_id: idStr, // Assuming UUID if possible, else might fail if table strictly UUID
                is_liked: newStatus,
                last_interacted_at: new Date().toISOString()
            }, { onConflict: 'user_id, article_id' });

            if (error) console.error("Toggle Like Error:", error);
        }
    };

    const toggleBookmark = async (id: string | number) => {
        const idStr = id.toString();
        const isBookmarked = bookmarkedIds.includes(idStr);
        const newStatus = !isBookmarked;

        const newIds = newStatus
            ? [...bookmarkedIds, idStr]
            : bookmarkedIds.filter(i => i !== idStr);

        setBookmarkedIds(newIds);
        updateLocalStorage(STORAGE_KEY_BOOKMARKS, newIds);

        if (userId) {
            const { error } = await supabase.from('article_interactions').upsert({
                user_id: userId,
                article_id: idStr,
                is_bookmarked: newStatus,
                last_interacted_at: new Date().toISOString()
            }, { onConflict: 'user_id, article_id' });

            if (error) console.error("Toggle Bookmark Error:", error);
        }
    };

    const isRead = (id: string | number) => readIds.includes(id?.toString());
    const isLiked = (id: string | number) => likedIds.includes(id?.toString());
    const isBookmarked = (id: string | number) => bookmarkedIds.includes(id?.toString());
    const isSkipped = (id: string | number) => skippedIds.includes(id?.toString());

    return {
        readIds, likedIds, bookmarkedIds, skippedIds,
        markAsRead, markAsSkipped, toggleLike, toggleBookmark,
        isRead, isLiked, isBookmarked, isSkipped,
        isLoaded, userId
    };
}
