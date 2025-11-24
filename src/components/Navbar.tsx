'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import LoginModal from './LoginModal';
import OreegamiaLogo from './OreegamiaLogo';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Shadow logic
      if (currentScrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Visibility logic (Mobile only)
      if (currentScrollY > lastScrollY.current && currentScrollY > 10) {
        // Scrolling down
        setIsVisible(false);
        setIsMenuOpen(false); // Close menu on scroll down
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling up
        setIsVisible(true);
        
        // Auto-hide after 4 seconds if not at the top
        if (currentScrollY > 10) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => {
            setIsVisible(false);
          }, 4000);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Removed isMenuOpen dependency as we handle it inside

  useEffect(() => {
    // Récupérer l'utilisateur connecté
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Fermer le menu quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    router.push('/');
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.user_metadata?.full_name?.split(' ')[0] || 
           user.user_metadata?.name?.split(' ')[0] || 
           user.email?.split('@')[0];
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 bg-white dark:bg-white ${
        isScrolled ? 'shadow-md' : 'shadow-sm'
      } ${!isVisible ? '-translate-y-full md:translate-y-0' : 'translate-y-0'}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center shrink-0" aria-label="OREEGAM'IA">
            <OreegamiaLogo className="w-14 md:w-16" />
          </Link>
          
          <div className={`flex items-center gap-4 md:gap-8 ml-4 flex-1 ${isSearchOpen ? 'hidden md:flex' : 'flex'}`}>
            <Link href="/jt" className="text-black hover:text-indigo-600 transition-colors whitespace-nowrap font-medium text-sm">
              JT
            </Link>
            <Link href="/articles" className="text-black hover:text-indigo-600 transition-colors whitespace-nowrap font-medium text-sm">
              Article
            </Link>
            <Link href="/formation" className="text-black hover:text-indigo-600 transition-colors whitespace-nowrap font-medium text-sm">
              Formation
            </Link>
            <div className="flex items-center pl-2 border-l border-gray-200 ml-2">
              <Link href="/sauvegardés" className="text-gray-600 hover:text-indigo-600 transition-colors" aria-label="Mes sauvegardes">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v3.25h2.5" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Mobile Search Input */}
          {isSearchOpen && (
            <div className="flex-1 ml-4 md:hidden">
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="w-full bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                autoFocus
                onBlur={() => setIsSearchOpen(false)}
              />
            </div>
          )}

          {/* Search Section */}
          <div className="ml-4 flex-shrink-0 flex items-center gap-2">
            {/* Mobile Search Icon */}
            <button 
              className="md:hidden p-2 text-gray-600 hover:text-indigo-600 transition-colors" 
              aria-label="Rechercher"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>

            {/* Desktop Search Input */}
            <div className="hidden md:flex items-center bg-gray-100 hover:bg-gray-200 transition-colors rounded-full px-4 py-2 w-64 border border-transparent focus-within:border-indigo-300 focus-within:ring focus-within:ring-indigo-200 focus-within:ring-opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="bg-transparent border-none focus:outline-none text-sm w-full text-gray-700 placeholder-gray-500"
              />
            </div>
          </div>

          {/* User Section */}
          <div className="ml-4 flex-shrink-0">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  <span className="hidden md:inline">Bonjour, {getUserDisplayName()}</span>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </div>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 border border-gray-100">
                    <Link
                      href="/parametres"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Paramètres
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
              >
                Se connecter
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </nav>
  );
};

export default Navbar;
