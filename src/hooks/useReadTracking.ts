'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

const STORAGE_KEY = 'oreegamia_read_items';

interface ArticleMetadata {
    title: string;
    category?: string;
    tags?: string[];
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

    // Track items read in this session to prevent spamming the API on scroll
    const sessionReadIds = useRef<Set<string>>(new Set());

    // Load user and read IDs on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                // Get current user
                const { data: { session } } = await supabase.auth.getSession();

                let localIds: string[] = [];
                let dbIds: string[] = [];

                // Load from localStorage first
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    localIds = JSON.parse(stored);
                }

                // If user is logged in, load from database
                if (session?.user) {
                    setUserId(session.user.id);

                    const { data: historyData, error } = await supabase
                        .from('reading_history')
                        .select('article_id')
                        .eq('user_id', session.user.id);

                    if (!error && historyData) {
                        dbIds = historyData.map(item => item.article_id);
                    }
                }

                // Merge localStorage and database IDs (remove duplicates)
                const mergedIds = [...new Set([...localIds, ...dbIds])];
                setReadIds(mergedIds);

                // Update localStorage with merged data
                if (mergedIds.length > 0) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedIds));
                }
            } catch (e) {
                console.error('Failed to load read status:', e);
            } finally {
                setIsLoaded(true);
            }
        };

        loadData();

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUserId(session.user.id);

                // Reload data from database when user logs in
                try {
                    const { data: historyData, error } = await supabase
                        .from('reading_history')
                        .select('article_id')
                        .eq('user_id', session.user.id);

                    if (!error && historyData) {
                        const dbIds = historyData.map(item => item.article_id);
                        const stored = localStorage.getItem(STORAGE_KEY);
                        const localIds = stored ? JSON.parse(stored) : [];
                        const mergedIds = [...new Set([...localIds, ...dbIds])];
                        setReadIds(mergedIds);
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedIds));
                    }
                } catch (e) {
                    console.error('Failed to reload read status on auth change:', e);
                }
            } else {
                setUserId(null);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [supabase]);

    const markAsRead = async (id: string | number, metadata?: ArticleMetadata, readingDuration?: number) => {
        const idStr = id.toString();

        // Skip if already marked as read
        if (readIds.includes(idStr)) {
            console.log(`ℹ️ Article ${idStr} already marked as read`);
            return;
        }

        console.log(`📖 Marking article ${idStr} as read`, { metadata, readingDuration });

        // Update localStorage
        const newIds = [...readIds, idStr];
        setReadIds(newIds);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
        } catch (e) {
            console.error('Failed to save read status to localStorage:', e);
        }

        // Save to database if user is logged in
        if (userId && metadata) {
            console.log(`💾 Saving to reading_history for user ${userId}`);
            console.log('📝 Data to insert:', {
                user_id: userId,
                article_id: idStr,
                article_title: metadata.title,
                article_category: metadata.category || null,
                article_tags: metadata.tags || null,
                reading_duration: readingDuration || 7,
                read_at: new Date().toISOString()
            });

            try {
                const { error, data } = await supabase
                    .from('reading_history')
                    .insert({
                        user_id: userId,
                        article_id: idStr,
                        article_title: metadata.title,
                        article_category: metadata.category || null,
                        article_tags: metadata.tags || null,
                        reading_duration: readingDuration || 7, // Default 7 seconds if not provided
                        read_at: new Date().toISOString()
                    })
                    .select();

                if (error) {
                    console.error('❌ Failed to save to reading_history:', error);
                    console.error('❌ Error details:', {
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code
                    });
                } else {
                    console.log(`✅ Successfully saved article ${idStr} to reading_history`, data);
                }
            } catch (e) {
                console.error('❌ Error saving to database:', e);
            }
        } else {
            console.log(`⚠️ Not saving to database: userId=${userId}, metadata=${!!metadata}`);
        }
    };

    const isRead = (id: string | number) => {
        if (!id) return false;
        return readIds.includes(id.toString());
    };

    return { readIds, markAsRead, isRead, isLoaded, userId };
}
