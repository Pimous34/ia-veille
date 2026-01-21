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

export default function ResourcesCarousel({ embedded = false }: { embedded?: boolean }) {
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
                    .order('created_at', { ascending: false }); // Newest first

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
        const { data } = supabase.storage
            .from('ressources-intervenants')
            .getPublicUrl(filename);
        return data.publicUrl;
    };

    if (loading) {
        return (
            <div className={`flex items-center justify-center ${embedded ? 'h-[300px]' : 'bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-[260px]'}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (resources.length === 0) {
        return null;
    }

    const currentResource = resources[currentIndex];
    if (!currentResource) return null;

    let displayedFiles: string[] = [];
    if (Array.isArray(currentResource.fichiers)) {
        displayedFiles = currentResource.fichiers;
    } else if (typeof currentResource.fichiers === 'string') {
        try {
            displayedFiles = JSON.parse(currentResource.fichiers);
        } catch {
            displayedFiles = [currentResource.fichiers];
        }
    }

    // Dynamic classes based on 'embedded' prop
    const containerClasses = embedded 
        ? "flex flex-col h-full relative group" 
        : "bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col h-[420px] relative transition-all hover:shadow-lg group";

    return (
        <div className={containerClasses}>
            {/* Header / Top Band - Only show if NOT embedded */}
            {!embedded && (
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-3 flex items-center justify-between text-white">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Ressources Formateurs
                    </h4>
                    <div className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        {currentIndex + 1} / {resources.length}
                    </div>
                </div>
            )}

            {/* Embedded Counter */}
            {embedded && (
                 <div className="absolute top-0 right-0 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    {currentIndex + 1} / {resources.length}
                </div>
            )}

            {/* Content */}
            <div className={`flex-1 flex flex-col justify-between relative ${embedded ? 'pt-8' : 'p-6'}`}>
                {/* Top Section: Title & Name */}
                <div className="px-8"> 

                    <p className="text-lg text-indigo-600 font-medium text-center">
                        {currentResource.prenom} {currentResource.nom}
                    </p>
                </div>

                {/* Bottom Section: Info & Files */}
                <div className="mt-6 flex-1 flex flex-col justify-center">
                    {currentResource.infos_apprenants && (
                        <div className="bg-gray-50 p-6 rounded-2xl text-lg text-gray-700 italic border border-gray-100 mb-6 relative mx-4">
                            <span className="absolute top-4 left-4 text-5xl text-indigo-100 pointer-events-none select-none font-serif leading-none">“</span>
                            <p className="relative z-10 text-center">
                                {currentResource.infos_apprenants}
                            </p>
                        </div>
                    )}

                    {/* Files */}
                    <div className="space-y-3 px-4">
                        {displayedFiles.map((file, idx) => {
                            let cleanName = file.replace(/^["'\[\]]+|["'\[\]]+$/g, '').trim();
                            cleanName = cleanName.replace(/^ressources-intervenants\//, '');
                            if (!cleanName) return null;

                            return (
                                <a
                                    key={idx}
                                    href={getPublicUrl(cleanName)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 text-base font-semibold text-gray-700 hover:text-indigo-600 p-4 rounded-xl hover:bg-indigo-50 transition-all border border-gray-200 hover:border-indigo-200 group/file"
                                >
                                    <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg group-hover/file:bg-indigo-200 transition-colors">
                                        <Download className="w-5 h-5" />
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
                        className="absolute left-0 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all z-10 hover:shadow-md"
                        aria-label="Précédent"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all z-10 hover:shadow-md"
                        aria-label="Suivant"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>
                </>
            )}
        </div>
    );
}
