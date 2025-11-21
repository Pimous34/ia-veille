'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function ParametresPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }

      setUser(user);
      setFormData({
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: user.email || '',
      });
      setLoading(false);
    };

    getUser();
  }, [router, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: formData.full_name }
      });

      if (error) throw error;

      setMessage('Paramètres mis à jour avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Erreur lors de la mise à jour des paramètres.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Paramètres du compte
          </h1>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Votre nom complet"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  L&apos;email ne peut pas être modifié pour le moment
                </p>
              </div>

              {message && (
                <div className={`p-4 rounded-lg ${
                  message.includes('succès') 
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                    : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                }`}>
                  {message}
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Informations du compte
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">ID utilisateur:</span>
                <span className="text-gray-900 dark:text-white font-mono text-xs">{user?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Compte créé le:</span>
                <span className="text-gray-900 dark:text-white">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
