'use client';

import React from 'react';
import { ScrollText, Calendar, Clock } from 'lucide-react';

interface JtTextReaderProps {
    script: string;
    title?: string;
    date?: string;
}

const JtTextReader: React.FC<JtTextReaderProps> = ({ script, title, date }) => {
    // Process script to make it readable
    const formatScript = (text: string) => {
        if (!text) return [];

        let cleanText = text
            // 1. Convert <break> to newlines (structural)
            .replace(/<break[^>]*>/g, '\n')

            // 2. Decode common HTML entities
            .replace(/&#8230;/g, '...')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')

            // 3. AGGRESSIVE GARBAGE REMOVAL
            // Remove "a href" and "target" junk found in text 
            .replace(/a href="[^"]*"/g, '')
            .replace(/target="_blank"/g, '')

            // Remove "font color" junk
            .replace(/font color="#[a-fA-F0-9]{6}"/g, '')

            // Remove specific weird RSS artifacts
            .replace(/\/anbsp;nbsp;/g, '')
            .replace(/\/font/g, '')
            .replace(/\/anbs/g, '')
            .replace(/\/fo/g, '')

            // 4. Fallback: Remove any remaining standard HTML tags
            .replace(/<[^>]+>/g, '')

            // 5. Cleanup whitespace
            .replace(/\s+/g, ' ') // Collapse multiple spaces
            .replace(/ \./g, '.') // Fix spacing before dots
            .trim();

        return cleanText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    };

    const paragraphs = formatScript(script);

    return (
        <div className="w-full h-full bg-white dark:bg-slate-900 overflow-hidden flex flex-col relative">
            {/* Header / Meta Info */}
            <div className="p-6 pb-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400 font-medium text-xs uppercase tracking-wider">
                    <ScrollText className="w-4 h-4" />
                    <span>Transcription</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                    {title || "Journal Technologique"}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{date || "Édition du jour"}</span>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                <article className="prose prose-slate dark:prose-invert max-w-none prose-lg">
                    {paragraphs.length > 0 ? (
                        paragraphs.map((paragraph, index) => (
                            <p key={index} className="text-gray-700 dark:text-slate-300 leading-relaxed mb-6 last:mb-0 text-lg">
                                {paragraph}
                            </p>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400 dark:text-slate-600">
                            <p className="text-lg">Aucune transcription disponible pour ce journal.</p>
                        </div>
                    )}
                </article>

                {/* Footer Gradient for read-end effect */}
                <div className="h-12 w-full"></div>
            </div>

            {/* Reading Progress Indicator (Optional visual flair) */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-slate-700 to-transparent opacity-50 pointer-events-none"></div>
        </div>
    );
};

export default JtTextReader;
