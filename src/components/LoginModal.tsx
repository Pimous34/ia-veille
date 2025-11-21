'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const supabase = createClient();

  const handleOAuthSignIn = async (provider: 'google' | 'apple' | 'facebook' | 'twitter' | 'azure') => {
    try {
      // Marquer que l'utilisateur vient de se connecter pour déclencher l'onboarding si nécessaire
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4"
          >
            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Connexion
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                  Choisissez votre méthode de connexion
                </p>

                {/* Social Sign In Buttons */}
                <div className="space-y-3">
                  {/* Google */}
                  <button
                    onClick={() => handleOAuthSignIn('google')}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-400 transition-all shadow-sm hover:shadow-lg hover:scale-[1.02]"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continuer avec Google
                  </button>

                  {/* Apple */}
                  <button
                    onClick={() => handleOAuthSignIn('apple')}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-black dark:bg-white border-2 border-black dark:border-white rounded-xl font-semibold text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-sm hover:shadow-lg hover:scale-[1.02]"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Continuer avec Apple
                  </button>

                  {/* Facebook */}
                  <button
                    onClick={() => handleOAuthSignIn('facebook')}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#1877F2] border-2 border-[#1877F2] rounded-xl font-semibold text-white hover:bg-[#166FE5] hover:border-[#166FE5] transition-all shadow-sm hover:shadow-lg hover:scale-[1.02]"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Continuer avec Facebook
                  </button>

                  {/* Twitter/X */}
                  <button
                    onClick={() => handleOAuthSignIn('twitter')}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-black dark:bg-white border-2 border-black dark:border-white rounded-xl font-semibold text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-sm hover:shadow-lg hover:scale-[1.02]"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Continuer avec X (Twitter)
                  </button>

                  {/* Azure/Microsoft */}
                  <button
                    onClick={() => handleOAuthSignIn('azure')}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-400 transition-all shadow-sm hover:shadow-lg hover:scale-[1.02]"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path fill="#f25022" d="M0 0h11.377v11.372H0z"/>
                      <path fill="#00a4ef" d="M12.623 0H24v11.372H12.623z"/>
                      <path fill="#7fba00" d="M0 12.628h11.377V24H0z"/>
                      <path fill="#ffb900" d="M12.623 12.628H24V24H12.623z"/>
                    </svg>
                    Continuer avec Microsoft
                  </button>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
                  En vous connectant, vous acceptez nos conditions d&apos;utilisation et notre politique de confidentialité
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
