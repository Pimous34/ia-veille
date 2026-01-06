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

  // Supabase client is stable
  const [supabase] = useState(() => createClient())

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
      // On retire l'order by SQL ici car on va trier plus finement en JS

    if (error) {
      console.error('Error fetching cards:', error)
    } else {
        // Map to UI friendly structure
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: UIFlashcard[] = (data || []).map((card: any) => ({
            ...card,
            front_content: card.flashcard_templates?.front || card.front || 'Question manquante',
            back_content: card.flashcard_templates?.back || card.back || 'Réponse manquante',
            category: card.flashcard_templates?.category || 'Général'
        }))

        // 🧠 ALGORITHME DE TRI PÉDAGOGIQUE
        const sortedCards = mapped.sort((a, b) => {
            // 1. Tri par Ordre Curriculaire (Le parcours du Chef de Projet)
            const orderA = CURRICULUM_ORDER[a.category] || 99;
            const orderB = CURRICULUM_ORDER[b.category] || 99;
            if (orderA !== orderB) return orderA - orderB;
    
            // 2. Tri par Difficulté (Commencer par le plus simple dans le topic)
            return a.difficulty - b.difficulty;
        });
    
        // 3. Paquet de 10 cartes max pour la session
        const sessionPack = sortedCards.slice(0, 10);

        setFlashcards(sessionPack)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      {/* Header - Matching Homepage Style */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between relative">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors font-medium">
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Retour à l&apos;accueil</span>
            </Link>
            
            <h1 className="absolute left-1/2 transform -translate-x-1/2 text-xl font-bold text-gray-800 tracking-tight">
            Révisions <span className="text-indigo-600">Flashcards</span>
            </h1>

            <div className="w-8"></div> {/* Spacer for centering */}
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center justify-center py-8">
        <div className="w-full max-w-4xl px-4 flex flex-col items-center justify-center">
        
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
          <div className="w-full h-[60vh] perspective-1000 relative group max-h-[600px]">
            <div 
                className={`relative w-full h-full duration-500 transform-style-3d transition-all cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                onClick={!isFlipped ? handleFlip : undefined}
            >
              {/* Front */}
              <div className="absolute w-full h-full bg-white border border-gray-200 rounded-3xl p-6 md:p-12 flex flex-col items-center justify-center backface-hidden shadow-xl overflow-y-auto hide-scrollbar">
                 
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
              <div className="absolute w-full h-full bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-12 flex flex-col backface-hidden rotate-y-180 shadow-xl overflow-y-auto custom-scrollbar">
                 
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

                 <div className="flex-1 flex flex-col items-center justify-center mt-16 pb-8">
                    <RichContent content={flashcards[currentCardIndex].back_content} />
                 </div>
              </div>
            </div>

            {/* Controls (Only visible when flipped) */}
            {isFlipped && (
               <div className="absolute -bottom-24 left-0 w-full grid grid-cols-3 gap-4 animate-slide-up">
                  <button onClick={() => handleRate(Rating.Again)} className="group py-4 rounded-2xl bg-white border border-red-100 text-red-600 shadow-sm hover:bg-red-50 hover:border-red-200 hover:shadow-md transition-all flex flex-col items-center">
                    <span className="font-bold text-sm md:text-base group-hover:scale-105 transition-transform">À revoir</span>
                    <span className="text-[10px] uppercase opacity-70 font-semibold tracking-wide mt-1 text-red-400">{nextIntervals[Rating.Again]}</span>
                  </button>
                  
                  {/* Mapped 'Hard' button to 'Presque bon' - Changed to Amber for better distinction */}
                  <button onClick={() => handleRate(Rating.Hard)} className="group py-4 rounded-2xl bg-white border border-amber-100 text-amber-600 shadow-sm hover:bg-amber-50 hover:border-amber-200 hover:shadow-md transition-all flex flex-col items-center">
                    <span className="font-bold text-sm md:text-base group-hover:scale-105 transition-transform">Presque bon</span>
                    <span className="text-[10px] uppercase opacity-70 font-semibold tracking-wide mt-1 text-amber-500">{nextIntervals[Rating.Hard]}</span>
                  </button>

                  {/* Removed 'Good' button as requested */}

                  {/* Mapped 'Easy' button to 'Je connais' */}
                  <button onClick={() => handleRate(Rating.Easy)} className="group py-4 rounded-2xl bg-white border border-green-100 text-green-600 shadow-sm hover:bg-green-50 hover:border-green-200 hover:shadow-md transition-all flex flex-col items-center">
                    <span className="font-bold text-sm md:text-base group-hover:scale-105 transition-transform">Je connais</span>
                    <span className="text-[10px] uppercase opacity-70 font-semibold tracking-wide mt-1 text-green-400">{nextIntervals[Rating.Easy]}</span>
                  </button>
               </div>
            )}
          </div>
        )}

        <div className="fixed bottom-4 right-4 md:static md:mt-24 text-center text-xs font-medium text-gray-400">
            Carte {flashcards.length > 0 ? currentCardIndex + 1 : 0} sur {flashcards.length}
        </div>

        </div>
      </main>
    </div>
  )
}
