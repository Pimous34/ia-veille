'use client';

import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import './auth.css';

export default function AuthPage() {
  // Views: 'welcome' (default), 'login' (login form), 'signup' (create account form)
  // Matching auth.html IDs/flow
  const [view, setView] = useState<'welcome' | 'login' | 'signup' | 'authed'>('welcome');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            setUser(session.user);
            setView('authed');
        }
    };
    checkSession();
  }, [supabase]);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    localStorage.clear(); // Force clear everything
    
    // Specifically clear SB tokens if they exist in localStorage
    Object.keys(localStorage).forEach(key => {
        if(key.includes('sb-')) localStorage.removeItem(key);
    });

    setUser(null);
    setView('welcome');
    setLoading(false);
    window.location.reload();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/');
        router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas.");
        setLoading(false);
        return;
    }

    try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
                full_name: fullName,
            },
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setError('Vérifiez vos emails pour confirmer votre inscription.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) throw error;
    } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('Erreur lors de la connexion via ' + provider);
        }
        setLoading(false);
    }
  };

  return (
    <div className="auth-page">
        <div className="auth-container">
            {/* Logo */}
            <div className="auth-logo">
                <div className="logo">
                    <div className="logo-wrapper">
                         {/* Images hidden as in original html */}
                        <Image src="/logo.png" alt="OREEGAM'IA Logo" className="logo-img" style={{ display: 'none' }} width={120} height={120} />
                        <Image src="/logo.svg" alt="OREEGAM'IA Logo" className="logo-img" style={{ display: 'none' }} width={120} height={120} />
                    </div>
                    <div className="logo-placeholder">
                        <span className="logo-text">OREEGAM&apos;IA</span>
                    </div>
                </div>
            </div>

            {/* ERROR MESSAGE DISPLAY (Added for functionality) */}
            {error && (
                <div style={{ color: 'red', marginBottom: '1rem', background: '#ffebee', padding: '0.5rem', borderRadius: '4px' }}>
                    {error}
                </div>
            )}

            {/* Welcome Screen */}
            {view === 'welcome' && (
                <div className="auth-welcome" id="welcomeScreen">
                    <h1 className="auth-title">Rejoignez la veille IA & No-Code</h1>

                    <div className="auth-buttons">
                        <button className="auth-primary-btn" onClick={() => setView('login')}>Se Connecter</button>
                        <button className="auth-secondary-btn" onClick={() => setView('signup')}>Créer un Compte</button>
                    </div>

                    <div className="auth-divider">
                        <span>OU</span>
                    </div>

                    <div className="social-buttons">
                        <button className="social-btn" onClick={() => handleOAuthSignIn('google')}>
                            <svg width="24" height="24" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        </button>
                        <button className="social-btn" onClick={() => handleOAuthSignIn('facebook')}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                        </button>
                        <button className="social-btn" onClick={() => handleOAuthSignIn('apple')}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#000000">
                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                            </svg>
                        </button>
                    </div>

                    <Link href="/" className="auth-skip">Continuer sans compte →</Link>
                </div>
            )}

            {/* Authenticated Screen */}
            {view === 'authed' && (
                <div className="auth-welcome" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h1 className="auth-title">Vous êtes connecté !</h1>
                    {user && (
                        <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #bae6fd' }}>
                           <p style={{ margin: 0, fontWeight: 500 }}>{user.email}</p>
                           {user.user_metadata?.full_name && <p style={{ margin: 0, fontSize: '0.9em', color: '#666' }}>{user.user_metadata.full_name}</p>}
                        </div>
                    )}
                    
                    <button className="auth-primary-btn" onClick={() => router.push('/')}>
                        Aller à l&apos;accueil
                    </button>
                    <button className="auth-secondary-btn" onClick={handleLogout} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                        Se déconnecter (Reset)
                    </button>
                </div>
            )}

            {/* Login/Signup Form */}
            {(view === 'login' || view === 'signup') && (
                <div className="auth-form-container" id="formScreen">
                    <h1 className="auth-title" id="formTitle">Bienvenue</h1>

                    {/* Toggle between Login and Signup */}
                    <div className="auth-toggle">
                        <button 
                            className={`toggle-btn ${view === 'login' ? 'active' : ''}`} 
                            id="loginToggle" 
                            onClick={() => setView('login')}
                        >
                            Se Connecter
                        </button>
                        <button 
                            className={`toggle-btn ${view === 'signup' ? 'active' : ''}`} 
                            id="signupToggle" 
                            onClick={() => setView('signup')}
                        >
                            Créer un Compte
                        </button>
                    </div>

                    {/* Login Form */}
                    {view === 'login' && (
                        <form className="auth-form" id="loginForm" onSubmit={handleLogin}>
                            <div className="form-group">
                                <input 
                                    type="email" 
                                    className="form-input" 
                                    placeholder="Adresse email" 
                                    required 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <input 
                                    type="password" 
                                    className="form-input" 
                                    placeholder="Mot de passe" 
                                    required 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <a href="#" className="forgot-password">Mot de passe oublié ?</a>
                            </div>
                            <button type="submit" className="auth-submit-btn" disabled={loading}>
                                {loading ? 'Chargement...' : 'Se Connecter'}
                            </button>
                        </form>
                    )}

                    {/* Signup Form */}
                    {view === 'signup' && (
                        <form className="auth-form" id="signupForm" onSubmit={handleSignup}>
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="Nom complet" 
                                    required 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <input 
                                    type="email" 
                                    className="form-input" 
                                    placeholder="Adresse email" 
                                    required 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <input 
                                    type="password" 
                                    className="form-input" 
                                    placeholder="Mot de passe" 
                                    required 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <input 
                                    type="password" 
                                    className="form-input" 
                                    placeholder="Confirmer le mot de passe" 
                                    required 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="auth-submit-btn" disabled={loading}>
                                {loading ? 'Chargement...' : 'Créer un Compte'}
                            </button>
                        </form>
                    )}

                    <Link href="/" className="auth-skip">Continuer sans compte →</Link>
                </div>
            )}
        </div>
    </div>
  );
}
