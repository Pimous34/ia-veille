'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function TestPage() {
  const [status, setStatus] = useState('Initiation...');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSupabase() {
      try {
        setStatus('Connexion à Supabase...');
        const supabase = createClient();
        
        // Test simple query
        const { data, error } = await supabase.from('app_messages').select('id, text, type').limit(1);
        
        if (error) {
          setStatus('Erreur Supabase ❌');
          setError(error.message);
        } else {
          setStatus('Succès Supabase ✅');
          setData(data);
        }
      } catch (err: any) {
        setStatus('Erreur Critique 💥');
        setError(err.message || String(err));
      }
    }

    checkSupabase();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Page de Diagnostic</h1>
      <div style={{ margin: '1rem 0', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
        <strong>Statut :</strong> {status}
      </div>

      {error && (
        <div style={{ color: 'red', background: '#ffe6e6', padding: '1rem', borderRadius: '8px' }}>
          <strong>Erreur détectée :</strong>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      {data && (
        <div style={{ color: 'green', background: '#e6ffe6', padding: '1rem', borderRadius: '8px' }}>
          <strong>Données reçues :</strong>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}

      <hr style={{ margin: '2rem 0' }} />
      
      <h3>Variables d'environnement :</h3>
      <ul>
        <li>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Définie' : '❌ MANQUANTE'}</li>
        <li>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Définie' : '❌ MANQUANTE'}</li>
      </ul>
    </div>
  );
}
