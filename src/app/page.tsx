'use client';

import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ArticleList from '@/components/ArticleList';
import Footer from '@/components/Footer';
import OnboardingModal from '@/components/OnboardingModal';
import { OnboardingProvider, useOnboardingContext } from '@/contexts/OnboardingContext';

function HomeContent() {
  const { isOnboardingOpen, isLoading, completeOnboarding, skipOnboarding } = useOnboardingContext();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
      <Navbar />
      <main>
        <Hero />
        <div id="dernier-article" className="container mx-auto px-4 py-8 scroll-mt-24">
          <ArticleList />
        </div>
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

export default function Home() {
  return (
    <OnboardingProvider>
      <HomeContent />
    </OnboardingProvider>
  );
}
