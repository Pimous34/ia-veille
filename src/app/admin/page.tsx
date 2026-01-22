'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const router = useRouter();
  const [studentCount, setStudentCount] = React.useState<number | null>(null);
  const [articleCount, setArticleCount] = React.useState<number | null>(null);
  const [feedbackCount, setFeedbackCount] = React.useState<number | null>(null);
  const [viewCount, setViewCount] = React.useState<number | null>(null);
  const [feedbacks, setFeedbacks] = React.useState<any[]>([]);
  const [selectedFeedback, setSelectedFeedback] = React.useState<any>(null);
  const supabase = createClient();

  React.useEffect(() => {
    const fetchStats = async () => {
      console.log('Fetching stats...');

      try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [studentsRes, articlesRes, feedbacksCountRes, viewsRes, feedbacksRes] = await Promise.all([
          // 1. Student Count
          supabase
            .from('students')
            .select('*', { count: 'exact', head: true }),

          // 2. Article Count
          supabase
            .from('articles')
            .select('*', { count: 'exact', head: true }),

          // 3. Feedback Count
          supabase
            .from('feedback_students')
            .select('*', { count: 'exact', head: true }),

          // 4. Views Count (This Month)
          supabase
            .from('article_interactions')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', true)
            .gte('last_interacted_at', firstDayOfMonth),

          // 5. Feedbacks List
          supabase
            .from('feedback_students')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3)
        ]);

        // Process Students
        if (studentsRes.error) {
          console.error('Error fetching students:', studentsRes.error);
          setStudentCount(0);
        } else {
          console.log('Students count:', studentsRes.count);
          setStudentCount(studentsRes.count || 0);
        }

        // Process Articles
        if (articlesRes.error) {
          console.error('Error fetching articles:', articlesRes.error);
          setArticleCount(0);
        } else {
          console.log('Articles count:', articlesRes.count);
          setArticleCount(articlesRes.count || 0);
        }

        // Process Feedback Count
        if (feedbacksCountRes.error) {
          console.error('Error fetching feedback count:', feedbacksCountRes.error);
          setFeedbackCount(0);
        } else {
          setFeedbackCount(feedbacksCountRes.count || 0);
        }

        // Process View Count
        if (viewsRes.error) {
          console.error('Error fetching view count:', viewsRes.error);
          setViewCount(0);
        } else {
          setViewCount(viewsRes.count || 0);
        }

        // Process Feedbacks
        if (feedbacksRes.error) {
          console.error('Error fetching feedbacks:', feedbacksRes.error);
          setFeedbacks([]);
        } else {
          setFeedbacks(feedbacksRes.data || []);
        }

      } catch (err) {
        console.error('Global error in fetchStats', err);
      }
    };

    fetchStats();
  }, [supabase]);

  const handleLogout = () => {
    router.push('/auth');
  };

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
          <Link href="/admin" className="nav-item active">
            <span className="nav-icon">📊</span>
            <span>Tableau de bord</span>
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
        <div className="top-bar mt-24 mb-8 flex flex-col gap-1">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-indigo-500 w-fit">Tableau de Bord</h1>
          <p className="text-slate-500 dark:text-slate-400">Vue d'ensemble de l'activité et des performances.</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard icon="📝" title="Articles Total" value={articleCount !== null ? articleCount.toString() : "..."} trend="+12" />
          <StatCard icon="👁️" title="Vues ce mois" value={viewCount !== null ? viewCount.toLocaleString() : "..."} trend="+5%" />
          <StatCard icon="👥" title="Apprenants" value={studentCount !== null ? studentCount.toString() : "..."} trend="+43" />
          <StatCard icon="⚠️" title="Retours" value={feedbackCount !== null ? feedbackCount.toString() : "..."} trend="-2" />
        </div>

        {/* User Feedback Section */}
        <section className="content-section bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10">
          <div className="section-header">
            <h2 className="section-title">Retours Utilisateurs</h2>
          </div>
          <div className="feedback-grid">
            {feedbacks.length === 0 ? (
              <p className="text-gray-500 italic p-4">Aucun retour pour le moment.</p>
            ) : (
              feedbacks.map((fb) => (
                <FeedbackCard
                  key={fb.id}
                  type={serializeSubject(fb.subject)}
                  date={formatDate(fb.created_at)}
                  content={fb.message}
                  author={`${fb.first_name} ${fb.last_name}`}
                  initials={`${fb.first_name?.[0] || ''}${fb.last_name?.[0] || ''}`}
                  statusClass={getStatusClass(fb.subject)}
                  onClick={() => setSelectedFeedback(fb)}
                />
              ))
            )}
          </div>
        </section>

        {/* Feedback Reply Modal */}
        {selectedFeedback && (
          <FeedbackModal
            feedback={selectedFeedback}
            onClose={() => setSelectedFeedback(null)}
          />
        )}

        {/* Recent Content Section */}
        <section className="content-section bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10">
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
    <div className="stat-card bg-white dark:bg-slate-800 backdrop-blur-xl border border-gray-100 dark:border-white/10 p-6 rounded-[24px] shadow-sm hover:shadow-lg transition-all duration-300 group">
      <div className="stat-icon w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="stat-info">
        <p className="stat-label text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{title}</p>
        <p className="stat-value text-3xl font-black text-gray-900 dark:text-white">{value}</p>
      </div>
      <div className={`stat-trend ${trend.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20'} text-xs font-bold px-2 py-1 rounded-lg w-fit mt-3`}>
        {trend}
      </div>
    </div>
  );
}

function FeedbackCard({ type, date, content, author, initials, statusClass, onClick }: { type: string, date: string, content: string, author: string, initials: string, statusClass: string, onClick?: () => void }) {
  return (
    <div
      className="feedback-card bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 cursor-pointer hover:scale-[1.02] transition-transform duration-200 hover:shadow-md active:scale-95"
      onClick={onClick}
    >
      <div className="feedback-header">
        <span className={`status-badge ${statusClass}`}>{type}</span>
        <span className="feedback-date text-gray-500 dark:text-gray-400">{date}</span>
      </div>
      <p className="feedback-content line-clamp-3 text-gray-700 dark:text-gray-300">&quot;{content}&quot;</p>
      <div className="feedback-author">
        <div className="author-avatar">{initials}</div>
        <span className="author-name text-gray-900 dark:text-gray-200">{author}</span>
      </div>
    </div>
  );
}

function FeedbackModal({ feedback, onClose }: { feedback: any, onClose: () => void }) {
  const [reply, setReply] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const handleSend = async () => {
    if (!reply.trim()) {
      toast.error('Veuillez écrire une réponse avant d\'envoyer.');
      return;
    }
    setSending(true);

    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log(`Sending email to ${feedback.email}:`, reply);

    toast.success(`Réponse envoyée par mail à ${feedback.first_name} !`, {
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
      },
      iconTheme: { primary: '#fff', secondary: '#764ba2' }
    });

    setSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {feedback.first_name?.[0]}{feedback.last_name?.[0]}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {feedback.first_name} {feedback.last_name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{feedback.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusClass(feedback.subject) === 'bug' ? 'bg-red-100 text-red-600' : getStatusClass(feedback.subject) === 'suggestion' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                {serializeSubject(feedback.subject)}
              </span>
              <span className="text-sm text-slate-400">Reçu le {new Date(feedback.created_at).toLocaleDateString()}</span>
            </div>
            <h4 className="font-semibold text-lg mb-2 text-slate-800 dark:text-slate-200">{feedback.subject}</h4>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800">
              {feedback.message}
            </div>
          </div>

          {/* Reply Section */}
          <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl p-6 border border-indigo-100 dark:border-indigo-900/30">
            <h5 className="font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
              <span>✉️</span> Souhaitez-vous répondre à l'utilisateur ?
            </h5>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Écrivez votre réponse ici..."
              className="w-full min-h-[120px] p-4 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:bg-slate-800 dark:border-slate-700 transition-all resize-y text-sm mb-4"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSend}
                disabled={sending}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending ? 'Envoi...' : 'Envoyer la réponse'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArticleRow({ title, category, date, author, status, statusClass }: { title: string, category: string, date: string, author: string, status: string, statusClass: string }) {
  return (
    <tr>
      <td className="text-gray-900 dark:text-gray-200">{title}</td>
      <td className="text-gray-700 dark:text-gray-300">{category}</td>
      <td className="text-gray-600 dark:text-gray-400">{date}</td>
      <td className="text-gray-700 dark:text-gray-300">{author}</td>
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

function formatDate(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 24 hours
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours === 0) return 'À l\'instant';
    return `Il y a ${hours}h`;
  }
  // Yesterday
  if (diff < 48 * 60 * 60 * 1000 && date.getDate() !== now.getDate()) {
    return 'Hier';
  }

  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function serializeSubject(subject: string) {
  if (!subject) return 'Autre';
  if (subject.includes('technique')) return 'Bug';
  if (subject.includes('amélioration')) return 'Suggestion';
  if (subject.includes('contenu')) return 'Contenu';
  return 'Autre';
}

function getStatusClass(subject: string) {
  if (!subject) return 'other';
  if (subject.includes('technique')) return 'bug';
  if (subject.includes('amélioration')) return 'suggestion';
  if (subject.includes('contenu')) return 'content';
  return 'other';
}
