'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, Plus, Filter, Edit2, ExternalLink } from 'lucide-react';
import { createClient } from '@/utils/supabase/client'; // Assuming this path for Supabase client

interface Article {
  id: string;
  title: string;
  source: string;
  type: string;
  category: string;
  views: string;
  engagement: string;
  status: 'Publié' | 'Brouillon';
}

const getCategory = (article: any) => {
  const tags = (article.tags || []).map((t: string) => t.toLowerCase());
  const title = (article.title || '').toLowerCase();

  const iaKeywords = ['ia', 'ai', 'intelligence', 'llm', 'gpt', 'learning'];
  const noCodeKeywords = ['no-code', 'nocode', 'bubble', 'airtable', 'notion', 'flutterflow'];
  const autoKeywords = ['automatisation', 'automation', 'make', 'zapier', 'n8n', 'api'];

  if (autoKeywords.some(k => tags.includes(k) || title.includes(k))) return 'Automatisation';
  if (noCodeKeywords.some(k => tags.includes(k) || title.includes(k))) return 'No-Code';
  if (iaKeywords.some(k => tags.includes(k) || title.includes(k))) return 'IA';

  return 'Autres';
};

export default function AdminArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState({ ia: 0, noCode: 0, auto: 0, autres: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();

  React.useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedArticles = (data || []).map(item => {
          const category = getCategory(item);
          const isVideo = (item.tags || []).includes('Vidéo') || (item.tags || []).includes('Video');
          const source = item.url ? new URL(item.url).hostname.replace('www.', '') : 'Interne';

          return {
            id: item.id,
            title: item.title,
            source: source,
            type: isVideo ? '🎥 Vidéo' : '📝 Texte',
            category: category,
            views: Math.floor(Math.random() * 500).toString(), // Placeholder until interactions linked
            engagement: '4.5/5', // Placeholder
            status: (item.published_at ? 'Publié' : 'Brouillon') as 'Publié' | 'Brouillon'
          };
        });

        setArticles(formattedArticles);

        // Calculate Stats
        const newStats = formattedArticles.reduce((acc: any, curr: any) => {
          if (curr.category === 'IA') acc.ia++;
          else if (curr.category === 'No-Code') acc.noCode++;
          else if (curr.category === 'Automatisation') acc.auto++;
          else acc.autres++;
          return acc;
        }, { ia: 0, noCode: 0, auto: 0, autres: 0 });

        setStats(newStats);
      } catch (err) {
        console.error('Error fetching articles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [supabase]);

  const filteredArticles = articles.filter(article =>
    `${article.title} ${article.category}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="sidebar">
        <Link href="/" className="sidebar-header group flex flex-col items-center gap-2 py-6 px-4">
          <div className="relative w-full h-16 flex justify-center">
            <Image
              src="/logo.png"
              alt="OREEGAM'IA"
              fill
              className="object-contain drop-shadow-sm"
              priority
              unoptimized
            />
          </div>
          <div className="text-xs font-bold tracking-widest text-indigo-300 uppercase">Administration</div>
        </Link>

        <nav className="sidebar-nav">
          <Link href="/admin" className="nav-item">
            <span className="nav-icon">📊</span>
            <span>Tableau de bord</span>
          </Link>
          <Link href="/admin/articles" className="nav-item active">
            <span className="nav-icon">📰</span>
            <span>Articles</span>
          </Link>
          <Link href="/admin/users" className="nav-item">
            <span className="nav-icon">🛡️</span>
            <span>Gestion des Accès</span>
          </Link>
          <Link href="/admin/flashcards" className="nav-item">
            <span className="nav-icon">🧠</span>
            <span>Cartes Mémo</span>
          </Link>
          <Link href="/admin/settings" className="nav-item">
            <span className="nav-icon">⚙️</span>
            <span>Paramètres</span>
          </Link>
        </nav>

        <div className="user-profile">
          <div className="avatar">A</div>
          <div className="user-info">
            <div className="user-name">Admin</div>
            <div className="user-email">stessier@edu...</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content px-8">
        <div className="top-bar mt-24 mb-12 flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-indigo-500 w-fit">Gestion du Contenu</h1>
            <p className="text-slate-500 dark:text-slate-400">Analysez vos performances par catégorie et gérez votre contenu multicanal.</p>
          </div>
          <button onClick={() => router.push('/auth')} className="logout-btn mb-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors font-bold uppercase tracking-wider">
            Déconnexion
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-xl">🤖</div>
              <span className="text-sm font-bold text-gray-400">IA</span>
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.ia}</div>
            <div className="text-xs text-green-500 font-bold mt-1">+12% vues</div>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-xl">⚡</div>
              <span className="text-sm font-bold text-gray-400">No-Code</span>
            </div>
            <div className="text-3xl font-black text-gray-900">{stats.noCode}</div>
            <div className="text-xs text-green-500 font-bold mt-1">+8% vues</div>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-xl">⚙️</div>
              <span className="text-sm font-bold text-gray-400">Automatisation</span>
            </div>
            <div className="text-3xl font-black text-gray-900">{stats.auto}</div>
            <div className="text-xs text-green-500 font-bold mt-1">+24% vues</div>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center text-xl">📢</div>
              <span className="text-sm font-bold text-gray-400">Autres</span>
            </div>
            <div className="text-3xl font-black text-gray-900">{stats.autres}</div>
            <div className="text-xs text-green-500 font-bold mt-1">+5% vues</div>
          </div>
        </div>

        {/* Filters & Actions */}
        <section className="content-section">
          <div className="section-header">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Chercher un titre ou catégorie..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-gray-500 font-bold hover:bg-gray-50 transition-all">
                <Filter size={18} />
                <span>Filtres</span>
              </button>
            </div>
            <button className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-sm">
              <Plus size={18} />
              <span>Nouveau</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm p-6 overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Source</th>
                  <th>Catégorie</th>
                  <th>Performances</th>
                  <th>Statut</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((article) => (
                  <tr key={article.id}>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-white max-w-sm block truncate" title={article.title}>{article.title}</span>
                        <span className="text-xs text-gray-400 mt-1">{article.type}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-gray-600 truncate max-w-[120px] block" title={article.source}>
                        {article.source}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-gray-500">{article.category}</span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-black text-indigo-600">{article.views} vues</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">{article.engagement} engagement</span>
                      </div>
                    </td>
                    <td>
                      <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full ${article.status === 'Publié' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                        {article.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Éditer">
                          <Edit2 size={18} />
                        </button>
                        <button className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all" title="Voir">
                          <ExternalLink size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredArticles.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">Aucun article trouvé.</td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">Chargement...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
