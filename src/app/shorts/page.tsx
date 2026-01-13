import ShortsFeed from '@/components/ShortsFeed';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'ShortNews - OREEGAM\'IA',
  description: 'L\'actualité IA & No-Code en format court.',
};

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ShortsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth');
  }

  return (
    <div className="h-screen w-full bg-black overflow-hidden relative">
      <Suspense fallback={<div className="h-screen w-full flex items-center justify-center text-white">Chargement...</div>}>
        <ShortsFeed />
      </Suspense>
    </div>
  );
}
