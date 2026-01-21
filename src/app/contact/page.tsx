'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';


import toast from 'react-hot-toast';

export default function ContactPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      first_name: formData.get('firstName') as string,
      last_name: formData.get('lastName') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    };

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/feedback_students`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      setLoading(false);

      toast.success('Votre message a bien été envoyé !', {
        style: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#ffffff',
          fontWeight: '500',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          borderRadius: '12px',
          padding: '16px 24px',
        },
        iconTheme: {
          primary: '#ffffff',
          secondary: '#764ba2',
        },
        duration: 5000,
      });

      router.push('/');
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setLoading(false);
      toast.error(`Une erreur est survenue : ${error.message || 'Erreur inconnue'}`, {
        style: {
          background: '#ef4444',
          color: '#fff',
          fontWeight: '500',
        }
      });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: '800px' }}>

        {/* Logo Section */}
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

        {/* Contact Container */}
        <div className="auth-form-container" style={{ display: 'block' }}>
          <h1 className="auth-title">Nous Contacter</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
            Un bug ? Une suggestion ? N&apos;hésitez pas à nous écrire.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  placeholder="Prénom"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  placeholder="Nom"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="Email"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <select
                id="subject"
                name="subject"
                required
                className="form-input"
                defaultValue=""
              >
                <option value="" disabled>Sujet de votre message</option>
                <option value="Signaler un problème technique">Signaler un problème technique</option>
                <option value="Suggestion d'amélioration">Suggestion d&apos;amélioration</option>
                <option value="Question sur le contenu">Question sur le contenu</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div className="form-group">
              <textarea
                id="message"
                name="message"
                required
                placeholder="Votre message..."
                className="contact-textarea"
              />
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le message'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="auth-skip"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
