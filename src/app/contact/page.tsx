'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ContactPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Merci pour votre message ! Nous vous répondrons bientôt.');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
            {/* Reusing the logo style or just text if logo component not available */}
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">OREEGAM&apos;IA</h1>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Nous Contacter
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Un bug ? Une suggestion ? N&apos;hésitez pas à nous écrire.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sujet de votre message
              </label>
              <div className="mt-1">
                <select
                  id="subject"
                  name="subject"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  defaultValue=""
                >
                  <option value="" disabled>Sujet de votre message</option>
                  <option value="bug">Signaler un problème technique</option>
                  <option value="suggestion">Suggestion d&apos;amélioration</option>
                  <option value="content">Question sur le contenu</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Votre message
              </label>
              <div className="mt-1">
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  placeholder="Votre message..."
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white min-h-[120px]"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                style={{ backgroundColor: '#2563eb' }}
              >
                Envoyer le message
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="relative flex justify-center text-sm">
                <Link href="/" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                  Retour à l&apos;accueil
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
