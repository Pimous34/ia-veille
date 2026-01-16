'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import { useReadTracking } from '@/hooks/useReadTracking';

interface NavbarProps {
  onSearch?: (query: string) => void;
}

const Navbar = ({ onSearch }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, supabase } = useAuth();
  const { readIds } = useReadTracking();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);



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
    if (pathname === '/') {
      // Delay slightly to ensure mount/animation
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          setIsSearchOpen(true);
        }
      }, 300);
    }
  }, [pathname]);


  useEffect(() => {
    // Close menu on route change
    setIsMenuOpen(false);
  }, [pathname]);

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Shadow & Resize logic (Desktop)
      if (currentScrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Visibility logic (Mobile: Hide on down, Show on up)
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsVisible(false); // Scrolling down & passed top
      } else {
        setIsVisible(true); // Scrolling up
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

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



  if (pathname === '/auth') return null;

  return (
    <>
      <nav
        className={`fixed inset-x-0 top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'h-16' : 'h-24'
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
                  style={{ height: isScrolled ? '60px' : '90px', width: 'auto' }}
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
                <Link href="/#actualite" className="text-gray-900 font-bold hover:text-indigo-600 transition-colors text-sm">Catégories</Link>
                <Link href="/#tutos" className="text-gray-900 font-bold hover:text-indigo-600 transition-colors text-sm">Tutos</Link>
                <Link href="/flashcards" className="text-gray-900 font-bold hover:text-indigo-600 transition-colors text-sm">Se former</Link>
                <Link href="/shorts" className="text-gray-900 font-bold hover:text-indigo-600 transition-colors text-sm">ShortNews</Link>
              </div>

              {/* Search Icon (Legacy - Kept for layout balance or future use) */}
              {/* Search Input */}
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Search Input */}
              <div className="relative group ml-4">
                <div className={`flex items-center bg-white/20 hover:bg-white/40 focus-within:bg-white/90 focus-within:shadow-md transition-all duration-300 rounded-full overflow-hidden ${isSearchOpen ? 'w-[250px]' : 'w-[40px] hover:w-[250px] focus-within:w-[250px]'}`}>
                  <div
                    className="w-[40px] h-[40px] flex items-center justify-center shrink-0 cursor-pointer text-gray-700"
                    onClick={() => {
                      if (searchValue) {
                        if (onSearch) {
                          onSearch(searchValue);
                        } else {
                          router.push(`/?q=${encodeURIComponent(searchValue)}`);
                        }
                      }
                      setIsSearchOpen(true);
                      if (searchInputRef.current) searchInputRef.current.focus();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchValue}
                    placeholder="Je veux comprendre..."
                    className="bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-600 h-full w-full pr-2 py-2"
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (onSearch) {
                          onSearch(searchValue);
                        } else {
                          router.push(`/?q=${encodeURIComponent(searchValue)}`);
                        }
                      }
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    onBlur={(e) => {
                      if (!searchValue) setIsSearchOpen(false);
                    }}
                  />
                  {searchValue && (
                    <button
                      onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking clear
                      onClick={() => {
                        setSearchValue('');
                        if (onSearch) onSearch('');
                      }}
                      className="mr-3 p-1 rounded-full hover:bg-gray-200 text-gray-500 transition-colors shrink-0"
                      aria-label="Effacer la recherche"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
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
                    className="flex items-center gap-2 px-4 py-2 rounded-full shadow-md border-t-2 border-t-white/80 border-l-2 border-l-white/80 border-b-2 border-b-[#1565C0]/50 border-r-2 border-r-[#1565C0]/50 hover:shadow-lg transition-all bg-[linear-gradient(135deg,rgba(255,235,59,0.15)_0%,rgba(255,152,0,0.15)_25%,rgba(255,107,157,0.15)_50%,rgba(156,39,176,0.15)_75%,rgba(33,150,243,0.15)_100%)] backdrop-blur-xl"
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
                        Espace personnel
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
            {/* Gamification Badge Strip */}
            <div className="flex flex-col items-center mt-2 group/badge relative">
              <div className="transition-all duration-500 transform hover:scale-110">
                {(() => {
                  const count = readIds?.length || 0;
                  let badge = { src: '/gamification/egg.png', label: 'Apprenti (Œuf)', next: 6 };

                  if (count >= 26) badge = { src: '/gamification/lion.png', label: 'Maître IA (Lion)', next: 100 };
                  else if (count >= 13) badge = { src: '/gamification/owl.png', label: 'Sage (Hibou)', next: 26 };
                  else if (count >= 6) badge = { src: '/gamification/fox.png', label: 'Futé (Renard)', next: 13 };

                  return (
                    <>
                      <Image
                        src={badge.src}
                        alt={badge.label}
                        width={isScrolled ? 35 : 45}
                        height={isScrolled ? 35 : 45}
                        className="drop-shadow-md"
                        unoptimized
                      />
                      {/* Tooltip on Hover */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-gray-800 text-white text-[10px] rounded-lg opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-[110] pointer-events-none">
                        <p className="font-bold">{badge.label}</p>
                        <p className="text-gray-300">{count} article{count > 1 ? 's' : ''} lu{count > 1 ? 's' : ''}</p>
                        {badge.next < 100 && (
                          <p className="text-indigo-300 mt-1 border-t border-gray-600 pt-1">Prochain : {badge.next} articles</p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation (Simplified Fallback) */}
      {/* Mobile Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-transform duration-300 md:hidden bg-[linear-gradient(135deg,rgba(255,235,59,0.15)_0%,rgba(255,152,0,0.15)_25%,rgba(255,107,157,0.15)_50%,rgba(156,39,176,0.15)_75%,rgba(33,150,243,0.15)_100%)] backdrop-blur-xl ${isScrolled ? 'shadow-md border-b-2 border-b-[#1565C0]/50' : 'shadow-sm border-b border-white/50'} ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="container mx-auto px-4">
          <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? 'h-14' : 'h-16'}`}>

            {/* Left: Burger Menu */}
            <div className="flex items-center justify-start flex-1">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 -ml-2 text-gray-800 hover:bg-white/40 rounded-lg transition-colors"
                aria-label="Menu"
              >
                {isMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                )}
              </button>
            </div>

            {/* Center: Logo */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Link href="/">
                <Image
                  src="/logo.png"
                  alt="OREEGAM'IA"
                  width={180}
                  height={60}
                  className={`w-auto transition-all duration-300 ${isScrolled ? 'h-[40px]' : 'h-[50px]'}`}
                  priority
                  unoptimized
                />
              </Link>
            </div>

            {/* Right: Actions (Search + Profile) */}
            <div className="flex items-center justify-end flex-1 gap-2">
              <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </button>

              {user && (
                <Link href="/parametres" className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                  {getUserDisplayName().charAt(0).toUpperCase()}
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu Content (Dropdown) */}
          {isMenuOpen && (
            <div className="absolute top-full left-0 w-full bg-white shadow-xl border-t border-gray-100 z-40 flex flex-col animate-slide-in-top">
              <div className="p-4 space-y-2">
                {user ? null : (
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <Link href="/auth" className="flex items-center justify-center w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-md">Se connecter</Link>
                  </div>
                )}

                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Navigation</p>
                <Link href="/jt" onClick={() => setIsMenuOpen(false)} className="block py-2.5 px-3 rounded-lg hover:bg-gray-50 text-gray-800 font-medium">JTNews</Link>
                <Link href="/#actualite" onClick={() => setIsMenuOpen(false)} className="block py-2.5 px-3 rounded-lg hover:bg-gray-50 text-gray-800 font-medium">Catégories</Link>
                <Link href="/#tutos" onClick={() => setIsMenuOpen(false)} className="block py-2.5 px-3 rounded-lg hover:bg-gray-50 text-gray-800 font-medium">Tutos</Link>
                <Link href="/flashcards" onClick={() => setIsMenuOpen(false)} className="block py-2.5 px-3 rounded-lg hover:bg-gray-50 text-gray-800 font-medium">Se former</Link>
                <Link href="/shorts" onClick={() => setIsMenuOpen(false)} className="block py-2.5 px-3 rounded-lg hover:bg-gray-50 text-gray-800 font-medium">ShortNews</Link>

                {user && (
                  <button onClick={handleLogout} className="block w-full text-left py-2.5 px-3 mt-4 text-red-600 font-medium border-t border-gray-100">
                    Se déconnecter
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
