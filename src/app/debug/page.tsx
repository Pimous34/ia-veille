'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function DebugPage() {
    const { user } = useAuth();
    const supabase = createClient();
    const [stats, setStats] = useState<any>(null);

    const checkData = async () => {
        if (!user) {
            toast.error('Veuillez vous connecter');
            return;
        }

        console.log('🔍 Checking data for user:', user.id);

        // Check saved_articles
        const { data: savedArticles, error: savedError } = await supabase
            .from('saved_articles')
            .select('*')
            .eq('user_id', user.id);

        console.log('📚 Saved articles:', savedArticles);
        if (savedError) console.error('Error:', savedError);

        // Check reading_history
        const { data: readingHistory, error: historyError } = await supabase
            .from('reading_history')
            .select('*')
            .eq('user_id', user.id);

        console.log('📖 Reading history:', readingHistory);
        if (historyError) console.error('Error:', historyError);

        setStats({
            savedArticles: savedArticles?.length || 0,
            readingHistory: readingHistory?.length || 0,
            savedData: savedArticles,
            historyData: readingHistory
        });

        toast.success('Données chargées - voir console');
    };

    const insertTestData = async () => {
        if (!user) {
            toast.error('Veuillez vous connecter');
            return;
        }

        try {
            // Insert multiple test reading history entries
            const testEntries = [
                {
                    user_id: user.id,
                    article_id: 'test-' + Date.now(),
                    article_title: 'Introduction au Machine Learning',
                    article_category: 'IA',
                    article_tags: ['machine-learning', 'python', 'data-science'],
                    reading_duration: 180,
                    read_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
                },
                {
                    user_id: user.id,
                    article_id: 'test-' + (Date.now() + 1),
                    article_title: 'Les réseaux de neurones expliqués',
                    article_category: 'IA',
                    article_tags: ['deep-learning', 'neural-networks', 'tensorflow'],
                    reading_duration: 240,
                    read_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
                },
                {
                    user_id: user.id,
                    article_id: 'test-' + (Date.now() + 2),
                    article_title: 'ChatGPT et les LLMs',
                    article_category: 'No-Code',
                    article_tags: ['chatgpt', 'llm', 'openai'],
                    reading_duration: 150,
                    read_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
                },
                {
                    user_id: user.id,
                    article_id: 'test-' + (Date.now() + 3),
                    article_title: 'Automatisation avec Python',
                    article_category: 'Automatisation',
                    article_tags: ['python', 'automation', 'scripting'],
                    reading_duration: 120,
                    read_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
                },
                {
                    user_id: user.id,
                    article_id: 'test-' + (Date.now() + 4),
                    article_title: 'Les bases du Prompt Engineering',
                    article_category: 'IA',
                    article_tags: ['prompt-engineering', 'chatgpt', 'ai'],
                    reading_duration: 200,
                    read_at: new Date().toISOString() // Now
                }
            ];

            const { error: historyError } = await supabase
                .from('reading_history')
                .insert(testEntries);

            if (historyError) throw historyError;

            // Get a real article ID from articles table
            const { data: articles } = await supabase
                .from('articles')
                .select('id')
                .limit(1);

            if (articles && articles.length > 0) {
                const { error: savedError } = await supabase
                    .from('saved_articles')
                    .insert({
                        user_id: user.id,
                        article_id: articles[0].id.toString(),
                        status: 'saved',
                        saved_at: new Date().toISOString()
                    });

                if (savedError && !savedError.message.includes('duplicate')) {
                    console.warn('Could not insert saved article:', savedError);
                }
            }

            toast.success(`✅ ${testEntries.length} entrées de test insérées !`);
            checkData();
        } catch (error: any) {
            console.error('Error inserting test data:', error);
            toast.error('Erreur: ' + error.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">🔧 Page de débogage</h1>

                {!user && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-yellow-800">⚠️ Vous devez être connecté pour utiliser cette page</p>
                    </div>
                )}

                <div className="space-y-4">
                    <button
                        onClick={checkData}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
                        disabled={!user}
                    >
                        🔍 Vérifier les données
                    </button>

                    <button
                        onClick={insertTestData}
                        className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold ml-4"
                        disabled={!user}
                    >
                        ➕ Insérer des données de test
                    </button>
                </div>

                {stats && (
                    <div className="mt-8 bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">📊 Statistiques</h2>
                        <div className="space-y-2">
                            <p><strong>Articles sauvegardés:</strong> {stats.savedArticles}</p>
                            <p><strong>Historique de lecture:</strong> {stats.readingHistory}</p>
                        </div>

                        {stats.savedData && stats.savedData.length > 0 && (
                            <div className="mt-4">
                                <h3 className="font-bold mb-2">Articles sauvegardés:</h3>
                                <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                                    {JSON.stringify(stats.savedData, null, 2)}
                                </pre>
                            </div>
                        )}

                        {stats.historyData && stats.historyData.length > 0 && (
                            <div className="mt-4">
                                <h3 className="font-bold mb-2">Historique de lecture:</h3>
                                <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                                    {JSON.stringify(stats.historyData, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-bold mb-2">💡 Instructions</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Cliquez sur "Vérifier les données" pour voir vos données actuelles</li>
                        <li>Cliquez sur "Insérer des données de test" pour ajouter des données factices</li>
                        <li>Allez sur <a href="/parametres" className="text-blue-600 underline">/parametres</a> pour voir si les données s'affichent</li>
                        <li>Ouvrez la console (F12) pour voir les logs détaillés</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
