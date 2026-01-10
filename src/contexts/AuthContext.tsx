'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const refreshUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Verification of existence in students, admins or intervenants
        const { data: isAdmin } = await supabase.from('admins').select('id').eq('email', user.email).maybeSingle();
        const { data: isStudent } = await supabase.from('students').select('id').eq('email', user.email).maybeSingle();
        const { data: isIntervenant } = await supabase.from('intervenants').select('id').eq('email', user.email).maybeSingle();

        if (!isAdmin && !isStudent && !isIntervenant) {
          console.warn('Unauthorized access attempt:', user.email);
          await supabase.auth.signOut();
          setUser(null);
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
             window.location.href = '/auth?error=unauthorized';
          }
          return;
        }
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
      if (session?.user) {
        // Verification of existence in students, admins or intervenants
        const { data: isAdmin } = await supabase.from('admins').select('id').eq('email', session.user.email).maybeSingle();
        const { data: isStudent } = await supabase.from('students').select('id').eq('email', session.user.email).maybeSingle();
        const { data: isIntervenant } = await supabase.from('intervenants').select('id').eq('email', session.user.email).maybeSingle();

        if (!isAdmin && !isStudent && !isIntervenant) {
            console.warn('Unauthorized access attempt:', session.user.email);
            await supabase.auth.signOut();
            if (mounted) {
              setUser(null);
              setLoading(false);
            }
            if (typeof window !== 'undefined') {
                window.location.href = '/auth?error=unauthorized';
            }
        } else {
            if (mounted) {
              setUser(session.user);
              setLoading(false);
            }
        }
      } else {
        if (mounted) {
          setUser(null);
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

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshUser, supabase]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
