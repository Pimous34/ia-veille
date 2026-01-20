'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, Plus, Filter, Edit2, ExternalLink } from 'lucide-react';

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

const INITIAL_ARTICLES: Article[] = [
  { id: '1', title: "L'IA générative en 2026 : Tendances", source: 'Blog Interne', type: '📝 Texte', category: 'Intelligence Artificielle', views: '12.5k', engagement: '4.8/5', status: 'Publié' },
  { id: '2', title: "Tutoriel Make.com : Automatiser ses emails", source: 'YouTube', type: '🎥 Vidéo', category: 'Automatisation', views: '8.3k', engagement: '98% 👍', status: 'Publié' },
  { id: '3', title: "Podcast : Le futur du No-Code", source: 'Spotify / Audio', type: '🎙️ Audio', category: 'No-Code', views: '3.2k', engagement: '4.5/5', status: 'Publié' },
  { id: '4', title: "Comparatif des outils No-Code 2025", source: 'Medium', type: '📝 Texte', category: 'No-Code', views: '5.1k', engagement: '350 👏', status: 'Brouillon' },
  { id: '5', title: "Les agents autonomes expliqués", source: 'Blog Interne', type: '📝 Texte', category: 'Intelligence Artificielle', views: '1.2k', engagement: '4.2/5', status: 'Publié' },
];

export default function AdminArticlesPage() {
  const router = useRouter();
  const [articles] = useState<Article[]>(INITIAL_ARTICLES);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = articles.filter(article => 
    `${article.title} ${article.category}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen">
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
            <span>Dashboard</span>
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
          <Link href="#" className="nav-item">
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
      <main className="main-content">
        <div className="top-bar mt-12">
          <h1 className="page-title text-pink-500">Gestion du Contenu</h1>
          <button onClick={() => router.push('/auth')} className="logout-btn">
            Déconnexion
          </button>
        </div>

        <div className="welcome-banner">
          <h2 className="welcome-text">Articles & Contenus</h2>
          <p className="welcome-subtext">Analysez vos performances par catégorie et gérez votre contenu multicanal.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">🤖</div>
                    <span className="text-sm font-bold text-gray-400">IA</span>
                </div>
                <div className="text-3xl font-black text-gray-900">458</div>
                <div className="text-xs text-green-500 font-bold mt-1">+12% vues</div>
            </div>
            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-xl">⚡</div>
                    <span className="text-sm font-bold text-gray-400">No-Code</span>
                </div>
                <div className="text-3xl font-black text-gray-900">284</div>
                <div className="text-xs text-green-500 font-bold mt-1">+8% vues</div>
            </div>
            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-xl">⚙️</div>
                    <span className="text-sm font-bold text-gray-400">Auto</span>
                </div>
                <div className="text-3xl font-black text-gray-900">127</div>
                <div className="text-xs text-green-500 font-bold mt-1">+24% vues</div>
            </div>
            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center text-xl">📢</div>
                    <span className="text-sm font-bold text-gray-400">Marketing</span>
                </div>
                <div className="text-3xl font-black text-gray-900">96</div>
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
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 transition-colors"
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

          <div className="table-container">
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
                            <span className="font-bold text-gray-900">{article.title}</span>
                            <span className="text-xs text-gray-400 mt-1">{article.type}</span>
                        </div>
                    </td>
                    <td>
                        <span className="text-sm px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-gray-600">
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
                        <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full ${
                            article.status === 'Publié' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
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
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
