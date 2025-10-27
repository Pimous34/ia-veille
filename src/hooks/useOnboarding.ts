'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/user';
import toast from 'react-hot-toast';

interface OnboardingData {
  userType: 'professionnel' | 'particulier' | null;
  experienceLevel: 'debutant' | 'intermediaire' | 'pro' | null;
  interests: string[];
  toolsUsed: string[];
}

export const useOnboarding = () => {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // MODE TEST : Afficher toujours le modal pour la démo
      // Décommentez les lignes ci-dessous pour activer le mode test
      console.log('[TEST MODE] Affichage du modal d\'onboarding');
      setIsOnboardingOpen(true);
      setIsLoading(false);
      return;
      
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
  };

  const completeOnboarding = async (data: OnboardingData) => {
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
          interests: data.interests,
          tools_used: data.toolsUsed,
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
  };

  const skipOnboarding = () => {
    setIsOnboardingOpen(false);
  };

  return {
    isOnboardingOpen,
    isLoading,
    completeOnboarding,
    skipOnboarding,
  };
};
