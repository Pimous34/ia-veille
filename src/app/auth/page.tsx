'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function AuthContent() {
  const searchParams = useSearchParams();
  const isAdminView = searchParams.get('admin') === '1';
  const view: 'welcome' | 'login' = isAdminView ? 'login' : 'welcome';
  const supabase = createClient();

  // Social Login Handler
  const handleOAuthSignIn = async (provider: 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      console.error(`Erreur Auth ${provider}:`, error);
      const message = error instanceof Error ? error.message : 'Une erreur est survenue';
      alert(`Erreur lors de la connexion avec ${provider}: ` + message);
    }
  };

  // -------------------------------------------------------------
  // WELCOME SCREEN
  // -------------------------------------------------------------
  if (view === 'welcome') {
    return (
      <div className="auth-page">
        <div className="auth-container">
            {/* Logo */}
            <div className="auth-logo">
                <Link href="/">
                    <div className="logo-wrapper" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <Image 
                            src="/logo.png" 
                            alt="OREEGAM'IA Logo" 
                            width={300}
                            height={150}
                            className="logo-img"
                            style={{ display: 'block', height: '150px', width: 'auto', margin: '0 auto', transform: 'none' }}
                            priority
                            unoptimized
                        />
                    </div>
                </Link>
            </div>

            <h1 className="auth-title">
                Rejoignez la veille IA & No-Code
            </h1>

            <div className="space-y-4">
                {/* Google Only */}
                <button 
                    onClick={() => handleOAuthSignIn('google')}
                    className="w-full py-4 px-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex items-center justify-center gap-3 group"
                    title="Connexion avec Google"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" className="transform group-hover:scale-110 transition-transform">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="font-bold text-gray-700 text-lg">Continuer avec Google</span>
                </button>

                <div className="pt-4 text-center">
                    <button 
                        onClick={() => window.location.search = '?admin=1'} 
                        className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                        Connexion avec identifiants
                    </button>
                </div>
            </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LOGIN FORM
  // -------------------------------------------------------------
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
            <Link href="/">
                <div className="logo-wrapper" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <Image 
                        src="/logo.png" 
                        alt="OREEGAM'IA Logo" 
                        width={300}
                        height={150}
                        className="logo-img"
                        style={{ display: 'block', height: '150px', width: 'auto', margin: '0 auto', transform: 'none' }}
                        priority
                        unoptimized
                    />
                </div>
            </Link>
        </div>

        <div className="auth-form-container" style={{ display: 'block' }}>
            <h2 className="auth-title">
                Bon retour !
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
                Heureux de vous revoir parmi nous.
            </p>

            <LoginForm supabase={supabase} />

            <div className="mt-8 text-center pt-6 border-t border-gray-100">
                <Link href="/" className="auth-skip">
                    Retour à l&apos;accueil
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="auth-container"><div className="auth-logo"><div className="logo-wrapper" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}><Image src="/logo.png" alt="Logo" width={300} height={150} className="logo-img" style={{ display: 'block', height: '150px', width: 'auto', margin: '0 auto' }} unoptimized /></div></div></div></div>}>
      <AuthContent />
    </Suspense>
  );
}

// -------------------------------------------------------------
// HELPER COMPONENTS
// -------------------------------------------------------------

import type { SupabaseClient } from '@supabase/supabase-js';

function LoginForm({ supabase }: { supabase: SupabaseClient }) {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Admin Check
            if (email === 'stessier@edu-oreegami.com' && password === 'oreegami') {
                router.push('/admin');
                return;
            }

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            router.push('/');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Une erreur est survenue';
            alert('Erreur: ' + message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Adresse email</label>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="vous@exemple.com"
                />
            </div>

            <div className="form-group">
                 <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-semibold text-gray-700">Mot de passe</label>
                    <a href="#" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">Oublié ?</a>
                 </div>
                <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="••••••••"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="auth-submit-btn"
            >
                {loading ? 'Connexion en cours...' : 'Se Connecter'}
            </button>
        </form>
    );
}
