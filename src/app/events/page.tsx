
'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Footer from '@/components/Footer';
import { Calendar, MapPin, ExternalLink, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface Event {
    id: number;
    nom: string;
    description: string;
    ville: string;
    date: string;
    url: string;
    created_at: string;
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEvents() {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('date', { ascending: true });

            if (error) {
                console.error('Error fetching events:', error);
            } else {
                setEvents(data || []);
            }
            setLoading(false);
        }

        fetchEvents();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6 border border-indigo-200 dark:border-indigo-800/50">
                        <Sparkles className="w-3 h-3" />
                        Agenda IA & No-Code
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6">
                        Les <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Événements</span> à ne pas manquer
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Restez à la pointe de l'innovation. Découvrez les conférences, meetups et ateliers
                        référencés par notre communauté.
                    </p>
                </div>
            </section>

            {/* Events Grid */}
            <section className="container mx-auto px-4 pb-32">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                    </div>
                ) : events.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className="group relative bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[32px] overflow-hidden border border-gray-100 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                            >
                                {/* Visual Accent */}
                                <div className="h-3 w-full bg-gradient-to-r from-indigo-600 to-purple-600" />

                                <div className="p-8">
                                    <div className="flex items-center gap-3 mb-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        {new Date(event.date).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 transition-colors">
                                        {event.nom}
                                    </h3>

                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-4">
                                        <MapPin className="w-4 h-4" />
                                        <span>{event.ville}</span>
                                    </div>

                                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-8 line-clamp-3">
                                        {event.description}
                                    </p>

                                    <a
                                        href={event.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center w-full gap-2 px-6 py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-all duration-300 shadow-lg shadow-gray-200 dark:shadow-none"
                                    >
                                        Voir l'événement
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-900/30 rounded-[40px] border border-dashed border-gray-300 dark:border-slate-800">
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            Aucun événement prévu pour le moment. Revenez bientôt !
                        </p>
                    </div>
                )}
            </section>

            <Footer />
        </div>
    );
}
