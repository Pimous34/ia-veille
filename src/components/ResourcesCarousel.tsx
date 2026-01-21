'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ChevronLeft, ChevronRight, FileText, Download } from 'lucide-react';

interface ResourceIntervenant {
    id: number;
    prenom: string;
    nom: string;
    sujet_intervention: string;
    infos_apprenants: string | null;
    fichiers: string[] | null; // Array of filenames/paths
    created_at: string;
}

export default function ResourcesCarousel() {
    const [resources, setResources] = useState<ResourceIntervenant[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchResources = async () => {
            try {
                // Fetch resources ordered by creation date (storage order)
                const { data, error } = await supabase
                    .from('ressources_intervenants')
                    .select('*')
                    .order('created_at', { ascending: false }); // Newest first, or true for oldest (storage order usually implies chronological)

                if (error) {
                    console.error('Error fetching resources:', error);
                } else if (data) {
                    setResources(data);
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchResources();
    }, [supabase]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % resources.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + resources.length) % resources.length);
    };

    const getPublicUrl = (filename: string) => {
        // Assuming filenames are simple paths in the bucket
        const { data } = supabase.storage
            .from('ressources-intervenants')
            .getPublicUrl(filename);
        return data.publicUrl;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-[260px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (resources.length === 0) {
        return null; // Don't show anything if no resources
    }

    const currentResource = resources[currentIndex];

    // Safety check just in case
    if (!currentResource) return null;

    // Handle files - assuming 'fichiers' is an array of strings (filenames)
    // If it's a JSON array in a text column, we might need parsing, but Supabase text[] is usually auto-parsed by JS client.
    // If n8n sends raw string like ["file1.pdf"], it works.
    let displayedFiles: string[] = [];
    if (Array.isArray(currentResource.fichiers)) {
        displayedFiles = currentResource.fichiers;
    } else if (typeof currentResource.fichiers === 'string') {
        try {
            // Handle case where it might be a JSON string
            displayedFiles = JSON.parse(currentResource.fichiers);
        } catch {
            // Or just a single filename string
            displayedFiles = [currentResource.fichiers];
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col h-[420px] relative transition-all hover:shadow-lg group">
            {/* Header / Top Band */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-3 flex items-center justify-between text-white">
                <h4 className="font-bold text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Ressources Intervenants
                </h4>
                <div className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {currentIndex + 1} / {resources.length}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col justify-between relative">
                {/* Top Section: Title & Name */}
                <div className="pr-8"> {/* Right padding to avoid overlap with right arrow if text is long */}
                    <h3 className="font-bold text-2xl text-gray-900 leading-tight mb-2">
                        {currentResource.sujet_intervention || "Intervention"}
                    </h3>
                    <p className="text-lg text-indigo-600 font-medium">
                        {currentResource.prenom} {currentResource.nom}
                    </p>
                </div>

                {/* Bottom Section: Info & Files */}
                <div className="mt-4">
                    {currentResource.infos_apprenants && (
                        <div className="bg-gray-50 p-4 rounded-xl text-base text-gray-700 italic border border-gray-100 mb-5 relative">
                            {/* Decorative quote icon opacity */}
                            <span className="absolute top-2 left-2 text-4xl text-indigo-100 pointer-events-none select-none font-serif leading-none">“</span>
                            <p className="relative z-10 pl-2">
                                {currentResource.infos_apprenants}
                            </p>
                        </div>
                    )}

                    {/* Files */}
                    <div className="space-y-2">
                        {displayedFiles.map((file, idx) => {
                            let cleanName = file.replace(/^["'\[\]]+|["'\[\]]+$/g, '').trim();
                            // Remove bucket prefix if it exists to avoid double path in getPublicUrl
                            cleanName = cleanName.replace(/^ressources-intervenants\//, '');

                            if (!cleanName) return null;

                            return (
                                <a
                                    key={idx}
                                    href={getPublicUrl(cleanName)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-sm font-semibold text-gray-700 hover:text-indigo-600 p-3 rounded-xl hover:bg-indigo-50 transition-all border border-gray-200 hover:border-indigo-200 group/file"
                                >
                                    <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg group-hover/file:bg-indigo-200 transition-colors">
                                        <Download className="w-4 h-4" />
                                    </div>
                                    <span className="truncate flex-1">{cleanName}</span>
                                </a>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Navigation Arrows */}
            {resources.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                        className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 text-gray-700 shadow-md hover:bg-white hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        aria-label="Précédent"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 text-gray-700 shadow-md hover:bg-white hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        aria-label="Suivant"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}
        </div>
    );
}
