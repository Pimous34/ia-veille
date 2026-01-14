'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { type Flashcard as DBFlashcard, reviewFlashcard, getNextIntervals } from '@/lib/fsrs'
import { Rating } from 'ts-fsrs'
import Link from 'next/link'
import { Check, BrainCircuit, Loader2, Sparkles, X, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { widgetsDb } from '@/lib/widgets-firebase'
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

// Extended Flashcard for UI with joined template data
export interface UIFlashcard extends DBFlashcard {
  front_content: string;
  back_content: string;
  category: string;
}

// Ordre logique d'apprentissage
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

// Helper components (kept separate to avoid clutter)
function RichContent({ content }: { content: string }) {
  if (!content) return null;
  const lines = content.split('\n');
  return (
    <div className="w-full text-center space-y-6">
      {lines.map((line, i) => {
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
        return (
          <p key={i} className="text-gray-900 leading-snug text-2xl md:text-4xl font-bold max-w-prose mx-auto">
            {parseInline(line)}
          </p>
        )
      })}
    </div>
  )
}

function parseInline(text: string) {
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

interface FlashcardsClientProps {
  initialFlashcards: UIFlashcard[];
  initialQuery?: string;
}

export default function FlashcardsClient({ initialFlashcards, initialQuery }: FlashcardsClientProps) {
  const { user, loading: authLoading } = useAuth()
  
  // We keep local loading state for internal operations (adding card), but initial load is done.
  const [loading, setLoading] = useState(false) 
  const [flashcards, setFlashcards] = useState<UIFlashcard[]>(initialFlashcards)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [nextIntervals, setNextIntervals] = useState<Record<number, string>>({})

  const [hoveredZone, setHoveredZone] = useState<Rating | null>(null)
  const [userNotes, setUserNotes] = useState(initialQuery || '')
  const [isExplaining, setIsExplaining] = useState(false)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [isWaitingForAi, setIsWaitingForAi] = useState(false)
  const [loadingAiMessage, setLoadingAiMessage] = useState('Analyse de la carte mémo...')
  const [isCustomExplanation, setIsCustomExplanation] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [supabase] = useState(() => createClient())
  
  // Re-fetch logic kept for "Add Random Card" feature
  const loadFlashcards = useCallback(async (mode: 'due' | 'all' = 'due') => {
    if (!user) return
    setLoading(true)
    
    try {
        let query = supabase
          .from('user_flashcards')
          .select(`
            *,
            flashcard_templates (
              front,
              back,
              category
            )
          `)
          .eq('user_id', user.id);

        if (mode === 'due') {
            query = query.lte('due', new Date().toISOString());
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching cards:', error)
          toast.error("Erreur lors du rechargement des cartes.")
        } else {
            if (data && data.length === 0 && mode === 'due') {
                await loadFlashcards('all');
                return;
            }

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
        
            setFlashcards(sortedCards.slice(0, 10));
            setCurrentCardIndex(0); // Reset index on reload
            setSessionComplete(false);
        }
    } catch (err) {
        console.error("Critical error in loadFlashcards:", err);
    } finally {
        setLoading(false)
    }
  }, [supabase, user])

  // Initial Auto-Focus
  useEffect(() => {
    if (!isExplaining && !loading && flashcards.length > 0) {
      inputRef.current?.focus()
    }
  }, [isExplaining, loading, flashcards.length])
  
  const handleFlip = () => {
    if (!isFlipped && flashcards[currentCardIndex]) {
        const intervals = getNextIntervals(flashcards[currentCardIndex])
        setNextIntervals(intervals)
    }
    setIsFlipped(!isFlipped)
  }

  const handleRate = async (rating: Rating) => {
    const currentCard = flashcards[currentCardIndex]
    
    // Optimistic UI Update possible here, but keeping it simple
    const updatedCardState = reviewFlashcard(currentCard, rating)

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
            learning_steps: updatedCardState.learning_steps,
            state: updatedCardState.state,
            last_review: updatedCardState.last_review
        })
        .eq('id', currentCard.id)

    if (error) console.error('Error saving review:', error)

    setIsFlipped(false)
    setHoveredZone(null)
    if (currentCardIndex < flashcards.length - 1) {
        setCurrentCardIndex(prev => prev + 1)
    } else {
        setSessionComplete(true)
    }
  }

  const addRandomCard = async () => {
    if (!user) {
        toast.error("Veuillez vous connecter pour ajouter des cartes.");
        return;
    }

    const { data: userCards } = await supabase
      .from('user_flashcards')
      .select('template_id')
      .eq('user_id', user.id);

    const ownedTemplateIds = userCards?.map(c => c.template_id).filter(id => id !== null) || [];
    
    const { data: templates } = await supabase
      .from('flashcard_templates')
      .select('*')
      .limit(50);

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

    loadFlashcards('due'); // Refresh list
  };

  const handleMarkAsUseless = async () => {
    const currentCard = flashcards[currentCardIndex];
    if (!currentCard) return;

    if (confirm("Êtes-vous sûr de vouloir supprimer cette carte de vos révisions ?")) {
        const { error: deleteError } = await supabase
            .from('user_flashcards')
            .delete()
            .eq('id', currentCard.id);

        if (deleteError) {
            toast.error("Erreur lors de la suppression locale.");
            return;
        }

        if (currentCard.template_id && user) {
            await supabase.from('suggested_flashcards').insert({
                user_id: user.id,
                template_id: currentCard.template_id,
                front: currentCard.front_content,
                back: currentCard.back_content,
                category: currentCard.category,
                type: 'deletion',
                status: 'pending'
            });
        }

        toast.success("Carte retirée. L'admin a été notifié de votre retour.");

        setIsFlipped(false);
        setHoveredZone(null);
        if (currentCardIndex < flashcards.length - 1) {
            setCurrentCardIndex(prev => prev + 1);
        } else {
            const newCards = [...flashcards];
            newCards.splice(currentCardIndex, 1);
            setFlashcards(newCards);
            
            if (newCards.length === 0) {
                 setSessionComplete(true);
            } else {
                 setSessionComplete(true); 
            }
        }
    }
  };

  const handleExplain = async (customPrompt?: string) => {
    const promptToUse = customPrompt || userNotes.trim();
    if (!promptToUse || isWaitingForAi) return;

    const currentCard = flashcards[currentCardIndex];
    if (customPrompt) {
        setUserNotes(customPrompt);
        setLoadingAiMessage(`Chargement des informations : ${currentCard.front_content}`);
        setIsCustomExplanation(true);
    } else {
        setLoadingAiMessage('Préparation de la réponse');
        setIsCustomExplanation(false);
    }

    setIsWaitingForAi(true);
    setIsExplaining(true);
    setAiResponse(null);

    const persona = `PERSONA: Tu es le Senior Mentor d'OREEGAMI, un centre de formation d'élite en technologie. 
Ton rôle est de transformer des concepts complexes en insights clairs et actionnables pour tes apprenants.

CONSIGNES MÉTHODOLOGIQUES :
1. Posture : Un expert qui coache, direct, percutant, utilisant un vocabulaire technique précis mais expliqué par le contexte.
2. Structure Pédagogique (Fixe) :
   - ## [NOM DU CONCEPT]
   - **L'essentiel :** Une définition "punchy" en une seule phrase.
   - **Comment ça marche ?** Les 3 piliers ou étapes clés du concept (liste à puces).
   - **L'œil de l'Expert :** Un insight métier, un piège à éviter ou un conseil de pro.
   - **Pour creuser le sujet :** Suggère IMPÉRATIVEMENT un ou deux liens pertinents (YouTube, documentation officielle ou article de référence) pour approfondir. Formate-les en liens Markdown clairs.
3. Zéro Blabla : Pas de politesse ("Bonjour", "Voici"), pas de phrases de remplissage.
`;

    const context = `CONTEXTE DE L'APPRENTISSAGE:
Question étudiée: "${currentCard.front_content}"
Réponse de référence: "${currentCard.back_content}"

INPUT DE L'APPRENANT (Réflexion ou Question):
"${promptToUse}"`;

    const instructions = `TA MISSION: 1. Analyse l'intention : "${promptToUse}".
2. Respecte STRICTEMENT la structure pédagogique définie au-dessus.
3. Si la question est hors contexte de la carte ("${currentCard.front_content}"), apporte ton expertise de Mentor sur son sujet spécifique sans mentionner la carte.
4. Recherche et fournis des liens YouTube ou des ressources de formation de haute qualité pour la section "Pour creuser le sujet".
5. Utilise le gras UNIQUEMENT sur les termes techniques clés pour faciliter la lecture rapide (scanning).
6. Reste un expert pédagogue, clair et direct.`;

    const prompt = `${persona}\n\n${context}\n\n${instructions}`;

    try {
      const docRef = await addDoc(collection(widgetsDb, 'generate'), {
        prompt: prompt,
        status: 'PENDING',
        createdAt: serverTimestamp(),
        valid_artisan_context_bot_id: 'ia_veille_bot'
      });

      const unsubscribe = onSnapshot(docRef, (doc) => {
        const data = doc.data();
        if (data && data.response) {
          setAiResponse(data.response);
          setIsWaitingForAi(false);
          unsubscribe();
        } else if (data && data.status && data.status.state === 'ERROR') {
          setAiResponse("Désolé, une erreur est survenue lors de la génération de l'explication.");
          setIsWaitingForAi(false);
          unsubscribe();
        }
      });
    } catch (err) {
      console.error("AI Error:", err);
      setAiResponse("Erreur de connexion avec l'IA.");
      setIsWaitingForAi(false);
    }
  };

  // Auto-trigger explanation if initialQuery is provided (e.g. from Home search)
  const hasTriggeredAutoExplain = useRef(false);
  useEffect(() => {
    if (initialQuery && initialQuery.trim() && !hasTriggeredAutoExplain.current) {
        hasTriggeredAutoExplain.current = true;
        // Small delay to ensure UI is mounted and visuals are ready
        setTimeout(() => {
            handleExplain(initialQuery);
        }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const closeExplanation = () => {
    setIsExplaining(false);
    setAiResponse(null);
    setUserNotes('');
  };

  const handleSuggestCard = async () => {
    if (!aiResponse) return;
    const frontMatch = aiResponse.match(/## (.*)/);
    const front = frontMatch ? frontMatch[1] : `Concept: ${userNotes}`;
    
    // Check for duplicates first
    const { data: existingSuggestions } = await supabase
        .from('suggested_flashcards')
        .select('id')
        .eq('front', front)
        .in('status', ['pending', 'approved'])
        .maybeSingle();

    if (existingSuggestions) {
        toast.error("Cette carte est déjà en cours de validation ou existe déjà !");
        return;
    }

    if (!user) {
        toast.error("Vous devez être connecté pour suggérer une carte !");
        return;
    }

    const { error } = await supabase.from('suggested_flashcards').insert({
        user_id: user.id,
        front: front,
        back: aiResponse, 
        category: 'Généré par IA',
        type: 'new_card',
        status: 'pending'
    });

    if (error) {
        toast.error("Erreur lors de la suggestion");
    } else {
        toast.success("Suggestion envoyée pour validation !");
        handleRate(Rating.Good);
        closeExplanation();
    }
  };

  if (authLoading) {
      // Small minimal loader while auth context syncs, typically very fast
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      );
  }

  // Same JSX (with minor tweaks if needed) as before
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans overflow-hidden">
      <header className="fixed top-6 inset-x-0 z-50 px-4 pointer-events-none flex items-center justify-center h-20">
        <Link href="/" className="pointer-events-auto absolute left-4 md:left-10 z-50 hover:scale-105 transition-transform bg-white/40 backdrop-blur-xl rounded-2xl px-3 py-2 border border-white/60 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:bg-white/80 group">
            <Image 
                src="/logo.png" 
                alt="Retour à l'accueil" 
                width={300} 
                height={100} 
                className="w-auto h-24 md:h-32 object-contain"
                style={{ width: 'auto' }}
                priority
            />
        </Link>
        <div className="pointer-events-auto w-max mx-auto flex items-center justify-center px-10 py-3 md:px-16 md:py-4 rounded-full bg-[linear-gradient(135deg,rgba(255,235,59,0.15)_0%,rgba(255,152,0,0.15)_25%,rgba(255,107,157,0.15)_50%,rgba(156,39,176,0.15)_75%,rgba(33,150,243,0.15)_100%)] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border-t-2 border-t-white/80 border-l-2 border-l-white/80 border-b-2 border-b-[#1565C0]/50 border-r-2 border-r-[#1565C0]/50 transition-all duration-300 transform hover:scale-[1.02]">
            <h1 className="text-2xl md:text-4xl font-black text-gray-800 tracking-tight">
                Zone des <span className="text-indigo-600">connaissances</span>
            </h1>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center justify-start overflow-y-auto pt-4 pb-12">
        <div className="w-full h-32 md:h-40 shrink-0" />
        
        <div className="w-full max-w-4xl px-4 flex flex-col items-center justify-center relative gap-4">
        
         {loading ? (
             <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center">
                 <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
                 <p className="font-bold text-gray-500">Mise à jour des cartes...</p>
             </div>
         ) : sessionComplete ? (
           <div className="w-full max-w-lg text-center space-y-6 animate-fade-in py-10 bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
             <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center border border-green-200">
                <Check size={48} className="text-green-600" />
             </div>
             <h2 className="text-3xl font-black text-gray-900">Session terminée !</h2>
             <p className="text-gray-500 font-medium">Bravo ! Vous avez terminé votre session de cartes mémo avec succès.</p>
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
            <div className="mx-auto w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
               <BrainCircuit size={48} className="text-indigo-600" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">Bibliothèque vide !</h2>
            <p className="text-gray-500 text-lg md:text-xl font-medium mb-10 max-w-md mx-auto">
                Vous n&apos;avez pas encore de cartes mémo dans votre collection. Ajoutez votre première carte pour commencer !
            </p>
             <button 
                onClick={addRandomCard}
                className="mt-6 px-10 py-4 bg-indigo-600 text-white border border-indigo-700 rounded-full hover:bg-indigo-700 hover:scale-105 transition-all text-lg font-black shadow-xl shadow-indigo-200"
             >
                ✨ Ajouter ma première carte 
             </button>
          </div>
        ) : (
            <div className="flex flex-col w-full items-center gap-24 mt-8">
            <div className={`w-full transition-all duration-700 ease-in-out relative group mb-8 ${isExplaining ? 'min-h-[40vh] h-auto' : 'h-[50vh] max-h-[600px] perspective-1000'}`}>
            
            <AnimatePresence mode="wait">
            {!isExplaining ? (
              <motion.div 
                key="card"
                initial={false}
                exit={{ y: 500, opacity: 0, scale: 0.9, transition: { duration: 0.6, ease: "easeInOut" } }}
                className="w-full h-full"
              >
                  {isFlipped && (
                      <div className="absolute -inset-x-8 top-24 -bottom-16 z-50 grid grid-cols-3 pointer-events-auto">
                          <div 
                              className="transition-colors duration-200 cursor-pointer"
                              onMouseEnter={() => setHoveredZone(Rating.Again)}
                              onMouseLeave={() => setHoveredZone(null)}
                              onClick={() => handleRate(Rating.Again)}
                          />
                          <div 
                              className="transition-colors duration-200 cursor-pointer"
                              onMouseEnter={() => setHoveredZone(Rating.Hard)}
                              onMouseLeave={() => setHoveredZone(null)}
                              onClick={() => handleRate(Rating.Hard)}
                          />
                          <div 
                              className="transition-colors duration-200 cursor-pointer"
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
                    <div className="absolute w-full h-full bg-white border border-gray-200 rounded-3xl p-6 md:p-12 flex flex-col items-center justify-center backface-hidden shadow-xl overflow-y-auto hide-scrollbar z-0">
                      
                      <div className="absolute top-8 left-0 w-full flex justify-center items-center z-10">
                          <span className="text-xl font-black uppercase tracking-widest text-blue-600 bg-blue-50/80 px-10 py-2 rounded-full border border-blue-100 backdrop-blur-sm">
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

                    <div className="absolute w-full h-full bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-12 flex flex-col backface-hidden rotate-y-180 shadow-xl overflow-y-auto custom-scrollbar z-0">
                      
                      <div className="absolute top-8 left-0 w-full flex flex-col justify-center items-center z-10 pointer-events-none">
                          <span className="text-xl font-black uppercase tracking-widest text-indigo-600 bg-white/90 px-10 py-2 rounded-full shadow-sm border border-indigo-100 backdrop-blur-sm">
                              Réponse
                          </span>
                          <div className="mt-4 max-w-[80%] text-center">
                              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider block mb-1">Rappel de la question</span>
                              <span className="text-sm font-medium text-gray-500 line-clamp-2 italic">
                                &quot;{flashcards[currentCardIndex].front_content}&quot;
                              </span>
                          </div>
                      </div>

                      <div className="absolute top-6 left-6 hidden md:block">
                          <span className="text-xs font-semibold text-gray-400 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                              {flashcards[currentCardIndex].category}
                          </span>
                      </div>

                      {/* Button moved to bottom bar */}

                      <div className="flex-1 flex flex-col items-center justify-center mt-16 pb-32">
                          <RichContent content={flashcards[currentCardIndex].back_content} />
                      </div>
                    </div>
                  </div>

                  {isFlipped && (
                    <div className="absolute -bottom-16 left-0 w-full px-2 md:px-12 grid grid-cols-5 gap-2 md:gap-4 animate-slide-up z-20 pointer-events-none">
                        {/* 1. Inutile */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleMarkAsUseless(); }}
                          className="pointer-events-auto group h-32 rounded-3xl border-2 bg-white border-gray-100 text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 shadow-xl shadow-gray-100/50 transition-all flex flex-col items-center justify-center"
                          title="Supprimer cette carte"
                        >
                          <span className="text-2xl md:text-3xl mb-2 grayscale group-hover:grayscale-0 transition-all">👎</span>
                          <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider">Inutile</span>
                        </button>

                        {/* 2. À revoir */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRate(Rating.Again); }}
                          className={`pointer-events-auto group h-32 rounded-3xl border-2 transition-all flex flex-col items-center justify-center shadow-xl 
                              ${hoveredZone === Rating.Again 
                                  ? 'bg-red-500 border-red-600 text-white scale-110 -translate-y-4 shadow-red-500/40' 
                                  : 'bg-white border-red-50 text-red-600 shadow-red-100/50 hover:bg-red-50 hover:border-red-200 hover:-translate-y-1'}`}
                        >
                          <span className="font-black text-sm md:text-xl transition-transform text-center">À revoir</span>
                          <span className={`text-[10px] uppercase font-bold tracking-wider mt-1 ${hoveredZone === Rating.Again ? 'text-white/90' : 'text-red-400 opacity-80'}`}>
                              {nextIntervals[Rating.Again]}
                          </span>
                        </button>

                        {/* 3. Presque bon */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRate(Rating.Hard); }} 
                          className={`pointer-events-auto group h-32 rounded-3xl border-2 transition-all flex flex-col items-center justify-center shadow-xl
                              ${hoveredZone === Rating.Hard 
                                  ? 'bg-amber-500 border-amber-600 text-white scale-110 -translate-y-4 shadow-amber-500/40' 
                                  : 'bg-white border-amber-50 text-amber-600 shadow-amber-100/50 hover:bg-amber-50 hover:border-amber-200 hover:-translate-y-1'}`}
                        >
                          <span className="font-black text-sm md:text-xl transition-transform text-center">Moyen</span>
                          <span className={`text-[10px] uppercase font-bold tracking-wider mt-1 ${hoveredZone === Rating.Hard ? 'text-white/90' : 'text-amber-500 opacity-80'}`}>
                              {nextIntervals[Rating.Hard]}
                          </span>
                        </button>

                        {/* 4. Je connais */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRate(Rating.Easy); }} 
                          className={`pointer-events-auto group h-32 rounded-3xl border-2 transition-all flex flex-col items-center justify-center shadow-xl
                              ${hoveredZone === Rating.Easy 
                                  ? 'bg-green-500 border-green-600 text-white scale-110 -translate-y-4 shadow-green-500/40' 
                                  : 'bg-white border-green-50 text-green-600 shadow-green-100/50 hover:bg-green-50 hover:border-green-200 hover:-translate-y-1'}`}
                        >
                          <span className="font-black text-sm md:text-xl transition-transform text-center">Facile</span>
                          <span className={`text-[10px] uppercase font-bold tracking-wider mt-1 ${hoveredZone === Rating.Easy ? 'text-white/90' : 'text-green-400 opacity-80'}`}>
                              {nextIntervals[Rating.Easy]}
                          </span>
                        </button>

                         {/* 5. En savoir plus */}
                         <button 
                          onClick={(e) => {
                              e.stopPropagation();
                              handleExplain(flashcards[currentCardIndex].front_content);
                          }}
                          className="pointer-events-auto group h-32 rounded-3xl border-2 bg-white border-indigo-50 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 hover:-translate-y-1 shadow-xl shadow-indigo-100/50 transition-all flex flex-col items-center justify-center"
                        >
                          <Info size={28} className="mb-2 group-hover:scale-110 transition-transform" />
                          <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center">En savoir +</span>
                        </button>
                    </div>
                  )}


              </motion.div>
            ) : (
              <motion.div 
                key="ai-response"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="w-full h-full flex flex-col relative"
              >
                  <button 
                    onClick={closeExplanation}
                    className="absolute -top-12 right-0 p-2 text-gray-400 hover:text-indigo-600 transition-colors z-50 cursor-pointer flex items-center gap-2 group"
                  >
                    <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Fermer</span>
                    <X size={24} />
                  </button>

                  <div className="flex-1">
                    {isWaitingForAi ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <Loader2 className="animate-spin text-indigo-600/20" size={50} />
                        <p className="text-indigo-600/40 font-black text-sm uppercase tracking-[0.4em] animate-pulse">{loadingAiMessage}</p>
                      </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-8 py-8 w-full">
                            <div className="flex items-center gap-4 mb-12 opacity-50">
                                <Sparkles size={20} className="text-indigo-600" />
                                <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Expertise OREEGAMI</span>
                            </div>

                            <div className="text-gray-900 text-lg md:text-xl font-medium leading-[1.6] tracking-tight selection:bg-indigo-100 prose prose-indigo max-w-none prose-p:leading-[1.7] prose-p:my-4 prose-headings:font-black prose-headings:text-indigo-900 prose-headings:mt-8 prose-headings:mb-4 prose-strong:text-indigo-600 prose-strong:font-black prose-ul:my-4 prose-li:my-2">
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        a: ({ content, ...props }) => (
                                            <a 
                                                {...props} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-indigo-600 underline hover:text-indigo-800 font-bold decoration-2 underline-offset-4 transition-all"
                                            />
                                        )
                                    }}
                                >
                                    {aiResponse}
                                </ReactMarkdown>
                            </div>
                            
                            <div className="pt-12 h-20" />
                        </div>
                    )}
                  </div>

                  {!isWaitingForAi && aiResponse && (
                      <div className="fixed bottom-10 inset-x-0 z-60 flex justify-center px-4 animate-fade-in-up pointer-events-none">
                          <div className="flex items-center gap-6 p-4 pointer-events-auto">
                                {!isCustomExplanation && (
                                    <button 
                                        onClick={handleSuggestCard}
                                        className="h-20 min-w-[200px] md:min-w-[240px] px-6 rounded-[25px] border-2 bg-white border-indigo-50 text-indigo-600 shadow-xl shadow-indigo-100/50 hover:bg-indigo-600 hover:border-indigo-700 hover:text-white hover:scale-110 hover:-translate-y-4 font-black transition-all flex flex-col items-center justify-center gap-0.5 group cursor-pointer"
                                    >
                                        <Check size={28} strokeWidth={4} className="group-hover:scale-125 transition-transform" />
                                        <span className="text-lg md:text-xl uppercase tracking-widest leading-tight">Utile pour</span>
                                        <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] opacity-80 leading-tight">la formation (quizz)</span>
                                    </button>
                                )}

                                <button 
                                    onClick={closeExplanation}
                                    className="h-20 min-w-[150px] md:min-w-[180px] px-8 rounded-[25px] border-2 bg-white border-gray-50 text-gray-400 shadow-xl shadow-gray-100/50 hover:bg-gray-100 hover:border-gray-200 hover:text-gray-600 hover:scale-105 hover:-translate-y-1 font-black transition-all flex flex-col items-center justify-center gap-1 group cursor-pointer"
                                >
                                    <X size={24} />
                                    <span className="text-lg uppercase tracking-widest">Fermer</span>
                                </button>
                          </div>
                      </div>
                  )}
              </motion.div>
            )}
            </AnimatePresence>
          </div>
         </div>
        )}

        {!isExplaining && (
          <div className="fixed bottom-4 right-4 md:static md:mt-12 text-center text-xs font-medium text-gray-400">
              Carte {flashcards.length > 0 ? currentCardIndex + 1 : 0} sur {flashcards.length}
          </div>
        )}

        </div>
    </main>
  </div>
)
}
