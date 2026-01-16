// Script de test pour l'Edge Function fetch-rss
// Permet de tester localement la logique de collecte RSS

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jrlecaepyoivtplpvwoe.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqaW9iaWZnY3ZkYXBpa3VybGJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEwMjQ4MSwiZXhwIjoyMDgwNjc4NDgxfQ.TDVP4swScKmcyyrn9e3iXMRjEEiwQsSooGqpX70imEA';

async function testRSSFetch() {
  console.log('🧪 Test de la collecte RSS...\n');

  // Créer le client Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 1. Vérifier les sources RSS actives
    console.log('📡 Récupération des sources RSS actives...');
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('*')
      .eq('type', 'rss')
      .eq('is_active', true);

    if (sourcesError) {
      throw new Error(`Erreur lors de la récupération des sources: ${sourcesError.message}`);
    }

    console.log(`✅ ${sources?.length || 0} sources RSS actives trouvées\n`);

    if (!sources || sources.length === 0) {
      console.log('⚠️  Aucune source RSS active. Exécutez d\'abord la migration insert_rss_sources.sql');
      return;
    }

    // 2. Afficher les sources
    console.log('📋 Liste des sources:');
    sources.forEach((source, index) => {
      console.log(`  ${index + 1}. ${source.name}`);
      console.log(`     URL: ${source.rss_url}`);
      console.log(`     Dernière collecte: ${source.last_fetch_date || 'Jamais'}\n`);
    });

    // 3. Tester l'appel à l'Edge Function
    console.log('🚀 Appel de l\'Edge Function fetch-rss...');
    const functionUrl = `${SUPABASE_URL}/functions/v1/fetch-rss`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'fetch_rss' }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('\n✅ Résultat de la collecte:');
    console.log(`   Articles ajoutés: ${result.total_articles_added}`);
    console.log(`   Sources traitées: ${result.sources_processed}\n`);

    if (result.results && result.results.length > 0) {
      console.log('📊 Détails par source:');
      result.results.forEach((r: any) => {
        console.log(`   • ${r.source}: ${r.articles_added || 0} articles ajoutés (${r.status})`);
      });
    }

    // 4. Vérifier les articles dans la base
    console.log('\n📰 Vérification des articles récents...');
    const { data: recentArticles, error: articlesError } = await supabase
      .from('articles')
      .select('title, published_at, source_id')
      .order('created_at', { ascending: false })
      .limit(5);

    if (articlesError) {
      console.error('⚠️  Erreur lors de la récupération des articles:', articlesError.message);
    } else {
      console.log(`✅ ${recentArticles?.length || 0} articles récents trouvés:`);
      recentArticles?.forEach((article, index) => {
        console.log(`   ${index + 1}. ${article.title.substring(0, 60)}...`);
      });
    }

    console.log('\n✅ Test terminé avec succès!');
  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error);
    process.exit(1);
  }
}

// Exécuter le test
testRSSFetch();
