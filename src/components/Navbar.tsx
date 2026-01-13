'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

 const Navbar = () => {
   const [isScrolled, setIsScrolled] = useState(false);
   const { user } = useAuth();
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [isSearchOpen, setIsSearchOpen] = useState(false);
   const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Auto-focus search input on Homepage only


  useEffect(() => {
    // Close menu on route change
    setIsMenuOpen(false);
  }, [pathname]);

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

  // Authentication logic removed as it's handled by AuthContext

  // Fermer le menu quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    console.log("Navbar: Logout initiated");
    // 1. Close menu immediately for feedback
    setIsMenuOpen(false);

    try {
        // 2. Attempt sign out with a safety timeout
        console.log("Navbar: Calling supabase.auth.signOut()");
        const signOutPromise = supabase.auth.signOut();
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2000)); // 2s max wait
        
        await Promise.race([signOutPromise, timeoutPromise]);
        console.log("Navbar: Sign out completed or timed out");
    } catch (err) {
        console.error("Navbar: Error during logout:", err);
    } finally {
        console.log("Navbar: Redirecting to /auth");
        // 3. Force hard redirect to /auth to clear state and ensure login screen
        window.location.href = '/auth';
    }
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
        <div className="container mx-auto h-full px-5 relative flex items-center justify-center">
          
          {/* Center Group: Logo + Navigation Pill */}
          {/* We treat them as a unit centered on the screen. 
              The user wants the LOGO next to the BAR. 
              If the bar is strictly centered, the logo sits to its left.
          */}
          <div className="flex items-center gap-6">
             {/* Logo */}
             <div className="shrink-0 transition-opacity hover:opacity-80">
                <Link href="/" aria-label="OREEGAM'IA">
                     <Image 
                       src="/logo.png" 
                       alt="OREEGAM'IA" 
                       width={450} 
                       height={120} 
                       className="w-auto drop-shadow-sm transition-all duration-300"
                       style={{ height: isScrolled ? '80px' : '120px', width: 'auto' }}
                       priority
                       unoptimized
                     />
                </Link>
             </div>

            {/* Main Pill */}
            <div className={`flex items-center gap-1 px-2 py-2 rounded-[50px] bg-[linear-gradient(135deg,rgba(255,235,59,0.15)_0%,rgba(255,152,0,0.15)_25%,rgba(255,107,157,0.15)_50%,rgba(156,39,176,0.15)_75%,rgba(33,150,243,0.15)_100%)] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border-t-2 border-t-white/80 border-l-2 border-l-white/80 border-b-2 border-b-[#1565C0]/50 border-r-2 border-r-[#1565C0]/50 pointer-events-auto min-w-[650px] justify-between transition-all duration-300 ${isScrolled ? 'h-[50px] scale-95' : 'h-[60px]'}`}>
              {/* Navigation Links */}
              <div className="flex items-center px-6 gap-8 flex-1 justify-center">
                <Link href="/jt" className="text-gray-900 font-bold hover:text-indigo-600 transition-colors text-sm">JTNews</Link>
                <Link href="/categories" className="text-gray-900 font-bold hover:text-indigo-600 transition-colors text-sm">Catégories</Link>
                <Link href="/articles" className="text-gray-900 font-bold hover:text-indigo-600 transition-colors text-sm">Actualité</Link>
                <Link href="/flashcards" className="text-gray-900 font-bold hover:text-indigo-600 transition-colors text-sm">Se former</Link>
                <Link href="/shorts" className="text-gray-900 font-bold hover:text-indigo-600 transition-colors text-sm">ShortNews</Link>
              </div>

              {/* Search Icon (Legacy - Kept for layout balance or future use) */}
               <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 cursor-default">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
               </div>
            </div>

            {/* NEW: Je veux comprendre Input */}

          </div>

          {/* 3. Auth Button (Positions Absolutely to the Right) */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2 shrink-0 z-50 whitespace-nowrap pointer-events-auto">
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
                      <div 
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 border border-gray-100 z-[100]"
                      >
                        <Link 
                            href="/parametres" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 bg-white"
                        >
                            Paramètres
                        </Link>
                        <Link 
                            href="/admin" 
                            className="block px-4 py-2 text-sm text-indigo-600 font-semibold hover:bg-indigo-50 border-t border-gray-50 bg-white"
                        >
                            Espace Admin
                        </Link>
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                handleLogout();
                            }} 
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-50 bg-white"
                        >
                            Se déconnecter
                        </button>
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
            <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? 'h-16' : 'h-24'}`}>
              <Link href="/" className="flex items-center">
                <Image 
                  src="/logo.png" 
                  alt="OREEGAM'IA" 
                  width={240} 
                  height={80} 
                  className={`${isScrolled ? 'h-[60px]' : 'h-[80px]'} w-auto drop-shadow-sm transition-all duration-300`}
                  priority
                  unoptimized
                />
              </Link>
            <div className="flex items-center gap-4 relative">
               <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2 text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
               </button>
               {user ? (
                 <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                        {getUserDisplayName().charAt(0).toUpperCase()}
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl py-1 border border-gray-100 overflow-hidden z-50 animate-scale-in">
                            <Link href="/parametres" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50">Paramètres</Link>
                            <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-sm text-indigo-600 font-semibold hover:bg-indigo-50 border-b border-gray-50">Espace Admin</Link>
                            <button onClick={handleLogout} className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50">Se déconnecter</button>
                        </div>
                    )}
                 </div>
               ) : (
                 <Link href="/auth" className="bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-md">
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
