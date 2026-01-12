import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import HomeClient from '@/components/HomeClient';

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth');
  }

  return <HomeClient />;
}
