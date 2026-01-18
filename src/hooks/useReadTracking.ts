'use client';

import { useState, useEffect } from 'react';
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

    // Load user and read IDs on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                // Get current user
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    setUserId(session.user.id);
                }

                // Load from localStorage
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    setReadIds(JSON.parse(stored));
                }
            } catch (e) {
                console.error('Failed to load read status:', e);
            } finally {
                setIsLoaded(true);
            }
        };

        loadData();

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setUserId(session.user.id);
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
            return;
        }

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
            try {
                const { error } = await supabase
                    .from('reading_history')
                    .insert({
                        user_id: userId,
                        article_id: idStr,
                        article_title: metadata.title,
                        article_category: metadata.category || null,
                        article_tags: metadata.tags || null,
                        reading_duration: readingDuration || 7, // Default 7 seconds if not provided
                        read_at: new Date().toISOString()
                    });

                if (error) {
                    console.error('Failed to save to reading_history:', error);
                }
            } catch (e) {
                console.error('Error saving to database:', e);
            }
        }
    };

    const isRead = (id: string | number) => {
        if (!id) return false;
        return readIds.includes(id.toString());
    };

    return { readIds, markAsRead, isRead, isLoaded, userId };
}
