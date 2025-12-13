'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const supabase = createClient();

  const handleOAuthSignIn = async (provider: 'google' | 'apple' | 'facebook' | 'twitter' | 'azure') => {
    try {
      localStorage.setItem('just-signed-in', 'true');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/`,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error(`Erreur d'authentification ${provider}:`, error);
        alert(`Erreur lors de la connexion avec ${provider}. Veuillez réessayer.`);
        localStorage.removeItem('just-signed-in');
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Une erreur est survenue. Veuillez réessayer.');
      localStorage.removeItem('just-signed-in');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with stronger blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md pointer-events-auto"
            >
              {/* Gradient Border Effect */}
              <div className="absolute -inset-0.5 bg-linear-to-r from-pink-500 via-purple-500 to-blue-500 rounded-3xl opacity-75 blur-sm"></div>
              
              <div className="relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
                {/* Header with Pattern */}
                <div className="relative p-8 pb-0 text-center">
                   <div className="absolute top-4 right-4 z-10">
                    <button
                      onClick={onClose}
                      className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="w-20 h-20 mx-auto mb-6 relative">
                    <Image src="/logo.svg" alt="Oreegami" fill className="object-contain" unoptimized />
                  </div>
                  
                  <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-pink-500 to-violet-500 mb-2">
                    Bienvenue
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    Rejoignez la communauté Oreegam&apos;ia
                  </p>
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className="space-y-4">
                    {/* Google Button - Primary */}
                    <button
                      onClick={() => handleOAuthSignIn('google')}
                      className="w-full relative group overflow-hidden rounded-xl p-px focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all hover:scale-[1.02]"
                    >
                      <span className="absolute inset-0 bg-linear-to-r from-blue-500 via-blue-400 to-blue-500 opacity-20 group-hover:opacity-100 transition-opacity duration-300"></span>
                      <div className="relative flex items-center justify-center gap-3 bg-white dark:bg-gray-800 px-6 py-3.5 rounded-xl border border-gray-100 dark:border-gray-700">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="font-semibold text-gray-700 dark:text-gray-200">Continuer avec Google</span>
                      </div>
                    </button>

                    {/* Apple Button */}
                    <button
                      onClick={() => handleOAuthSignIn('apple')}
                      className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl font-semibold hover:bg-gray-900 transition-transform hover:scale-[1.02]"
                    >
                       <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Continuer avec Apple
                    </button>
                    
                     <div className="relative flex py-2 items-center">
                        <div className="grow border-t border-gray-200 dark:border-gray-700"></div>
                        <span className="shrink-0 mx-4 text-gray-400 text-xs">Ou via</span>
                        <div className="grow border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleOAuthSignIn('twitter')}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium text-sm transition-colors text-gray-700 dark:text-gray-300"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          Twitter
                        </button>
                        <button
                          onClick={() => handleOAuthSignIn('azure')}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium text-sm transition-colors text-gray-700 dark:text-gray-300"
                        >
                           <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path fill="#f25022" d="M0 0h11.377v11.372H0z"/>
                              <path fill="#00a4ef" d="M12.623 0H24v11.372H12.623z"/>
                              <path fill="#7fba00" d="M0 12.628h11.377V24H0z"/>
                              <path fill="#ffb900" d="M12.623 12.628H24V24H12.623z"/>
                            </svg>
                          Microsoft
                        </button>
                    </div>

                  </div>

                  <p className="text-xs text-gray-400 text-center mt-8">
                    En continuant, vous acceptez nos <a href="#" className="underline hover:text-blue-500">CGU</a> et notre <a href="#" className="underline hover:text-blue-500">Politique de confidentialité</a>.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
