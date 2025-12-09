'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/user';
import toast from 'react-hot-toast';

export interface OnboardingData {
  userType: 'professionnel' | 'particulier' | null;
  experienceLevel: 'debutant' | 'intermediaire' | 'pro' | null;
  aiTools: string[];
  interests: string[];
  toolsUsed: string[];
  wantsNewsletter: boolean;
  newsletterFrequency: number;
}

export const useOnboarding = () => {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const checkOnboardingStatus = useCallback(async () => {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        console.log('Aucun utilisateur connecté');
        setIsLoading(false);
        return;
      }

      setUser(currentUser);
      console.log('Utilisateur connecté:', currentUser.email);

      // Check if user has completed onboarding
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        // If profile doesn't exist, show onboarding
        setIsOnboardingOpen(true);
      } else if (!profile?.onboarding_completed) {
        // Show onboarding if not completed
        console.log('Onboarding non complété, affichage du modal');
        setIsOnboardingOpen(true);
      } else {
        console.log('Onboarding déjà complété');
      }
    } catch (error) {
      console.error('Error in checkOnboardingStatus:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeOnboarding = useCallback(async (data: OnboardingData) => {
    if (!user) return;

    try {
      // Upsert user profile with onboarding data
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          email: user.email,
          onboarding_completed: true,
          user_type: data.userType,
          experience_level: data.experienceLevel,
          ai_tools: data.aiTools,
          interests: data.interests,
          tools_used: data.toolsUsed,
          wants_newsletter: data.wantsNewsletter,
          newsletter_frequency: data.newsletterFrequency.toString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error saving onboarding data:', error);
        toast.error('Erreur lors de la sauvegarde de vos préférences');
        throw error;
      }

      toast.success('Bienvenue ! Vos préférences ont été enregistrées.');
      setIsOnboardingOpen(false);
    } catch (error) {
      console.error('Error in completeOnboarding:', error);
      throw error;
    }
  }, [user]);

  useEffect(() => {
    checkOnboardingStatus();
    
    // Vérifier si des données d'onboarding sont en attente dans localStorage
    const savedOnboardingData = localStorage.getItem('onboarding-data');
    if (savedOnboardingData) {
      try {
        const data = JSON.parse(savedOnboardingData);
        // Sauvegarder automatiquement après connexion
        setTimeout(() => {
          completeOnboarding(data);
          localStorage.removeItem('onboarding-data');
        }, 1000);
      } catch (error) {
        console.error('Error parsing onboarding data:', error);
        localStorage.removeItem('onboarding-data');
      }
    }

    // Écouter les changements d'authentification pour détecter les nouvelles connexions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('Utilisateur vient de se connecter:', session.user.email);
        
        // Vérifier si c'est une nouvelle inscription
        const justSignedIn = localStorage.getItem('just-signed-in');
        if (justSignedIn) {
          localStorage.removeItem('just-signed-in');
          
          // Attendre un peu pour que l'utilisateur soit bien créé en base
          setTimeout(async () => {
            await checkOnboardingStatus();
          }, 500);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkOnboardingStatus, completeOnboarding]);

  const skipOnboarding = () => {
    setIsOnboardingOpen(false);
  };

  const openOnboarding = () => {
    setIsOnboardingOpen(true);
  };

  return {
    isOnboardingOpen,
    isLoading,
    user,
    completeOnboarding,
    skipOnboarding,
    openOnboarding,
  };
};
