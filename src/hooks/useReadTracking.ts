'use client';

import { useState, useEffect } from 'react';

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

    const markAsRead = (id: string | number) => {
        const idStr = id.toString();
        if (!readIds.includes(idStr)) {
            const newIds = [...readIds, idStr];
            setReadIds(newIds);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
            } catch (e) {
                console.error('Failed to save read status:', e);
            }
        }
    };

    const isRead = (id: string | number) => {
        if (!id) return false;
        return readIds.includes(id.toString());
    };

    return { readIds, markAsRead, isRead, isLoaded };
}
