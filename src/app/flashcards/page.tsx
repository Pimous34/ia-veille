'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Flashcard, reviewFlashcard, getNextIntervals } from '@/lib/fsrs'
import { Rating } from 'ts-fsrs'
import Link from 'next/link'
import { ArrowLeft, Check, BrainCircuit } from 'lucide-react'

// Extended Flashcard for UI with joined template data
interface UIFlashcard extends Flashcard {
  front_content: string;
  back_content: string;
  category: string;
}

// Helper component for pedestrian text formatting
function RichContent({ content }: { content: string }) {
  if (!content) return null;

  // 1. Handle new lines
  const lines = content.split('\n');

  return (
    <div className="w-full text-center space-y-6">
      {lines.map((line, i) => {
        // 2. Handle bullet points
        if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
           return (
             <div key={i} className="flex gap-4 items-start justify-center pl-2">
               <span className="text-indigo-500 mt-2 text-2xl md:text-4xl">•</span>
               <span className="text-gray-900 text-2xl md:text-3xl text-left max-w-[85%] font-bold leading-snug">
                 {parseInline(line.replace(/^[-•] /, ''))}
               </span>
             </div>
           )
        }
        
        // Standard paragraph - Matching Question Text Style
        return (
          <p key={i} className="text-gray-900 leading-snug text-2xl md:text-4xl font-bold max-w-prose mx-auto">
            {parseInline(line)}
          </p>
        )
      })}
    </div>
  )
}

// Simple parser for inline code (backticks) and simple styling
function parseInline(text: string) {
  // Regex to match text inside backticks `code`
  const parts = text.split(/(`[^`]+`)/);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      const code = part.slice(1, -1);
      return (
        <code key={index} className="bg-gray-100 text-indigo-600 px-1.5 py-0.5 rounded-md font-mono text-base border border-gray-200 font-semibold">
          {code}
        </code>
      );
    }
    return part;
  });
}

// Ordre logique d'apprentissage pour devenir Chef de Projet Digital
const CURRICULUM_ORDER: Record<string, number> = {
  'Jargon Startup & Tech': 1,
  'Culture Web & Tech': 2,
  'Frontend & UX': 3,
  'No-Code & Automation': 4,
  'API & Make': 5,
  'Backend & Data': 6,
  'IA & No-Code': 7,
  'IA & Génération': 8,
};

export default function FlashcardsPage() {
  const [loading, setLoading] = useState(true)
  const [flashcards, setFlashcards] = useState<UIFlashcard[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [nextIntervals, setNextIntervals] = useState<Record<number, string>>({})

  const [hoveredZone, setHoveredZone] = useState<Rating | null>(null)
  const [userNotes, setUserNotes] = useState('')

  // Supabase client is stable
  const [supabase] = useState(() => createClient())
  
  // ... (fetchDueFlashcards logic remains unchanged) ...

  const fetchDueFlashcards = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        setLoading(false)
        return
    }

    // Fetch cards that are due
    const { data, error } = await supabase
      .from('user_flashcards')
      .select(`
        *,
        flashcard_templates (
          front,
          back,
          category
        )
      `)
      .eq('user_id', user.id)
      .lte('due', new Date().toISOString()) 

    if (error) {
      console.error('Error fetching cards:', error)
    } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: UIFlashcard[] = (data || []).map((card: any) => ({
            ...card,
            front_content: card.flashcard_templates?.front || card.front || 'Question manquante',
            back_content: card.flashcard_templates?.back || card.back || 'Réponse manquante',
            category: card.flashcard_templates?.category || 'Général'
        }))

        const sortedCards = mapped.sort((a, b) => {
            const orderA = CURRICULUM_ORDER[a.category] || 99;
            const orderB = CURRICULUM_ORDER[b.category] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return a.difficulty - b.difficulty;
        });
    
        const sessionPack = sortedCards.slice(0, 10);
        setFlashcards(sessionPack)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchDueFlashcards()
  }, [fetchDueFlashcards])
  
  const handleFlip = () => {
    if (!isFlipped && flashcards[currentCardIndex]) {
        // Calculate intervals to show on buttons only when flipping
        const intervals = getNextIntervals(flashcards[currentCardIndex])
        setNextIntervals(intervals)
    }
    setIsFlipped(!isFlipped)
  }

  const handleRate = async (rating: Rating) => {
    const currentCard = flashcards[currentCardIndex]
    
    // 1. Calculate new state
    const updatedCardState = reviewFlashcard(currentCard, rating)

    // 2. Update DB
    const { error } = await supabase
        .from('user_flashcards')
        .update({
            due: updatedCardState.due,
            stability: updatedCardState.stability,
            difficulty: updatedCardState.difficulty,
            elapsed_days: updatedCardState.elapsed_days,
            scheduled_days: updatedCardState.scheduled_days,
            reps: updatedCardState.reps,
            lapses: updatedCardState.lapses,
            learning_steps: updatedCardState.learning_steps, // Include this
            state: updatedCardState.state,
            last_review: updatedCardState.last_review
        })
        .eq('id', currentCard.id)

    if (error) console.error('Error saving review:', error)

    // 3. Move to next card
    setIsFlipped(false)
    setHoveredZone(null) // Reset hover state
    if (currentCardIndex < flashcards.length - 1) {
        setCurrentCardIndex(prev => prev + 1)
    } else {
        setSessionComplete(true)
    }
  }

  const addRandomCard = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Fetch random templates the user DOES NOT have
    const { data: userCards } = await supabase
      .from('user_flashcards')
      .select('template_id')
      .eq('user_id', user.id);

    const ownedTemplateIds = userCards?.map(c => c.template_id).filter(id => id !== null) || [];
    
    // Simplification for performance: just fetch random templates and pick one that isn't owned locally
    // In a real large app, use a RPC function
    const { data: templates } = await supabase
      .from('flashcard_templates')
      .select('*')
      .limit(50); // Fetch a batch

    if (!templates) return;

    const availableTemplates = templates.filter(t => !ownedTemplateIds.includes(t.id));

    if (availableTemplates.length === 0) {
      alert("Vous avez ajouté toutes les cartes disponibles dans ce lot !");
      return;
    }

    const randomTemplate = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];

    await supabase.from('user_flashcards').insert({
        user_id: user.id,
        template_id: randomTemplate.id,
        due: new Date().toISOString(),
        lapses: 0,
        reps: 0,
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        learning_steps: 0,
        state: 0,
        last_review: null
    });

    // Refresh UI
    fetchDueFlashcards();
    setSessionComplete(false); // Reset session if completed
  };

  const handleMarkAsUseless = async () => {
    const currentCard = flashcards[currentCardIndex];
    if (!currentCard) return;

    if (confirm("Êtes-vous sûr de vouloir supprimer cette carte de vos révisions ?")) {
        // Delete from DB
        const { error } = await supabase
            .from('user_flashcards')
            .delete()
            .eq('id', currentCard.id);

        if (error) {
            console.error('Error deleting card:', error);
            alert("Erreur lors de la suppression de la carte.");
            return;
        }

        // Move to next card
        setIsFlipped(false);
        setHoveredZone(null);
        if (currentCardIndex < flashcards.length - 1) {
            setCurrentCardIndex(prev => prev + 1);
        } else {
            // Remove the card from local state to avoid "empty" end screen if it was the last one
            const newCards = [...flashcards];
            newCards.splice(currentCardIndex, 1);
            setFlashcards(newCards);
            
            if (newCards.length === 0) {
                 // Check if session is truly complete or if we just emptied the list
                 setSessionComplete(true);
            } else {
                 // If there are still cards but we deleted the last one, go back or finish
                 setSessionComplete(true); 
            }
        }
    }
  };

  // UI Render Logic
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans overflow-hidden">
      {/* Header - Matching Homepage Style */}
      {/* Header - Separated & Lowered */}
      <header className="fixed top-6 inset-x-0 z-50 px-4 pointer-events-none flex items-center justify-center h-20">
        
        {/* Left: Back Button - Independent Glass Pill */}
        <Link href="/" className="pointer-events-auto absolute left-4 md:left-10 flex items-center gap-2 px-6 py-3 rounded-full bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:bg-white hover:-translate-y-0.5 transition-all text-gray-600 hover:text-indigo-600 font-bold group z-50">
            <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline text-base">Retour</span>
        </Link>
        
        {/* Center: Title - Bigger & Centered Pill */}
        <div className="pointer-events-auto px-14 py-4 rounded-[50px] bg-[linear-gradient(135deg,rgba(255,235,59,0.15)_0%,rgba(255,152,0,0.15)_25%,rgba(255,107,157,0.15)_50%,rgba(156,39,176,0.15)_75%,rgba(33,150,243,0.15)_100%)] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border-t-2 border-t-white/80 border-l-2 border-l-white/80 border-b-2 border-b-[#1565C0]/50 border-r-2 border-r-[#1565C0]/50 transition-all duration-300 transform hover:scale-[1.02]">
            <h1 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight text-center">
                Zone des <span className="text-indigo-600">connaissances</span>
            </h1>
        </div>

      </header>

      <main className="flex-1 w-full flex flex-col items-center justify-start overflow-y-auto pt-4 pb-12">
        {/* Spacer to push content below fixed header */}
        <div className="w-full h-32 md:h-40 shrink-0" />
        
        <div className="w-full max-w-4xl px-4 flex flex-col items-center justify-center relative gap-4">
        
        {sessionComplete ? (
           <div className="w-full max-w-lg text-center space-y-6 animate-fade-in py-10 bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
             <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center border border-green-200">
                <Check size={48} className="text-green-600" />
             </div>
             <h2 className="text-3xl font-bold text-gray-900">Session terminée !</h2>
             <p className="text-gray-600">Vous avez révisé toutes vos cartes pour le moment.</p>
             <div className="flex flex-col gap-4 items-center">
                <Link 
                  href="/"
                  className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-transform hover:scale-105 shadow-md"
                >
                  Retour à l&apos;accueil
                </Link>
                <button 
                   onClick={addRandomCard}
                   className="text-sm text-gray-400 hover:text-indigo-600 underline mt-4 transition-colors"
                >
                   (Debug) Ajouter une nouvelle carte
                </button>
             </div>
           </div>
        ) : flashcards.length === 0 ? (
          <div className="text-center space-y-6 py-10 bg-white p-8 rounded-3xl shadow-lg border border-gray-100 max-w-lg">
            <div className="mx-auto w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
               <BrainCircuit size={48} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Rien à réviser pour l&apos;instant !</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Revenez plus tard quand vos cartes seront dues, ou ajoutez-en de nouvelles depuis la bibliothèque.
            </p>
             {/* Debug Button to Add Random Card */}
             <button 
                onClick={addRandomCard}
                className="mt-6 px-6 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full hover:bg-indigo-600 hover:text-white transition-all text-sm font-semibold shadow-sm"
             >
                + (Debug) Ajouter une carte aléatoire
             </button>
          </div>
        ) : (
            <div className="flex flex-col w-full items-center gap-24 mt-8">
            {/* "Comprendre" Input Section - Horizontal Layout */}
            <div className="w-full max-w-max flex flex-col md:flex-row items-center justify-center gap-4 animate-fade-in-down px-4 shrink-0 mx-auto">
                <label htmlFor="notes" className="text-black font-black uppercase tracking-tight text-2xl md:text-4xl whitespace-nowrap">
                    Comprendre :
                </label>
                <div className="relative group flex items-center border-b-2 border-black/10 pb-1 w-fit min-w-[300px]">
                    <textarea 
                        id="notes"
                        value={userNotes}
                        onChange={(e) => setUserNotes(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                            }
                        }}
                        placeholder="Explique-moi..."
                        className="bg-transparent p-0 text-gray-900 placeholder-gray-300 outline-none resize-none text-2xl md:text-4xl font-black transition-all focus:placeholder-transparent overflow-hidden scrollbar-hide w-full text-center md:text-left"
                        style={{ fieldSizing: "content" } as React.CSSProperties}
                    />
                </div>
            </div>

            <div className="w-full h-[50vh] perspective-1000 relative group max-h-[600px] mb-8">
            
            {/* Interactive Hover Zones (Visible ON TOP when flipped) */}
            {isFlipped && (
                <div className="absolute -inset-x-8 -top-8 -bottom-16 z-10 grid grid-cols-3 pointer-events-auto">
                    {/* Left Zone: Again */}
                    <div 
                        className={`transition-colors duration-200 cursor-pointer ${hoveredZone === Rating.Again ? 'bg-red-500/5' : ''}`}
                        onMouseEnter={() => setHoveredZone(Rating.Again)}
                        onMouseLeave={() => setHoveredZone(null)}
                        onClick={() => handleRate(Rating.Again)}
                    />
                    {/* Middle Zone: Hard */}
                    <div 
                        className={`transition-colors duration-200 cursor-pointer ${hoveredZone === Rating.Hard ? 'bg-amber-500/5' : ''}`}
                        onMouseEnter={() => setHoveredZone(Rating.Hard)}
                        onMouseLeave={() => setHoveredZone(null)}
                        onClick={() => handleRate(Rating.Hard)}
                    />
                    {/* Right Zone: Easy */}
                    <div 
                        className={`transition-colors duration-200 cursor-pointer ${hoveredZone === Rating.Easy ? 'bg-green-500/5' : ''}`}
                        onMouseEnter={() => setHoveredZone(Rating.Easy)}
                        onMouseLeave={() => setHoveredZone(null)}
                        onClick={() => handleRate(Rating.Easy)}
                    />
                </div>
            )}

            <div 
                className={`relative w-full h-full duration-500 transform-style-3d transition-all cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                onClick={!isFlipped ? handleFlip : undefined}
            >
              {/* Front */}
              <div className="absolute w-full h-full bg-white border border-gray-200 rounded-3xl p-6 md:p-12 flex flex-col items-center justify-center backface-hidden shadow-xl overflow-y-auto hide-scrollbar z-0">
                 
                 {/* Centered Question Label */}
                 <div className="absolute top-8 left-0 w-full flex justify-center items-center z-10">
                     <span className="text-xl font-black uppercase tracking-widest text-blue-600 bg-blue-50/80 px-6 py-2 rounded-full border border-blue-100 backdrop-blur-sm">
                        Question
                     </span>
                 </div>

                 <div className="absolute top-6 left-6 hidden md:block">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        {flashcards[currentCardIndex].category}
                    </span>
                 </div>
                 
                 <div className="flex-1 flex flex-col items-center justify-center w-full mt-16">
                    <div className="text-2xl md:text-4xl font-bold text-center leading-snug text-gray-900 max-w-prose">
                        {flashcards[currentCardIndex].front_content}
                    </div>
                 </div>
                 
                 <div className="mt-auto pt-6 text-sm font-semibold text-gray-400 animate-pulse flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                   Appuyez pour retourner
                 </div>
              </div>

              {/* Back */}
              <div className="absolute w-full h-full bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-12 flex flex-col backface-hidden rotate-y-180 shadow-xl overflow-y-auto custom-scrollbar z-0">
                 
                 {/* Centered Response Label - Lowered */}
                 <div className="absolute top-8 left-0 w-full flex justify-center items-center z-10">
                     <span className="text-xl font-black uppercase tracking-widest text-indigo-600 bg-white/90 px-6 py-2 rounded-full shadow-sm border border-indigo-100 backdrop-blur-sm">
                        Réponse
                     </span>
                 </div>

                 {/* Corner Category */}
                 <div className="absolute top-6 left-6 hidden md:block">
                     <span className="text-xs font-semibold text-gray-400 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                        {flashcards[currentCardIndex].category}
                     </span>
                 </div>

                 <div className="flex-1 flex flex-col items-center justify-center mt-16 pb-32">
                    <RichContent content={flashcards[currentCardIndex].back_content} />
                 </div>
              </div>
            </div>

            {/* Controls (Only visible when flipped) - Improved Overlay UI */}
            {isFlipped && (
               <div className="absolute -bottom-16 left-0 w-full px-4 md:px-12 grid grid-cols-3 gap-6 animate-slide-up z-20 pointer-events-none"> {/* Pointer events none on container to let clicks pass through to shared zones if needed, BUT buttons need pointer-events-auto */}
                  
                  {/* BUTTONS: Pointer events AUTO to catch direct clicks. 
                      Styling reacts to hoveredZone state for 'remote hover' effect */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRate(Rating.Again); }}
                    className={`pointer-events-auto group h-32 rounded-3xl border-2 transition-all flex flex-col items-center justify-center shadow-xl 
                        ${hoveredZone === Rating.Again 
                            ? 'bg-red-500 border-red-600 text-white scale-110 -translate-y-4 shadow-red-500/40' 
                            : 'bg-white border-red-50 text-red-600 shadow-red-100/50 hover:bg-red-50 hover:border-red-200 hover:-translate-y-1'}`}
                  >
                    <span className="font-black text-lg md:text-2xl transition-transform">À revoir</span>
                    <span className={`text-xs uppercase font-bold tracking-wider mt-1 ${hoveredZone === Rating.Again ? 'text-white/90' : 'text-red-400 opacity-80'}`}>
                        {nextIntervals[Rating.Again]}
                    </span>
                  </button>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRate(Rating.Hard); }} 
                    className={`pointer-events-auto group h-32 rounded-3xl border-2 transition-all flex flex-col items-center justify-center shadow-xl
                        ${hoveredZone === Rating.Hard 
                            ? 'bg-amber-500 border-amber-600 text-white scale-110 -translate-y-4 shadow-amber-500/40' 
                            : 'bg-white border-amber-50 text-amber-600 shadow-amber-100/50 hover:bg-amber-50 hover:border-amber-200 hover:-translate-y-1'}`}
                  >
                    <span className="font-black text-lg md:text-2xl transition-transform">Presque bon</span>
                    <span className={`text-xs uppercase font-bold tracking-wider mt-1 ${hoveredZone === Rating.Hard ? 'text-white/90' : 'text-amber-500 opacity-80'}`}>
                        {nextIntervals[Rating.Hard]}
                    </span>
                  </button>

                   <button 
                    onClick={(e) => { e.stopPropagation(); handleRate(Rating.Easy); }} 
                    className={`pointer-events-auto group h-32 rounded-3xl border-2 transition-all flex flex-col items-center justify-center shadow-xl
                        ${hoveredZone === Rating.Easy 
                            ? 'bg-green-500 border-green-600 text-white scale-110 -translate-y-4 shadow-green-500/40' 
                            : 'bg-white border-green-50 text-green-600 shadow-green-100/50 hover:bg-green-50 hover:border-green-200 hover:-translate-y-1'}`}
                  >
                    <span className="font-black text-lg md:text-2xl transition-transform">Je connais</span>
                    <span className={`text-xs uppercase font-bold tracking-wider mt-1 ${hoveredZone === Rating.Easy ? 'text-white/90' : 'text-green-400 opacity-80'}`}>
                        {nextIntervals[Rating.Easy]}
                    </span>
                  </button>
               </div>
            )}
            
            {/* Feedback Button (Useless) - Independent of Flipping, visible when flipped primarily, positioned below rating buttons */}
            {isFlipped && (
                 <div className="absolute -bottom-40 left-0 w-full flex justify-center pointer-events-auto z-30 animate-fade-in-up">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleMarkAsUseless(); }}
                        className="flex items-center gap-3 px-8 py-4 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-full transition-all border border-gray-200 hover:border-red-200 shadow-sm hover:scale-105"
                        title="Cette question est inutile pour la formation"
                    >
                        <span className="text-2xl">👎</span>
                        <span className="font-bold text-base">Inutile pour la formation</span>
                    </button>
                 </div>
            )}
          </div>
         </div>
        )}

        <div className="fixed bottom-4 right-4 md:static md:mt-12 text-center text-xs font-medium text-gray-400">
            Carte {flashcards.length > 0 ? currentCardIndex + 1 : 0} sur {flashcards.length}
        </div>

        </div>
      </main>
    </div>
  )
}
