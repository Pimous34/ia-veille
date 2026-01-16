'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
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
  const [checkingStatus, setCheckingStatus] = useState(true);
  const { user: authUser, loading: authLoading } = useAuth();

  const checkOnboardingStatus = useCallback(async () => {
    if (!authUser) {
      setCheckingStatus(false);
      return;
    }

    try {
      console.log('Utilisateur connecté:', authUser.email);

      // Check if user has completed onboarding
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('id', authUser.id)
        .maybeSingle();

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
      setCheckingStatus(false);
    }
  }, [authUser]);

  const completeOnboarding = useCallback(async (data: OnboardingData) => {
    if (!authUser) return;

    try {
      // Upsert user profile with onboarding data
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: authUser.id,
          email: authUser.email,
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
  }, [authUser]);

  useEffect(() => {
    if (authLoading) return;
    checkOnboardingStatus();
    
    // Vérifier si des données d'onboarding sont en attente dans localStorage
    const savedOnboardingData = localStorage.getItem('onboarding-data');
    if (savedOnboardingData && authUser) {
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
  }, [checkOnboardingStatus, completeOnboarding, authLoading, authUser]);

  const skipOnboarding = () => {
    setIsOnboardingOpen(false);
  };

  const openOnboarding = () => {
    setIsOnboardingOpen(true);
  };

  return {
    isOnboardingOpen,
    isLoading: checkingStatus || authLoading,
    user: authUser,
    completeOnboarding,
    skipOnboarding,
    openOnboarding,
  };
};
