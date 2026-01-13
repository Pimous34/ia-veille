import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import FlashcardsClient from '@/components/FlashcardsClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Ordre logique d'apprentissage (Duplicated for Server Sorting)
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

// Data Fetching Component
async function FlashcardsDataFetcher({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const initialQuery = searchParams?.q;

  // 1. Fetch DUE cards first
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
    .eq('user_id', user.id)
    .lte('due', new Date().toISOString());

  let result = await query;
  let mode = 'due';

  // 2. Fallback to ALL if no due cards
  if (!result.error && (!result.data || result.data.length === 0)) {
     mode = 'all';
     result = await supabase
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
  }

  if (result.error) {
    console.error("Server Fetch Error:", result.error);
    // On error, passing empty array allows client to handle or show empty state safely
    return <FlashcardsClient initialFlashcards={[]} initialQuery={initialQuery} />;
  }

  // 3. Transform Data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapped = (result.data || []).map((card: any) => ({
      ...card,
      front_content: card.flashcard_templates?.front || card.front || 'Question manquante',
      back_content: card.flashcard_templates?.back || card.back || 'Réponse manquante',
      category: card.flashcard_templates?.category || 'Général'
  }));

  // 4. Sort Data
  const sortedCards = mapped.sort((a: any, b: any) => {
      const orderA = CURRICULUM_ORDER[a.category] || 99;
      const orderB = CURRICULUM_ORDER[b.category] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.difficulty || 0) - (b.difficulty || 0);
  });

  const initialBatch = sortedCards.slice(0, 10);

  return <FlashcardsClient initialFlashcards={initialBatch} initialQuery={initialQuery} />;
}


export default async function MemoCardsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const resolvedParams = await searchParams;
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    }>
       <FlashcardsDataFetcher searchParams={resolvedParams} />
    </Suspense>
  )
}
