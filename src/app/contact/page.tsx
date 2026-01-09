'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ContactPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Merci pour votre message ! Nous vous répondrons bientôt.');
    router.push('/');
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
            <div className="form-group">
              <select
                id="subject"
                name="subject"
                required
                className="form-input"
                defaultValue=""
              >
                <option value="" disabled>Sujet de votre message</option>
                <option value="bug">Signaler un problème technique</option>
                <option value="suggestion">Suggestion d&apos;amélioration</option>
                <option value="content">Question sur le contenu</option>
                <option value="other">Autre</option>
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
            >
              Envoyer le message
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
