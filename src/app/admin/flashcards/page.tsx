'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, CheckCircle, XCircle, Clock, Trash2, Brain, MessageSquare, AlertTriangle, Layers, Sparkles, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';

interface SuggestedFlashcard {
    id: string;
    user_id: string;
    front: string;
    back: string;
    category: string;
    status: 'pending' | 'approved' | 'rejected';
    type: 'new_card' | 'deletion';
    template_id?: string;
    created_at: string;
}

interface FlashcardTemplate {
    id: string;
    front: string;
    back: string;
    category: string;
    created_at: string;
}

type AdminView = 'suggestions' | 'current';

export default function AdminMemoCardsPage() {
    const router = useRouter();
    const [supabase] = useState(() => createClient());
    const [view, setView] = useState<AdminView>('suggestions');

    // Suggestions State
    const [suggestions, setSuggestions] = useState<SuggestedFlashcard[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);

    // Current Templates State
    const [templates, setTemplates] = useState<FlashcardTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 20;

    const [searchQuery, setSearchQuery] = useState('');
    const observer = useRef<IntersectionObserver | null>(null);

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newCardFront, setNewCardFront] = useState('');
    const [newCardBack, setNewCardBack] = useState('');
    const [newCardCategory, setNewCardCategory] = useState('Général');
    const [isCreating, setIsCreating] = useState(false);

    // Review/Edit Modal State
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewData, setReviewData] = useState<{
        suggestionId: string;
        front: string;
        back: string;
        category: string;
    } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // --- Fetch Logic ---

    const fetchSuggestions = useCallback(async () => {
        setLoadingSuggestions(true);
        try {
            const { data, error } = await supabase
                .from('suggested_flashcards')
                .select('id, user_id, front, back, category, status, type, template_id, created_at')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching suggestions:', error);
                toast.error("Erreur de chargement des suggestions");
            } else {
                setSuggestions(data || []);
            }
        } catch (err) {
            console.error('Fetch suggestions crash:', err);
        } finally {
            setLoadingSuggestions(false);
        }
    }, [supabase]);

    const fetchTemplates = useCallback(async (reset = false) => {
        // We use a ref for loading to avoid identity change of this function
        // but here we just accept that we won't put loadingTemplates in deps
        setLoadingTemplates(true);

        try {
            const currentPage = reset ? 0 : page;
            const start = currentPage * PAGE_SIZE;
            const end = start + PAGE_SIZE - 1;

            let query = supabase
                .from('flashcard_templates')
                .select('id, front, back, category, created_at')
                .order('created_at', { ascending: false })
                .range(start, end);

            if (searchQuery) {
                query = query.or(`front.ilike.%${searchQuery}%,back.ilike.%${searchQuery}%`);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching templates:', error);
                toast.error("Erreur de chargement des cartes mémo");
            } else {
                if (reset) {
                    setTemplates(data || []);
                    setPage(1);
                } else {
                    setTemplates(prev => [...prev, ...(data || [])]);
                    setPage(prev => prev + 1);
                }
                setHasMore((data || []).length === PAGE_SIZE);
            }
        } catch (err) {
            console.error('Fetch templates crash:', err);
        } finally {
            setLoadingTemplates(false);
        }
    }, [supabase, page, searchQuery]); // Removed loadingTemplates from deps to break the loop

    useEffect(() => {
        if (view === 'suggestions') {
            fetchSuggestions();
        } else {
            // Initial load for templates
            // We only call it if we are currently at page 0 or if we just switched view
            fetchTemplates(true);
        }
    }, [view]); // Minimal dependencies to prevent loops

    // --- Actions ---

    const handleApprove = async (suggestion: SuggestedFlashcard) => {
        if (suggestion.type === 'deletion') {
            if (!confirm('Approuver la SUPPRESSION définitive de cette carte mémo ?')) return;

            setLoadingSuggestions(true);
            const { error: delError } = await supabase
                .from('flashcard_templates')
                .delete()
                .eq('id', suggestion.template_id);

            if (delError) {
                toast.error("Erreur lors de la suppression du template");
                setLoadingSuggestions(false);
                return;
            }
        } else {
            // New interactive flow
            setLoadingSuggestions(true);
            const loadingToast = toast.loading("Optimisation pédagogique par l'IA en cours...");

            try {
                // 1. Get AI Optimization first
                let aiFront = suggestion.front;
                let aiBack = suggestion.back;

                const { data: aiData, error: aiError } = await supabase.functions.invoke('process-flashcard', {
                    body: {
                        front: suggestion.front,
                        back: suggestion.back,
                        category: suggestion.category
                    }
                });

                if (!aiError && aiData) {
                    aiFront = aiData.front;
                    aiBack = aiData.back;
                } else {
                    toast.error("IA indisponible, chargement du contenu original");
                }

                // 2. Open Modal for Review
                setReviewData({
                    suggestionId: suggestion.id,
                    front: aiFront,
                    back: aiBack,
                    category: suggestion.category
                });
                setIsReviewModalOpen(true);

            } catch (err) {
                console.error("Error preparing review:", err);
                toast.error("Erreur lors de la préparation");
            } finally {
                setLoadingSuggestions(false);
                toast.dismiss(loadingToast);
            }
            return; // Stop here, wait for modal confirmation
        }

        const { error: updateError } = await supabase
            .from('suggested_flashcards')
            .update({ status: 'approved' })
            .eq('id', suggestion.id);

        if (updateError) {
            toast.error("Erreur statut");
        } else {
            toast.success("Flashcard supprimée");
            fetchSuggestions();
        }
    };

    const handleFinalApprove = async () => {
        if (!reviewData) return;

        setIsProcessing(true);
        try {
            // 1. Insert into templates
            const { error: insertError } = await supabase
                .from('flashcard_templates')
                .insert({
                    front: reviewData.front,
                    back: reviewData.back,
                    category: reviewData.category
                });

            if (insertError) throw insertError;

            // 2. Update suggestion status
            const { error: updateError } = await supabase
                .from('suggested_flashcards')
                .update({ status: 'approved' })
                .eq('id', reviewData.suggestionId);

            if (updateError) throw updateError;

            toast.success("Carte validée et ajoutée !");
            setIsReviewModalOpen(false);
            setReviewData(null);
            fetchSuggestions();

        } catch (error) {
            console.error("Final approval error:", error);
            toast.error("Erreur lors de la sauvegarde finale");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRejectPost = async (id: string) => {
        const { error } = await supabase
            .from('suggested_flashcards')
            .update({ status: 'rejected' })
            .eq('id', id);

        if (error) toast.error("Erreur");
        else {
            toast.success("Suggestion rejetée");
            fetchSuggestions();
        }
    };

    const deleteTemplate = async (id: string) => {
        if (!confirm('Supprimer cette carte mémo définitivement ?')) return;
        const { error } = await supabase.from('flashcard_templates').delete().eq('id', id);
        if (error) toast.error("Erreur suppression");
        else {
            toast.success("Carte mémo supprimée");
            setTemplates(prev => prev.filter(t => t.id !== id));
        }
    };

    const handleCreateCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCardFront.trim() || !newCardBack.trim()) {
            toast.error("Veuillez remplir la question et la réponse");
            return;
        }

        setIsCreating(true);
        const { data, error } = await supabase
            .from('flashcard_templates')
            .insert({
                front: newCardFront,
                back: newCardBack,
                category: newCardCategory
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating card:', error);
            toast.error("Erreur lors de la création de la carte");
        } else {
            toast.success("Carte mémo créée avec succès !");
            setIsCreateModalOpen(false);
            setNewCardFront('');
            setNewCardBack('');
            setNewCardCategory('Général');

            // If we are in the library view, add it to the list
            if (view === 'current') {
                setTemplates(prev => [data, ...prev]);
            }
        }
        setIsCreating(false);
    };

    // --- Infinite Scroll ---
    const lastElementRef = useCallback((node: HTMLTableRowElement) => {
        if (loadingTemplates) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchTemplates();
            }
        });
        if (node) observer.current.observe(node);
    }, [loadingTemplates, hasMore, fetchTemplates]);

    return (
        <>
            <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
                {/* Sidebar */}
                <aside className="sidebar">
                    <Link href="/" className="sidebar-header group flex flex-col items-center gap-2 py-6 px-4">
                        <div className="relative w-full h-16 flex justify-center">
                            <Image
                                src="/logo.png"
                                alt="OREEGAM'IA"
                                fill
                                className="object-contain drop-shadow-sm"
                                priority
                                unoptimized
                            />
                        </div>
                        <div className="text-xs font-bold tracking-widest text-indigo-300 uppercase">Administration</div>
                    </Link>

                    <nav className="sidebar-nav">
                        <Link href="/admin" className="nav-item">
                            <span className="nav-icon">📊</span>
                            <span>Tableau de bord</span>
                        </Link>
                        <Link href="/admin/articles" className="nav-item">
                            <span className="nav-icon">📰</span>
                            <span>Articles</span>
                        </Link>
                        <Link href="/admin/users" className="nav-item">
                            <span className="nav-icon">🛡️</span>
                            <span>Gestion des Accès</span>
                        </Link>
                        <Link href="/admin/flashcards" className="nav-item active">
                            <span className="nav-icon">🧠</span>
                            <span>Cartes Mémo</span>
                        </Link>
                        <Link href="/admin/settings" className="nav-item">
                            <span className="nav-icon">⚙️</span>
                            <span>Paramètres</span>
                        </Link>
                    </nav>

                    <div className="user-profile">
                        <div className="avatar">A</div>
                        <div className="user-info">
                            <div className="user-name">Admin</div>
                            <div className="user-email">admin@oreegami.com</div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="main-content px-8">
                    <div className="top-bar mt-24 mb-12 flex justify-between items-end">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-indigo-500 w-fit">Gestion des Cartes Mémo</h1>
                            <p className="text-slate-500 dark:text-slate-400">Modérez les suggestions ou gérez la bibliothèque de connaissances.</p>
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm"
                            >
                                <Brain size={18} />
                                Ajouter une carte
                            </button>
                            <button onClick={() => router.push('/auth')} className="logout-btn text-sm text-gray-500 hover:text-indigo-600 transition-colors font-bold uppercase tracking-wider">
                                Déconnexion
                            </button>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex gap-4 mb-8">
                        <button
                            onClick={() => setView('suggestions')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${view === 'suggestions' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                        >
                            <MessageSquare size={18} />
                            <span>Suggestions ({suggestions.filter(s => s.status === 'pending').length})</span>
                        </button>
                        <button
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'current' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            <Layers size={16} />
                            <span>Bibliothèque</span>
                        </button>
                    </div>

                    {/* Search & Stats */}
                    <section className="content-section">
                        <div className="section-header">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder={view === 'suggestions' ? "Chercher dans les demandes..." : "Chercher une carte mémo..."}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && view === 'current' && fetchTemplates(true)}
                                    />
                                </div>
                                {view === 'current' && (
                                    <button
                                        onClick={() => fetchTemplates(true)}
                                        className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all"
                                    >
                                        Filtrer
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm p-6 overflow-hidden min-h-[400px]">
                            {view === 'suggestions' ? (
                                loadingSuggestions ? (
                                    <div className="py-20 text-center text-gray-400">Chargement...</div>
                                ) : (
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Type</th>
                                                <th className="w-[30%]">Question / Recto</th>
                                                <th className="w-[30%]">Réponse / Verso</th>
                                                <th>Statut</th>
                                                <th className="text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {suggestions.filter(s => s.status === 'pending').length === 0 ? (
                                                <tr>
                                                    <td colSpan={5}>
                                                        <div className="flex flex-col items-center gap-4 text-center max-w-sm mx-auto py-10">
                                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl">🏜️</div>
                                                            <div>
                                                                <h3 className="text-gray-900 font-bold">Aucune carte mémo</h3>
                                                                <p className="text-gray-500 text-sm">Il n&apos;y a aucune carte mémo en attente de validation pour le moment.</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                suggestions.filter(s => s.status === 'pending').map((s) => (
                                                    <tr key={s.id}>
                                                        <td>
                                                            {s.type === 'deletion' ? (
                                                                <span className="flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-md uppercase">
                                                                    <AlertTriangle size={12} /> Suppression
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">
                                                                    <Brain size={12} /> Nouveau
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="align-top font-bold text-gray-900 dark:text-white">{s.front}</td>
                                                        <td className="align-top text-sm text-gray-500 dark:text-gray-400 line-clamp-3">{s.back}</td>
                                                        <td className="align-top">
                                                            <span className="flex items-center gap-1 text-[10px] uppercase font-black px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">
                                                                <Clock size={12} /> Attente
                                                            </span>
                                                        </td>
                                                        <td className="text-right align-top">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button onClick={() => handleApprove(s)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg">
                                                                    <CheckCircle size={22} />
                                                                </button>
                                                                <button onClick={() => handleRejectPost(s.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                                                                    <XCircle size={22} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                )
                            ) : (
                                <>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th className="w-[40%]">Question</th>
                                                <th className="w-[40%]">Réponse</th>
                                                <th>Catégorie</th>
                                                <th className="text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {templates.map((t, index) => (
                                                <tr key={t.id} ref={index === templates.length - 1 ? lastElementRef : null}>
                                                    <td className="align-top font-bold text-gray-900 dark:text-white">{t.front}</td>
                                                    <td className="align-top text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">{t.back}</td>
                                                    <td className="align-top">
                                                        <span className="text-xs font-bold px-2 py-1 bg-gray-50 border border-gray-100 rounded text-gray-400 uppercase tracking-tighter">
                                                            {t.category}
                                                        </span>
                                                    </td>
                                                    <td className="text-right align-top">
                                                        <button onClick={() => deleteTemplate(t.id)} className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {loadingTemplates && <div className="py-10 text-center text-indigo-400">Chargement de la suite...</div>}
                                </>
                            )}
                        </div>
                    </section>
                </main>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-up">
                        <div className="px-8 py-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Nouvelle Carte Mémo</h2>
                                <p className="text-gray-500 text-sm">Créez une carte directement dans la bibliothèque</p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-gray-900"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCard} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Question (Recto)</label>
                                <textarea
                                    value={newCardFront}
                                    onChange={(e) => setNewCardFront(e.target.value)}
                                    placeholder="Quelle est la capitale de la France ?"
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all min-h-[100px] font-medium"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Réponse (Verso)</label>
                                <textarea
                                    value={newCardBack}
                                    onChange={(e) => setNewCardBack(e.target.value)}
                                    placeholder="Paris"
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all min-h-[150px] font-medium"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Catégorie</label>
                                    <select
                                        value={newCardCategory}
                                        onChange={(e) => setNewCardCategory(e.target.value)}
                                        className="w-full px-5 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition-all font-bold text-sm"
                                    >
                                        <option value="Général">Général</option>
                                        <option value="IA">IA</option>
                                        <option value="No-Code">No-Code</option>
                                        <option value="Automatisation">Automatisation</option>
                                        <option value="Jargon Tech">Jargon Tech</option>
                                        <option value="Frontend">Frontend</option>
                                        <option value="Backend">Backend</option>
                                        <option value="UX/UI">UX/UI</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all text-sm"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                                >
                                    {isCreating ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle size={20} />
                                            Ajouter à la bibliothèque
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {isReviewModalOpen && reviewData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsReviewModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                        <div className="px-8 py-6 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-indigo-900 flex items-center gap-2">
                                    <Sparkles className="text-indigo-600" size={24} />
                                    Validation & Édition IA
                                </h2>
                                <p className="text-indigo-600 text-sm font-medium">L&apos;IA a optimisé le contenu. Vérifiez et modifiez si besoin.</p>
                            </div>
                            <button
                                onClick={() => setIsReviewModalOpen(false)}
                                className="p-2 hover:bg-white/50 rounded-full transition-colors text-indigo-400 hover:text-indigo-900"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Editor Side */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 ml-1">
                                            <Brain size={14} /> Question (Recto)
                                        </label>
                                        <textarea
                                            value={reviewData.front}
                                            onChange={(e) => setReviewData({ ...reviewData, front: e.target.value })}
                                            className="w-full px-5 py-4 bg-white border-2 border-gray-100 focus:border-indigo-500 rounded-2xl outline-none transition-all min-h-[120px] font-bold text-lg text-gray-800 shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 ml-1">
                                            <MessageSquare size={14} /> Réponse (Verso)
                                        </label>
                                        <textarea
                                            value={reviewData.back}
                                            onChange={(e) => setReviewData({ ...reviewData, back: e.target.value })}
                                            className="w-full px-5 py-4 bg-white border-2 border-gray-100 focus:border-indigo-500 rounded-2xl outline-none transition-all min-h-[200px] text-gray-600 leading-relaxed shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Catégorie</label>
                                        <select
                                            value={reviewData.category}
                                            onChange={(e) => setReviewData({ ...reviewData, category: e.target.value })}
                                            className="w-full px-5 py-3 bg-white border-2 border-gray-100 focus:border-indigo-500 rounded-xl outline-none transition-all font-bold text-sm"
                                        >
                                            <option value="Général">Général</option>
                                            <option value="IA">IA</option>
                                            <option value="No-Code">No-Code</option>
                                            <option value="Automatisation">Automatisation</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Preview Side */}
                                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 text-center">Aperçu Carte</h3>

                                    <div className="flex-1 flex flex-col gap-6">
                                        {/* Front Card */}
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group">
                                            <span className="absolute top-4 left-4 text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Recto</span>
                                            <div className="text-center font-bold text-xl text-gray-900 py-8 px-4">
                                                {reviewData.front}
                                            </div>
                                        </div>

                                        {/* Back Card */}
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group flex-1">
                                            <span className="absolute top-4 left-4 text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Verso</span>
                                            <div className="text-sm text-gray-600 leading-7 py-4 px-2 whitespace-pre-wrap">
                                                {reviewData.back}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3 z-10 shadow-lg-up">
                            <button
                                onClick={() => setIsReviewModalOpen(false)}
                                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleFinalApprove}
                                disabled={isProcessing}
                                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-black hover:from-indigo-700 hover:to-violet-700 transition-all shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 disabled:opacity-70 disabled:scale-100"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Sauvegarde...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={20} />
                                        Valider et Ajouter
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
