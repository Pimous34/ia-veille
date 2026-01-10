'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Flashcard, reviewFlashcard, getNextIntervals } from '@/lib/fsrs'
import { Rating } from 'ts-fsrs'
import Link from 'next/link'
import { ArrowLeft, Check, BrainCircuit, Loader2, Sparkles, X, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { widgetsDb } from '@/lib/widgets-firebase'
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'react-hot-toast'

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

export default function MemoCardsPage() {
  const [loading, setLoading] = useState(true)
  const [flashcards, setFlashcards] = useState<UIFlashcard[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [nextIntervals, setNextIntervals] = useState<Record<number, string>>({})

  const [hoveredZone, setHoveredZone] = useState<Rating | null>(null)
  const [userNotes, setUserNotes] = useState('')
  const [isExplaining, setIsExplaining] = useState(false)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [isWaitingForAi, setIsWaitingForAi] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Supabase client is stable
  const [supabase] = useState(() => createClient())
  
  // ... (fetchDueFlashcards logic remains unchanged) ...

  const fetchDueFlashcards = useCallback(async () => {
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
    const load = async () => {
       await fetchDueFlashcards();
    };
    load();
  }, [fetchDueFlashcards])

  // Auto-focus the input on mount or when coming back from explanation
  useEffect(() => {
    if (!isExplaining && !loading && flashcards.length > 0) {
      inputRef.current?.focus()
    }
  }, [isExplaining, loading, flashcards.length])
  
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
        // 1. Delete from user's personal cards
        const { error: deleteError } = await supabase
            .from('user_flashcards')
            .delete()
            .eq('id', currentCard.id);

        if (deleteError) {
            console.error('Error deleting card:', deleteError);
            toast.error("Erreur lors de la suppression locale.");
            return;
        }

        // 2. Notify Admin about possible bad template
        if (currentCard.template_id) {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('suggested_flashcards').insert({
                user_id: user?.id,
                template_id: currentCard.template_id,
                front: currentCard.front_content,
                back: currentCard.back_content,
                category: currentCard.category,
                type: 'deletion',
                status: 'pending'
            });
        }

        toast.success("Carte retirée. L'admin a été notifié de votre retour.");

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

  const handleExplain = async (customPrompt?: string) => {
    const promptToUse = customPrompt || userNotes.trim();
    if (!promptToUse || isWaitingForAi) return;

    if (customPrompt) {
        setUserNotes(customPrompt);
    }

    setIsWaitingForAi(true);
    setIsExplaining(true);
    setAiResponse(null);

    const currentCard = flashcards[currentCardIndex];
    
    // On utilise le Persona de l'IA OREEGAM'IA pour garantir la même qualité
    const persona = `PERSONA:
Tu es un expert de renommée mondiale en développement web, design et nouvelles technologies. 
Ton ton est professionnel, précis et direct. Tu évites le "blabla" inutile, les analogies infantilisantes (ex: pas d'origami, pas de cuisine) et les expressions de remplissage.

CONSIGNES DE RÉPONSE:
1. Réponds avec une expertise technique de haut niveau, tout en restant clair.
2. Ne fais JAMAIS de préambule (ex: pas de "D'accord", pas de "Voici une explication").
3. N'utilise JAMAIS d'expressions comme "En termes simples" ou "Pour aller plus loin".
4. Utilise un formatage propre (listes à puces, gras sur les mots-clés) mais sans en-têtes de section superflus.
5. Si l'utilisateur propose une réflexion, confirme ou corrige sans détour.`;

    const context = `CONTEXTE DE L'APPRENTISSAGE:
Question étudiée: "${currentCard.front_content}"
Réponse de référence: "${currentCard.back_content}"

INPUT DE L'APPRENANT (Réflexion ou Question):
"${promptToUse}"`;

    const instructions = `TA MISSION:
1. Analyse l'intention de l'apprenant : "${promptToUse}".
2. Applique ces règles de style : 
   - Commence ta réponse en mettant le terme principal recherché ("${promptToUse}") EN GRAS tout au début.
   - Mets systématiquement EN GRAS les mots-clés, termes techniques et concepts essentiels tout au long de ton explication pour favoriser la lecture rapide.
3. Si sa question n'a AUCUN rapport avec la carte actuelle ("${currentCard.front_content}"), IGNORE totalement la carte. Ne mentionne JAMAIS son contenu, ne fais pas de phrase de transition. Réponds comme si la carte n'existait pas.
4. Ne commence JAMAIS ta réponse par un préambule. Entre directement dans le vif du sujet.
5. Si sa question demande une explication SUR la carte, utilise le contexte.
6. Reste un expert pédagogue, clair et direct.`;

    const prompt = `${persona}\n\n${context}\n\n${instructions}`;

    try {
      const docRef = await addDoc(collection(widgetsDb, 'generate'), {
        prompt: prompt,
        status: 'PENDING',
        createdAt: serverTimestamp(),
        valid_artisan_context_bot_id: 'ia_veille_bot'
      });

      // Listen for response
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

  const closeExplanation = () => {
    setIsExplaining(false);
    setAiResponse(null);
    setUserNotes('');
  };

  const handleSuggestCard = async () => {
    const currentCard = flashcards[currentCardIndex];
    if (!currentCard || !aiResponse) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast.error("Vous devez être connecté pour suggérer une carte.");
        return;
    }

    const { error } = await supabase.from('suggested_flashcards').insert({
        user_id: user.id,
        front: userNotes,
        back: aiResponse,
        category: currentCard.category,
        status: 'pending',
        type: 'new_card'
    });

    if (error) {
        console.error('Détails erreur suggestion:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        toast.error(`Erreur : ${error.message || "Impossible d'envoyer la suggestion"}`);
    } else {
        toast.success("Suggestion envoyée pour la formation !");
        closeExplanation();
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
            <div className="mx-auto w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
               <BrainCircuit size={48} className="text-gray-400" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">Cartes mémo épuisées !</h2>
            <p className="text-gray-500 text-lg md:text-xl font-medium mb-10 max-w-md mx-auto">
                Vous avez révisé toutes vos cartes pour aujourd&apos;hui. Revenez demain pour la suite !
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
                        ref={inputRef}
                        value={userNotes}
                        onChange={(e) => setUserNotes(e.target.value)}
                        placeholder="Explique-moi..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleExplain();
                            }
                        }}
                        className="bg-transparent p-0 text-gray-900 placeholder-gray-300 outline-none resize-none text-2xl md:text-4xl font-black transition-all focus:placeholder-transparent overflow-hidden scrollbar-hide w-full text-center md:text-left"
                        style={{ fieldSizing: "content" } as React.CSSProperties}
                    />
                    {userNotes.trim() && !isWaitingForAi && (
                        <button 
                            onClick={() => handleExplain()}
                            className="ml-4 p-2 bg-indigo-600 text-white rounded-full hover:scale-110 transition-transform shadow-lg cursor-pointer flex items-center justify-center pulse-indigo"
                        >
                            <Sparkles size={20} />
                        </button>
                    )}
                </div>
            </div>

            <div className={`w-full transition-all duration-700 ease-in-out relative group mb-8 ${isExplaining ? 'min-h-[60vh]' : 'h-[50vh] max-h-[600px] perspective-1000'}`}>
            
            <AnimatePresence mode="wait">
            {!isExplaining ? (
              <motion.div 
                key="card"
                initial={false}
                exit={{ y: 500, opacity: 0, scale: 0.9, transition: { duration: 0.6, ease: "easeInOut" } }}
                className="w-full h-full"
              >
                  {/* Interactive Hover Zones (Visible ON TOP when flipped) */}
                  {isFlipped && (
                      <div className="absolute -inset-x-8 top-24 -bottom-16 z-10 grid grid-cols-3 pointer-events-auto">
                          {/* Left Zone: Again */}
                          <div 
                              className="transition-colors duration-200 cursor-pointer"
                              onMouseEnter={() => setHoveredZone(Rating.Again)}
                              onMouseLeave={() => setHoveredZone(null)}
                              onClick={() => handleRate(Rating.Again)}
                          />
                          {/* Middle Zone: Hard */}
                          <div 
                              className="transition-colors duration-200 cursor-pointer"
                              onMouseEnter={() => setHoveredZone(Rating.Hard)}
                              onMouseLeave={() => setHoveredZone(null)}
                              onClick={() => handleRate(Rating.Hard)}
                          />
                          {/* Right Zone: Easy */}
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

                      {/* Top Right: Learn More Button */}
                      <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleExplain(flashcards[currentCardIndex].front_content);
                        }}
                        className="absolute top-8 right-8 z-30 pointer-events-auto flex items-center gap-3 px-10 py-4 bg-[linear-gradient(135deg,rgba(255,235,59,0.1)_0%,rgba(255,152,0,0.1)_25%,rgba(255,107,157,0.1)_50%,rgba(156,39,176,0.1)_75%,rgba(33,150,243,0.1)_100%)] backdrop-blur-xl shadow-lg border-t-2 border-t-white/80 border-l-2 border-l-white/80 border-b-2 border-b-indigo-600/30 border-r-2 border-r-indigo-600/30 hover:scale-105 hover:-translate-y-0.5 transition-all text-gray-800 font-black text-sm uppercase tracking-widest group rounded-[40px]"
                      >
                        <Info size={18} className="text-indigo-600 group-hover:rotate-12 transition-transform" />
                        <span>En savoir plus</span>
                      </button>
                      
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

                      {/* Top Right: Learn More Button (Back) */}
                      <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleExplain(flashcards[currentCardIndex].front_content);
                        }}
                        className="absolute top-8 right-8 z-30 pointer-events-auto flex items-center gap-3 px-10 py-4 bg-[linear-gradient(135deg,rgba(255,235,59,0.1)_0%,rgba(255,152,0,0.1)_25%,rgba(255,107,157,0.1)_50%,rgba(156,39,176,0.1)_75%,rgba(33,150,243,0.1)_100%)] backdrop-blur-xl shadow-lg border-t-2 border-t-white/80 border-l-2 border-l-white/80 border-b-2 border-b-indigo-600/30 border-r-2 border-r-indigo-600/30 hover:scale-105 hover:-translate-y-0.5 transition-all text-gray-800 font-black text-sm uppercase tracking-widest group rounded-[40px]"
                      >
                        <Info size={18} className="text-indigo-600 group-hover:rotate-12 transition-transform" />
                        <span>En savoir plus</span>
                      </button>

                      <div className="flex-1 flex flex-col items-center justify-center mt-16 pb-32">
                          <RichContent content={flashcards[currentCardIndex].back_content} />
                      </div>
                    </div>
                  </div>

                  {/* Controls (Only visible when flipped) - Improved Overlay UI */}
                  {isFlipped && (
                    <div className="absolute -bottom-16 left-0 w-full px-4 md:px-12 grid grid-cols-3 gap-6 animate-slide-up z-20 pointer-events-none">
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

                  {/* Feedback Button (Useless) */}
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
                  {/* Close button - Minimalist & Floating */}
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
                        <p className="text-indigo-600/40 font-black text-sm uppercase tracking-[0.4em] animate-pulse">Analyse de la carte mémo...</p>
                      </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-8 py-8 w-full">
                            {/* Header inside the transparent area */}
                            <div className="flex items-center gap-4 mb-12 opacity-50">
                                <Sparkles size={20} className="text-indigo-600" />
                                <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Expertise OREEGAMI</span>
                            </div>

                            <div className="text-gray-900 text-lg md:text-xl font-medium leading-[1.6] tracking-tight selection:bg-indigo-100 prose prose-indigo max-w-none prose-p:leading-[1.6] prose-p:mt-0 prose-p:mb-4 prose-strong:text-indigo-600 prose-strong:font-black">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {aiResponse}
                                </ReactMarkdown>
                            </div>
                            
                            <div className="pt-24 h-40" />
                        </div>
                    )}
                  </div>

                  {/* Floating Action Bar - Quiz Style */}
                  {!isWaitingForAi && aiResponse && (
                      <div className="fixed bottom-10 inset-x-0 z-60 flex justify-center px-4 animate-fade-in-up pointer-events-none">
                          <div className="flex items-center gap-6 p-4 pointer-events-auto">
                                <button 
                                    onClick={handleSuggestCard}
                                    className="h-32 min-w-[280px] md:min-w-[320px] px-6 rounded-[35px] border-2 bg-white border-indigo-50 text-indigo-600 shadow-xl shadow-indigo-100/50 hover:bg-indigo-600 hover:border-indigo-700 hover:text-white hover:scale-110 hover:-translate-y-4 font-black transition-all flex flex-col items-center justify-center gap-0.5 group cursor-pointer"
                                >
                                    <Check size={28} strokeWidth={4} className="group-hover:scale-125 transition-transform" />
                                    <span className="text-lg md:text-xl uppercase tracking-widest leading-tight">Utile pour</span>
                                    <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] opacity-80 leading-tight">la formation (quizz)</span>
                                </button>

                                <button 
                                    onClick={closeExplanation}
                                    className="h-32 min-w-[280px] md:min-w-[320px] px-8 rounded-[35px] border-2 bg-white border-gray-50 text-gray-400 shadow-xl shadow-gray-100/50 hover:bg-gray-100 hover:border-gray-200 hover:text-gray-600 hover:scale-105 hover:-translate-y-1 font-black transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer"
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
