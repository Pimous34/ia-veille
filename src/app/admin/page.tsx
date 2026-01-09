'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    // In a real app, call supabase.auth.signOut() here
    router.push('/auth');
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex-col hidden md:flex">
        <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">OREEGAM&apos;IA</div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            <li>
              <Link href="/admin" className="flex items-center px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg group transition-colors">
                <span className="mr-3 text-lg">📊</span>
                <span className="font-medium">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/articles" className="flex items-center px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-lg group transition-colors">
                <span className="mr-3 text-lg">📰</span>
                <span className="font-medium">Articles</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/users" className="flex items-center px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-lg group transition-colors">
                <span className="mr-3 text-lg">👥</span>
                <span className="font-medium">Utilisateurs</span>
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-lg group transition-colors">
                <span className="mr-3 text-lg">⚙️</span>
                <span className="font-medium">Paramètres</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
              A
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Admin</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">stessier@edu...</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tableau de Bord</h1>
            <button 
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8">
            {/* Welcome Banner */}
            <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-2">Bonjour Samuel,</h2>
                    <p className="opacity-90">Voici ce qui se passe sur Oreegam&apos;ia aujourd&apos;hui.</p>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white opacity-10 transform skew-x-12 translate-x-10"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon="📝" color="bg-pink-100 text-pink-600" title="Articles Total" value="869" />
                <StatCard icon="👁️" color="bg-purple-100 text-purple-600" title="Vues ce mois" value="12.5k" />
                <StatCard icon="👥" color="bg-blue-100 text-blue-600" title="Abonnés" value="624" />
                <StatCard icon="⚠️" color="bg-orange-100 text-orange-600" title="Retours" value="15" />
            </div>

            {/* User Feedback Section */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Retours Utilisateurs</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FeedbackCard 
                        type="Bug" 
                        date="Il y a 2h" 
                        content="Impossible de changer mon mot de passe, ça charge à l'infini..." 
                        author="Thomas Dubois" 
                        initials="TD"
                        typeColor="bg-red-100 text-red-700"
                    />
                    <FeedbackCard 
                        type="Suggestion" 
                        date="Hier" 
                        content="Ce serait super d'avoir un mode sombre pour lire les articles le soir !" 
                        author="Marie Lefebvre" 
                        initials="ML"
                        typeColor="bg-blue-100 text-blue-700"
                    />
                    <FeedbackCard 
                        type="Contenu" 
                        date="05 Jan" 
                        content="L'article sur Make.com est top, merci pour les détails !" 
                        author="Julien Simon" 
                        initials="JS"
                        typeColor="bg-green-100 text-green-700"
                    />
                </div>
            </section>

             {/* Recent Content Section */}
             <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Derniers Articles</h2>
                    <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors flex items-center">
                        <span className="mr-1 text-lg leading-none">+</span> Nouvel Article
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">
                                <th className="px-6 py-3">Titre</th>
                                <th className="px-6 py-3">Catégorie</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Auteur</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            <ArticleRow title="L'IA générative en 2024" category="Intelligence Artificielle" date="07 Jan 2026" author="Samuel Tessier" status="Publié" statusColor="bg-green-100 text-green-800" />
                            <ArticleRow title="Tutoriel Make.com avancé" category="No-Code" date="06 Jan 2026" author="Jane Smith" status="Publié" statusColor="bg-green-100 text-green-800" />
                            <ArticleRow title="Les dangers du Deepfake" category="Éthique" date="05 Jan 2026" author="Mike Johnson" status="En relecture" statusColor="bg-yellow-100 text-yellow-800" />
                            <ArticleRow title="Introduction à n8n" category="Automatisation" date="04 Jan 2026" author="Emily Davis" status="Publié" statusColor="bg-green-100 text-green-800" />
                        </tbody>
                    </table>
                </div>
             </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, color, title, value }: { icon: string, color: string, title: string, value: string }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex items-start space-x-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
            </div>
        </div>
    );
}

function FeedbackCard({ type, date, content, author, initials, typeColor }: { type: string, date: string, content: string, author: string, initials: string, typeColor: string }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative">
            <div className="flex justify-between items-start mb-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${typeColor}`}>{type}</span>
                <span className="text-xs text-gray-400">{date}</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 italic">&quot;{content}&quot;</p>
            <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    {initials}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{author}</span>
            </div>
        </div>
    );
}

function ArticleRow({ title, category, date, author, status, statusColor }: { title: string, category: string, date: string, author: string, status: string, statusColor: string }) {
    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{title}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{category}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{date}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{author}</td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                    {status}
                </span>
            </td>
        </tr>
    );
}
