'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { X, Search, UserPlus, Trash2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

import { toast } from 'react-hot-toast';

interface Promo {
  id: string;
  name: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  promo_id: string;
  status: string;
  created_at: string;
  promos?: Promo;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { supabase, user } = useAuth(); // Use shared client
  // const [supabase] = useState(() => createClient()); // Removed local client creation
  const [students, setStudents] = useState<Student[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedPromoId, setSelectedPromoId] = useState<string>('');

  // Modals State
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [singleUserForm, setSingleUserForm] = useState({ firstName: '', lastName: '', email: '' });

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch promos first
      const { data: promoData, error: promoError } = await supabase.from('promos').select('id, name');

      if (promoError) throw promoError;

      setPromos(promoData || []);
      if (promoData && promoData.length > 0) setSelectedPromoId(promoData[0].id);

      // Fetch students with promo info
      const { data, error } = await supabase
        .from('students')
        .select('*, promos(id, name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (user?.id) {
      // console.log("User authenticated, fetching admin data...", user.id);
      fetchData();
    }
  }, [fetchData, user?.id]);

  const handleDeleteUser = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet apprenant ?')) {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) {
        toast.error("Erreur lors de la suppression");
      } else {
        setStudents(students.filter(s => s.id !== id));
        toast.success("Apprenant supprimé");
      }
    }
  };

  const handleImport = async () => {
    console.log("Handle import clicked");
    if (!importText.trim()) {
      toast.error("Veuillez entrer des données à importer.");
      return;
    }

    const toastId = toast.loading("Analyse des données...");

    try {
      const lines = importText.split('\n');
      const newStudentsData: { first_name: string; last_name: string; email: string; promo_id: string | null; status: string }[] = [];
      let addedCount = 0;
      let skippedCount = 0;

      console.log("Starting import processing...", lines.length, "lines");

      lines.forEach((line, index) => {
        // Handle common CSV separators (comma, semicolon, tab) by replacing them with spaces
        const normalizedLine = line.replace(/[,;\t]/g, ' ').replace(/\s+/g, ' ').trim();
        if (!normalizedLine) return;

        const parts = normalizedLine.split(' ');

        if (parts.length >= 2) {
          const email = parts.pop() || '';
          const lastName = parts.length > 0 ? parts.pop() || '' : '';
          const firstName = parts.join(' ') || '';

          if (!email.includes('@')) {
            console.warn(`Line ${index + 1}: Invalid email "${email}"`);
            skippedCount++;
            return;
          }

          newStudentsData.push({
            first_name: firstName || 'Inconnu',
            last_name: lastName || firstName,
            email: email.toLowerCase(),
            promo_id: selectedPromoId || null,
            status: 'active'
          });
          addedCount++;
        } else {
          skippedCount++;
        }
      });

      console.log(`Parsed: ${addedCount} valid, ${skippedCount} skipped`);

      if (addedCount > 0) {
        toast.loading(`Import de ${addedCount} utilisateurs...`, { id: toastId });

        const { error } = await supabase
          .from('students')
          .insert(newStudentsData);

        if (error) {
          console.error('Import error details:', error);
          toast.error(`Erreur Supabase: ${error.message}`, { id: toastId });
        } else {
          const successMsg = skippedCount > 0
            ? `${addedCount} ajouté(s), ${skippedCount} ignoré(s).`
            : `${addedCount} utilisateur(s) ajouté(s) avec succès !`;

          setSuccessMessage(successMsg);
          setShowSuccessModal(true);
          setImportText('');
          setIsModalOpen(false);

          fetchData();
          toast.dismiss(toastId);
        }
      } else {
        toast.error('Aucun utilisateur valide trouvé. Format: Prénom Nom Email', { id: toastId });
      }
    } catch (err: any) {
      console.error("Unexpected error in handleImport:", err);
      toast.error(`Erreur inattendue: ${err.message || err}`, { id: toastId });
    }
  };

  const handleAddSingleUser = async () => {
    if (!singleUserForm.firstName || !singleUserForm.lastName || !singleUserForm.email) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    if (!singleUserForm.email.includes('@')) {
      toast.error("Adresse email invalide.");
      return;
    }

    const { error } = await supabase
      .from('students')
      .insert({
        first_name: singleUserForm.firstName,
        last_name: singleUserForm.lastName,
        email: singleUserForm.email,
        promo_id: selectedPromoId || null,
        status: 'active'
      });

    if (error) {
      toast.error(`Erreur : ${error.message}`);
    } else {
      setSuccessMessage('1 utilisateur ajouté avec succès !\n\nUn mail d\'accès à Oreegam\'IA a été envoyé à son adresse.');
      setShowSuccessModal(true);
      setIsSingleModalOpen(false);
      setSingleUserForm({ firstName: '', lastName: '', email: '' });
      fetchData();
    }
  };

  const filteredStudents = students.filter(student =>
    `${student.first_name} ${student.last_name} ${student.email}`.toLowerCase().includes(searchQuery.toLowerCase())
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
          <Link href="/admin/articles" className="nav-item">
            <span className="nav-icon">📰</span>
            <span>Articles</span>
          </Link>
          <Link href="/admin/users" className="nav-item active">
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
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-indigo-500 w-fit">Gestion des Accès</h1>
            <p className="text-slate-500 dark:text-slate-400">Gérez les autorisations pour vos {students.length} membres (Apprenants & Formateurs).</p>
          </div>
          <button onClick={() => router.push('/auth')} className="logout-btn mb-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors font-bold uppercase tracking-wider">
            Déconnexion
          </button>
        </div>

        {/* Filters & Actions */}
        <section className="content-section">
          <div className="section-header">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher un membre..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsSingleModalOpen(true)}
                className="flex items-center gap-2 bg-white text-indigo-600 border-2 border-indigo-100 px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-50 hover:border-indigo-200 transition-all"
              >
                <UserPlus size={18} />
                <span>Ajouter un utilisateur</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
              >
                <Users size={18} />
                <span>Ajouter en masse</span>
              </button>
            </div>
          </div>

          <div className="table-container bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-[24px] overflow-hidden shadow-xl p-6">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Prénom</th>
                  <th>Nom</th>
                  <th>Courriel</th>
                  <th>Promotion</th>
                  <th>Statut</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-gray-500 font-medium">Chargement des apprenants...</span>
                        <button
                          onClick={() => window.location.reload()}
                          className="mt-4 text-xs text-indigo-500 underline hover:text-indigo-700"
                        >
                          Cela prend du temps ? Recharger la page
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {student.first_name.charAt(0)}
                        </div>
                        {student.first_name}
                      </div>
                    </td>
                    <td>{student.last_name}</td>
                    <td className="text-gray-500">{student.email}</td>
                    <td>
                      <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-bold border border-yellow-100">
                        {student.promos?.name || 'Sans promo'}
                      </span>
                    </td>
                    <td>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold ${student.status === 'active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {student.status === 'active' ? 'Actif' : student.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleDeleteUser(student.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      Aucun apprenant trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Import Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Import de masse</h3>
                <p className="text-sm text-gray-500 mt-1">Ajoutez plusieurs utilisateurs en une seule fois.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Choisir la Promotion</label>
                <select
                  value={selectedPromoId}
                  onChange={(e) => setSelectedPromoId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="">-- Sans promotion --</option>
                  {promos.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <p className="text-sm text-gray-600 mb-4 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                Format attendu : <strong className="text-indigo-600">Prénom Nom Email</strong> (un apprenant par ligne).
              </p>
              <textarea
                className="w-full h-48 p-4 rounded-2xl border border-gray-200 outline-none focus:border-indigo-500 resize-none font-mono text-sm leading-relaxed"
                placeholder="Thomas Dubois thomas.dubois@edu-oreegami.com&#10;Marie Lefebvre marie.lefebvre@edu-oreegami.com"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-white transition-all capitalize"
              >
                Annuler
              </button>
              <button
                onClick={handleImport}
                className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-sm"
              >
                Démarrer l&apos;import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Single User Modal */}
      {isSingleModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsSingleModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Nouvel Utilisateur</h3>
                <p className="text-sm text-gray-500 mt-1">Ajouter un seul membre à la fois.</p>
              </div>
              <button onClick={() => setIsSingleModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Prénom</label>
                <input
                  type="text"
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 transition-colors"
                  value={singleUserForm.firstName}
                  onChange={(e) => setSingleUserForm({ ...singleUserForm, firstName: e.target.value })}
                  placeholder="Ex: Thomas"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nom</label>
                <input
                  type="text"
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 transition-colors"
                  value={singleUserForm.lastName}
                  onChange={(e) => setSingleUserForm({ ...singleUserForm, lastName: e.target.value })}
                  placeholder="Ex: Dubois"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 transition-colors"
                  value={singleUserForm.email}
                  onChange={(e) => setSingleUserForm({ ...singleUserForm, email: e.target.value })}
                  placeholder="Ex: thomas.dubois@edu-oreegami.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Promotion</label>
                <select
                  value={selectedPromoId}
                  onChange={(e) => setSelectedPromoId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="">-- Sans promotion --</option>
                  {promos.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsSingleModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-white transition-all capitalize"
              >
                Annuler
              </button>
              <button
                onClick={handleAddSingleUser}
                className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-sm"
              >
                Ajouter ce membre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-bounce-in text-center p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-xl font-black text-gray-900 mb-2">Import réussi !</h3>
            <p className="text-gray-600 mb-6 font-medium">
              {successMessage}
            </p>
            <p className="text-indigo-600 text-sm bg-indigo-50 p-3 rounded-xl border border-indigo-100 mb-8">
              📧 Un mail d&apos;accès à Oreegam&apos;IA a été envoyé à leur adresse.
            </p>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 uppercase tracking-wide"
            >
              OK, c&apos;est noté
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
