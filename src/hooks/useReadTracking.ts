'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

const STORAGE_KEY = 'oreegamia_read_items';

/**
 * Hook to manage the read status of items (articles/videos).
 * Persists data in localStorage.
 */
export function useReadTracking() {
    const [readIds, setReadIds] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from storage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setReadIds(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load read status:', e);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    const [supabase] = useState(() => createClient());

    // Track items read in this session to prevent spamming the API on scroll
    const sessionReadIds = useRef<Set<string>>(new Set());

    const markAsRead = async (id: string | number, meta?: { title?: string, category?: string, tags?: string[], duration?: number }) => {
        const idStr = id.toString();
        
        // 1. Update Local Storage (Persistent)
        if (!readIds.includes(idStr)) {
            const newIds = [...readIds, idStr];
            setReadIds(newIds);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
            } catch (e) {
                console.error('Failed to save read status:', e);
            }
        }

        // 2. Sync with Supabase (if not done in this session)
        if (!sessionReadIds.current.has(idStr)) {
            sessionReadIds.current.add(idStr); // Mark as processed for this session
            
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const { error } = await supabase.from('reading_history').insert({
                        user_id: session.user.id,
                        article_id: id,
                        read_at: new Date().toISOString(),
                        article_title: meta?.title || 'Article sans titre',
                        article_category: meta?.category || 'Non catégorisé',
                        article_tags: meta?.tags || [],
                        reading_duration: meta?.duration || 0
                        // device field removed as it does not exist in schema
                    });

                    if (!error) {
                        // console.log("Synced read to Supabase");
                        // Optional: trigger a toast or UI update? 
                        // For now we keep it silent to not annoy user, or maybe small indicator?
                    } else {
                        console.error("Supabase insert error:", error);
                    }
                }
            } catch (err) {
                console.error("Failed to sync read status to Supabase", err);
            }
        }
    };

    const isRead = (id: string | number) => {
        if (!id) return false;
        return readIds.includes(id.toString());
    };

    return { readIds, markAsRead, isRead, isLoaded };
}
