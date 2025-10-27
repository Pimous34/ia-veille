'use client';

import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ArticleList from '@/components/ArticleList';
import Footer from '@/components/Footer';
import OnboardingModal from '@/components/OnboardingModal';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function Home() {
  const { isOnboardingOpen, isLoading, completeOnboarding, skipOnboarding } = useOnboarding();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Hero />
        <ArticleList />
      </main>
      <Footer />
      
      {!isLoading && (
        <OnboardingModal
          isOpen={isOnboardingOpen}
          onClose={skipOnboarding}
          onComplete={completeOnboarding}
        />
      )}
    </div>
  );
}
