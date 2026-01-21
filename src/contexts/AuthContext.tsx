'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
  supabase: SupabaseClient;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  refreshUser: async () => {},
  supabase: {} as SupabaseClient, // Placeholder, will be overridden by provider
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  const refreshUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Verification of existence in students, admins or intervenants
        const { data: adminRecord } = await supabase.from('admins').select('id').eq('email', user.email).maybeSingle();
        const { data: isStudent } = await supabase.from('students').select('id').eq('email', user.email).maybeSingle();
        const { data: isIntervenant } = await supabase.from('intervenants').select('id').eq('email', user.email).maybeSingle();

        /*
        if (!adminRecord && !isStudent && !isIntervenant) {
          console.error(`⛔ ACCÈS REFUSÉ : L'email ${user.email} n'est pas trouvé dans les tables admins, students, ou intervenants. Déconnexion forcée.`);
          await supabase.auth.signOut();
          setUser(null);
          setIsAdmin(false);
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
             window.location.href = '/auth?error=unauthorized';
          }
          return;
        }
        */
       
        setIsAdmin(!!adminRecord);
      } else {
        setIsAdmin(false);
      }
      setUser(user);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth State Change:', event); // Debug log

      if (event === 'SIGNED_OUT') {
         if (mounted) {
            setUser(null);
            setIsAdmin(false);
            setLoading(false);
         }
         // Optional: Redirect to auth page if needed, but usually just clearing state is enough for UI to react
         return;
      }

      if (session?.user) {
        // Verification of existence in students, admins or intervenants
        const { data: adminRecord } = await supabase.from('admins').select('id').eq('email', session.user.email).maybeSingle();
        const { data: isStudent } = await supabase.from('students').select('id').eq('email', session.user.email).maybeSingle();
        const { data: isIntervenant } = await supabase.from('intervenants').select('id').eq('email', session.user.email).maybeSingle();

        /*
        if (!adminRecord && !isStudent && !isIntervenant) {
            console.error(`⛔ ACCÈS REFUSÉ (onAuthStateChange) : L'email ${session.user.email} n'est pas autorisé. Déconnexion.`);
            await supabase.auth.signOut();
            if (mounted) {
              setUser(null);
              setLoading(false);
            }
            if (typeof window !== 'undefined') {
                window.location.href = '/auth?error=unauthorized';
            }
        } else {
        */
            if (mounted) {
              setUser(session.user);
              setIsAdmin(!!adminRecord);
              setLoading(false);
            }
        // }
      } else {
        // No session (and not explicitly SIGNED_OUT event caught above, e.g. INITIAL_SESSION)
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    });

    // Initial check
    const initAuth = async () => {
      await refreshUser();
      if (mounted) setLoading(false);
    };

    initAuth();

    // Revalidate on window focus (user comes back to tab)
    const handleFocus = () => {
        refreshUser(); 
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshUser, supabase]);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, refreshUser, supabase }}>
      {children}
    </AuthContext.Provider>
  );
};
