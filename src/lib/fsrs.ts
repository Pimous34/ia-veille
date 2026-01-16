import { Card, FSRS, Rating, State, generatorParameters, createEmptyCard } from 'ts-fsrs';

// --- TYPES ---

export interface Flashcard {
  id: string;
  user_id: string;
  template_id?: string | null;
  front?: string | null;
  back?: string | null;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  learning_steps: number; 
  state: number;
  last_review?: string | null;
  created_at?: string;
  
  // Joined data
  flashcard_templates?: {
    front: string;
    back: string;
    category?: string;
  };
}

export interface ReviewLog {
  rating: Rating;
  scheduled_days: number;
  elapsed_days: number;
  review: Date;
  state: State;
}

// --- CONFIGURATION ---

const params = generatorParameters({
  enable_fuzz: true, 
});

export const f = new FSRS(params);

// --- HELPERS ---

export function createCardFromTemplate(templateId: string, userId: string): Partial<Flashcard> {
  const card = createEmptyCard();
  return {
    user_id: userId,
    template_id: templateId,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    learning_steps: 0,
    state: card.state,
    last_review: card.last_review ? card.last_review.toISOString() : null,
  };
}

export function reviewFlashcard(flashcard: Flashcard, rating: Rating) {
  const now = new Date();
  
  const inputCard: Card = {
    due: new Date(flashcard.due),
    stability: flashcard.stability,
    difficulty: flashcard.difficulty,
    elapsed_days: flashcard.elapsed_days,
    scheduled_days: flashcard.scheduled_days,
    reps: flashcard.reps,
    lapses: flashcard.lapses || 0,
    state: flashcard.state as State,
    last_review: flashcard.last_review ? new Date(flashcard.last_review) : undefined,
    learning_steps: flashcard.learning_steps || 0 // Included directly to satisfy Card interface
  };

  const schedulingCards = f.repeat(inputCard, now);
  
  // Cast rating to omit 'Manual' to satisfy TS index signature, 
  // as schedulingCards only has keys for Again, Hard, Good, Easy.
  const validRating = rating as Exclude<Rating, Rating.Manual>;
  const recordItem = schedulingCards[validRating];

  if (!recordItem) {
      throw new Error(`Invalid rating provided for FSRS scheduling: ${rating}`);
  }

  const newCard = recordItem.card; 

  return {
    due: newCard.due.toISOString(),
    stability: newCard.stability,
    difficulty: newCard.difficulty,
    elapsed_days: newCard.elapsed_days,
    scheduled_days: newCard.scheduled_days,
    reps: newCard.reps,
    lapses: newCard.lapses,
    learning_steps: 0, // In FSRS v4, this might reset or change. For now we assume 0 for storage if not provided.
                       // Ideally, we'd take newCard.learning_steps but 'Card' type in some versions might not expose it on output?
                       // Let's create a safe fallback.
    state: newCard.state,
    last_review: newCard.last_review ? newCard.last_review.toISOString() : now.toISOString(),
  };
}

export function getNextIntervals(flashcard: Flashcard) {
  const now = new Date();
  
  const inputCard: Card = {
    due: new Date(flashcard.due),
    stability: flashcard.stability,
    difficulty: flashcard.difficulty,
    elapsed_days: flashcard.elapsed_days,
    scheduled_days: flashcard.scheduled_days,
    reps: flashcard.reps,
    lapses: flashcard.lapses || 0,
    state: flashcard.state as State,
    last_review: flashcard.last_review ? new Date(flashcard.last_review) : undefined,
    learning_steps: flashcard.learning_steps || 0
  };
  
  const schedulingCards = f.repeat(inputCard, now);

  return {
    [Rating.Again]: timeToLabel(schedulingCards[Rating.Again].card.scheduled_days),
    [Rating.Hard]: timeToLabel(schedulingCards[Rating.Hard].card.scheduled_days),
    [Rating.Good]: timeToLabel(schedulingCards[Rating.Good].card.scheduled_days),
    [Rating.Easy]: timeToLabel(schedulingCards[Rating.Easy].card.scheduled_days),
  };
}

function timeToLabel(days: number): string {
    if (days < 0.001) return 'Maintenant'; 
    if (days < 1/1440) return '<1m';
    if (days < 1/24) return Math.round(days * 1440) + 'min';
    if (days < 1) return Math.round(days * 24) + 'h'; 
    if (days < 30) return Math.round(days) + 'j'; 
    if (days < 365) return Math.round(days / 30) + 'mo';
    return Math.round(days / 365) + 'an(s)';
}
