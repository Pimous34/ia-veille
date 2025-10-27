'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';

interface OnboardingContextType {
  isOnboardingOpen: boolean;
  isLoading: boolean;
  user: any;
  completeOnboarding: (data: any) => Promise<void>;
  skipOnboarding: () => void;
  openOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const onboarding = useOnboarding();

  return (
    <OnboardingContext.Provider value={onboarding}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }
  return context;
}
