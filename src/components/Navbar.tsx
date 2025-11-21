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
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 bg-white dark:bg-white ${
        isScrolled ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center shrink-0" aria-label="OREEGAM'IA">
            <OreegamiaLogo className="w-20 md:w-24" />
          </Link>
          
          <div className="flex items-center gap-4 md:gap-8 overflow-x-auto no-scrollbar ml-4 flex-1 mask-linear-to-r">
            <Link href="/jt" className="text-black hover:text-indigo-600 transition-colors whitespace-nowrap font-medium text-sm">
              JT
            </Link>
            <Link href="/scroll" className="text-black hover:text-indigo-600 transition-colors whitespace-nowrap font-medium text-sm">
              Scroll
            </Link>
            <Link href="/articles" className="text-black hover:text-indigo-600 transition-colors whitespace-nowrap font-medium text-sm">
              Article
            </Link>
            <Link href="/sauvegarder" className="text-black hover:text-indigo-600 transition-colors whitespace-nowrap font-medium text-sm">
              Sauvegarder
            </Link>
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
