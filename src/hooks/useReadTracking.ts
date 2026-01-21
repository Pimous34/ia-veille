'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

const STORAGE_KEY = 'oreegamia_read_items';

interface ArticleMetadata {
    title: string;
    category?: string;
    tags?: string[];
    duration?: number;
}

/**
 * Hook to manage the read status of items (articles/videos).
 * Persists data in localStorage and syncs with Supabase reading_history table.
 */
export function useReadTracking() {
    const [readIds, setReadIds] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [supabase] = useState(() => createClient());
    const [userId, setUserId] = useState<string | null>(null);

    // Track items read in this session to prevent spamming the API
    const sessionReadIds = useRef<Set<string>>(new Set());

    // Load initial data from LocalStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const ids = JSON.parse(stored);
                setReadIds(ids);
                ids.forEach((id: string) => sessionReadIds.current.add(id));
            }
        } catch (e) {
            console.error('Failed to load read status:', e);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Auth Listener & DB Sync
    useEffect(() => {
        const fetchUserHistory = async (uid: string) => {
            try {
                const { data: historyData, error } = await supabase
                    .from('reading_history')
                    .select('article_id')
                    .eq('user_id', uid);

                if (!error && historyData) {
                    const dbIds = historyData.map(item => item.article_id);
                    setReadIds(prev => {
                         const merged = [...new Set([...prev, ...dbIds])];
                         // Update local storage with merged data
                         localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
                         merged.forEach((id: string) => sessionReadIds.current.add(id));
                         return merged;
                    });
                }
            } catch (e) {
                console.error('Failed to reload read status on auth change:', e);
            }
        };

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUserId(session.user.id);
                await fetchUserHistory(session.user.id);
            } else {
                setUserId(null);
            }
        });

        // Initial check if session exists
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUserId(session.user.id);
                fetchUserHistory(session.user.id);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [supabase]);

    const markAsRead = async (id: string | number, metadata?: ArticleMetadata) => {
        const idStr = id.toString();

        if (sessionReadIds.current.has(idStr)) return;
        
        // Update Session Ref immediately
        sessionReadIds.current.add(idStr);

        // 1. Update State & LocalStorage
        const newIds = [...readIds, idStr];
        setReadIds(newIds);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
        } catch (e) {
            console.error('Failed to save read status to localStorage:', e);
        }

        // 2. Sync to DB if logged in
        if (userId && metadata) {
            // console.log(`💾 Saving article ${idStr} to reading_history for user ${userId}`);
             try {
                await supabase.from('reading_history').insert({
                    user_id: userId,
                    article_id: idStr,
                    article_title: metadata.title,
                    article_category: metadata.category || null,
                    article_tags: metadata.tags || [],
                    reading_duration: metadata.duration || 7,
                    read_at: new Date().toISOString()
                });
            } catch (err) {
                console.error("Failed to sync read status to Supabase", err);
            }
        }
    };

    const isRead = (id: string | number) => {
        if (!id) return false;
        return readIds.includes(id.toString());
    };

    return { readIds, markAsRead, isRead, isLoaded, userId };
}
