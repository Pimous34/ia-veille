'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/auth');
  };

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
          <Link href="/admin" className="nav-item active">
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/articles" className="nav-item">
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
        <div className="top-bar mt-40">
          <h1 className="page-title text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B9D] via-[#9C27B0] to-[#2196F3]">Tableau de Bord</h1>
        </div>

        <div className="welcome-banner">
          <h2 className="welcome-text">Bonjour Samuel,</h2>
          <p className="welcome-subtext">Voici ce qui se passe sur Oreegam&apos;ia aujourd&apos;hui.</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard icon="📝" title="Articles Total" value="869" trend="+12" />
          <StatCard icon="👁️" title="Vues ce mois" value="12.5k" trend="+5%" />
          <StatCard icon="👥" title="Apprenants" value="624" trend="+43" />
          <StatCard icon="⚠️" title="Retours" value="15" trend="-2" />
        </div>

        {/* User Feedback Section */}
        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">Retours Utilisateurs</h2>
          </div>
          <div className="feedback-grid">
            <FeedbackCard 
              type="Bug" 
              date="Il y a 2h" 
              content="Impossible de changer mon mot de passe, ça charge à l'infini..." 
              author="Thomas Dubois" 
              initials="TD"
              statusClass="bug"
            />
            <FeedbackCard 
              type="Suggestion" 
              date="Hier" 
              content="Ce serait super d'avoir un mode sombre pour lire les articles le soir !" 
              author="Marie Lefebvre" 
              initials="ML"
              statusClass="suggestion"
            />
            <FeedbackCard 
              type="Contenu" 
              date="05 Jan" 
              content="L'article sur Make.com est top, merci pour les détails !" 
              author="Julien Simon" 
              initials="JS"
              statusClass="content"
            />
          </div>
        </section>

        {/* Recent Content Section */}
        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">Derniers Articles</h2>
            <Link href="/admin/articles" className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold">
              Voir tout
            </Link>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Catégorie</th>
                  <th>Date</th>
                  <th>Auteur</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <ArticleRow title="L&apos;IA générative en 2024" category="IA" date="07 Jan 2026" author="Samuel Tessier" status="Publié" statusClass="published" />
                <ArticleRow title="Tutoriel Make.com avancé" category="No-Code" date="06 Jan 2026" author="Jane Smith" status="Publié" statusClass="published" />
                <ArticleRow title="Les dangers du Deepfake" category="Éthique" date="05 Jan 2026" author="Mike Johnson" status="En relecture" statusClass="review" />
                <ArticleRow title="Introduction à n8n" category="Automatisation" date="04 Jan 2026" author="Emily Davis" status="Publié" statusClass="published" />
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, title, value, trend }: { icon: string, title: string, value: string, trend: string }) {
    return (
        <div className="stat-card">
            <div className="stat-icon">{icon}</div>
            <div className="stat-info">
                <p className="stat-label">{title}</p>
                <p className="stat-value">{value}</p>
            </div>
            <div className={`stat-trend ${trend.startsWith('+') ? 'up' : 'down'}`}>
                {trend}
            </div>
        </div>
    );
}

function FeedbackCard({ type, date, content, author, initials, statusClass }: { type: string, date: string, content: string, author: string, initials: string, statusClass: string }) {
    return (
        <div className="feedback-card">
            <div className="feedback-header">
                <span className={`status-badge ${statusClass}`}>{type}</span>
                <span className="feedback-date">{date}</span>
            </div>
            <p className="feedback-content">&quot;{content}&quot;</p>
            <div className="feedback-author">
                <div className="author-avatar">{initials}</div>
                <span className="author-name">{author}</span>
            </div>
        </div>
    );
}

function ArticleRow({ title, category, date, author, status, statusClass }: { title: string, category: string, date: string, author: string, status: string, statusClass: string }) {
    return (
        <tr>
            <td>{title}</td>
            <td>{category}</td>
            <td>{date}</td>
            <td>{author}</td>
            <td>
                <span className={`status-badge ${statusClass}`}>
                    {status}
                </span>
            </td>
            <td>
                <div className="flex gap-2">
                    <button className="text-gray-400 hover:text-indigo-600" title="Modifier">✏️</button>
                    <button className="text-gray-400 hover:text-red-600" title="Supprimer">🗑️</button>
                </div>
            </td>
        </tr>
    );
}
