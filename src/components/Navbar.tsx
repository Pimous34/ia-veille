'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

 const Navbar = () => {
   const [isScrolled, setIsScrolled] = useState(false);
   const [user, setUser] = useState<User | null>(null);
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [isSearchOpen, setIsSearchOpen] = useState(false);
   const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Shadow logic
      if (currentScrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
    <>
      <nav
        className={`fixed inset-x-0 top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? 'h-16' : 'h-24'
        } hidden md:block`}
      >
        <div className="container mx-auto h-full px-5 flex items-center justify-between relative">
          {/* 1. Logo (Left) */}
          <div className="shrink-0 z-10">
            <Link href="/" aria-label="OREEGAM'IA">
              <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Image 
                  src="/logo.png" 
                  alt="OREEGAM'IA" 
                  width={150} 
                  height={50} 
                  className={`${isScrolled ? 'h-[40px]' : 'h-[50px]'} w-auto drop-shadow-sm transition-all duration-300`}
                  priority
                  unoptimized
                />
              </div>
            </Link>
          </div>

          {/* 2. Main Pill (Center - Absolutely centered in viewport) */}
          <div className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-2 rounded-[50px] bg-[linear-gradient(135deg,rgba(255,235,59,0.15)_0%,rgba(255,152,0,0.15)_25%,rgba(255,107,157,0.15)_50%,rgba(156,39,176,0.15)_75%,rgba(33,150,243,0.15)_100%)] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border-t-2 border-t-white/80 border-l-2 border-l-white/80 border-b-2 border-b-[#1565C0]/50 border-r-2 border-r-[#1565C0]/50 pointer-events-auto min-w-[650px] justify-between transition-all duration-300 ${isScrolled ? 'h-[50px] scale-95' : 'h-[60px]'}`}>
            {/* Navigation Links */}
            <div className="flex items-center px-6 gap-8 flex-1 justify-center">
              <Link href="/jt" className="text-gray-900 font-bold hover:text-indigo-600 transition-colors text-sm">JTNews</Link>
              <Link href="/categories" className="text-gray-900 font-bold hover:text-indigo-600 transition-colors text-sm">Catégories</Link>
              <Link href="/articles" className="text-gray-900 font-bold hover:text-indigo-600 transition-colors text-sm">Actualité</Link>
              <Link href="/formation" className="text-gray-900 font-bold hover:text-indigo-600 transition-colors text-sm">Cours</Link>
              <Link href="/short-news" className="text-gray-900 font-bold hover:text-indigo-600 transition-colors text-sm">ShortNews</Link>
            </div>

            {/* Search Icon */}
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all text-gray-600 hover:text-indigo-600"
              aria-label="Rechercher"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>
          </div>

          {/* 3. Auth Button (Right) */}
          <div className="shrink-0 z-10 whitespace-nowrap">
            {mounted && (
              user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md border border-white/50 hover:shadow-lg transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {getUserDisplayName().charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{getUserDisplayName()}</span>
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 border border-gray-100 overflow-hidden">
                      <Link href="/parametres" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Paramètres</Link>
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Se déconnecter</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth" className="px-6 py-3 rounded-full font-bold text-slate-700 text-sm bg-blue-50/80 backdrop-blur-sm border border-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                    S&apos;inscrire / Se connecter
                </Link>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation (Simplified Fallback) */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 bg-white/95 backdrop-blur-md md:hidden ${isScrolled ? 'shadow-md' : 'shadow-sm'}`}>
        <div className="container mx-auto px-5">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="OREEGAM'IA" 
                width={120} 
                height={40} 
                className="h-[40px] w-auto drop-shadow-sm"
                priority
                unoptimized
              />
            </Link>
            <div className="flex items-center gap-4">
               <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2 text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
               </button>
               {user ? (
                 <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                    {getUserDisplayName().charAt(0).toUpperCase()}
                 </button>
               ) : (
                 <Link href="/auth" className="bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold">
                    Connexion
                 </Link>
               )}
            </div>
          </div>
          {/* Mobile Menu Content would go here if we were building a full mobile menu, keeping it minimal for now to focus on Desktop request. */}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
