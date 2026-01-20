-- Add article_id column to reading_history
alter table public.reading_history 
  add column if not exists article_id uuid references public.articles(id) on delete set null;

-- Make sure RLS policies allow inserting this column (implicit in INSERT policy usually)
