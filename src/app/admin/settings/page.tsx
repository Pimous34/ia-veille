'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User, Shield, Lock, Save, Plus, Trash2, Mail, Key, LogOut, CheckCircle, AlertTriangle, Layers, RefreshCw } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';

interface AdminUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
}

export default function AdminSettingsPage() {
    const router = useRouter();
    const [supabase] = useState(() => createClient());
    const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'data'>('profile');

    // Profile State
    const [user, setUser] = useState<any>(null);
    const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        firstName: '',
        lastName: '',
        email: ''
    });

    // Team State
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loadingTeam, setLoadingTeam] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminFirstName, setNewAdminFirstName] = useState('');
    const [newAdminLastName, setNewAdminLastName] = useState('');
    const [isAddingAdmin, setIsAddingAdmin] = useState(false);

    // Data Sync State
    const [syncing, setSyncing] = useState(false);
    const [lastSyncResult, setLastSyncResult] = useState<any>(null);

    // Initial Fetch
    useEffect(() => {
        const getUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.email) {
                setUser(user);
                setProfileForm({
                    firstName: user.user_metadata?.full_name?.split(' ')[0] || '',
                    lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                    email: user.email || ''
                });

                // Find matching admin to get ID
                const { data: adminData } = await supabase
                    .from('admins')
                    .select('id')
                    .eq('email', user.email)
                    .single();

                if (adminData) {
                    setCurrentAdminId(adminData.id);
                }
            }
        };
        getUserData();
        fetchAdmins();
    }, [supabase]);

    const fetchAdmins = async () => {
        setLoadingTeam(true);
        const { data, error } = await supabase
            .from('admins')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching admins:', error);
            toast.error("Erreur chargement équipe");
        } else {
            setAdmins(data || []);
        }
        setLoadingTeam(false);
    };

    // --- Actions ---

    const handleSyncIntervenants = async () => {
        setSyncing(true);
        const toastId = toast.loading("Synchronisation avec Airtable en cours...");

        try {
            const res = await fetch('/api/sync/intervenants', { method: 'POST' });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Erreur lors de la synchro');

            setLastSyncResult(data);
            toast.success(`Synchro terminée ! ${data.upserted} mis à jour, ${data.deleted} supprimés.`, { id: toastId });
        } catch (error: any) {
            console.error('Sync Error:', error);
            toast.error(`Erreur: ${error.message}`, { id: toastId });
        } finally {
            setSyncing(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingProfile(true);

        try {
            // 1. Update Supabase Auth
            const { error: authError } = await supabase.auth.updateUser({
                email: profileForm.email,
                data: {
                    full_name: `${profileForm.firstName} ${profileForm.lastName}`,
                    first_name: profileForm.firstName,
                    last_name: profileForm.lastName
                }
            });

            if (authError) throw authError;

            // 2. Update Admins Table (if we found the ID)
            if (currentAdminId) {
                const { error: dbError } = await supabase
                    .from('admins')
                    .update({
                        first_name: profileForm.firstName,
                        last_name: profileForm.lastName,
                        email: profileForm.email
                    })
                    .eq('id', currentAdminId);

                if (dbError) {
                    console.error("Error syncing admin table:", dbError);
                    // Don't throw, as auth update succeeded
                    toast.error("Profil mis à jour, mais erreur de synchro admin.");
                } else {
                    toast.success("Profil et Accès mis à jour !");
                    fetchAdmins(); // Refresh list
                }
            } else {
                toast.success("Profil mis à jour (Auth uniquement)");
            }

        } catch (error: any) {
            toast.error(`Erreur: ${error.message}`);
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleResetPassword = async () => {
        if (!profileForm.email) return;
        const { error } = await supabase.auth.resetPasswordForEmail(profileForm.email, {
            redirectTo: `${window.location.origin}/auth/update-password`,
        });
        if (error) toast.error("Erreur envoi mail");
        else toast.success("Email de réinitialisation envoyé !");
    };

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdminEmail || !newAdminFirstName || !newAdminLastName) {
            toast.error("Veuillez remplir tous les champs");
            return;
        }

        setIsAddingAdmin(true);
        try {
            // Generate a pseudo-Airtable ID to match existing pattern if needed, or just random string
            const newId = 'rec' + Math.random().toString(36).substr(2, 14);

            const { error } = await supabase
                .from('admins')
                .insert({
                    id: newId,
                    email: newAdminEmail.toLowerCase(),
                    first_name: newAdminFirstName,
                    last_name: newAdminLastName
                });

            if (error) throw error;

            toast.success("Administrateur ajouté !");
            setNewAdminEmail('');
            setNewAdminFirstName('');
            setNewAdminLastName('');
            fetchAdmins();
        } catch (error: any) {
            console.error(error);
            toast.error(`Erreur: ${error.message}`);
        } finally {
            setIsAddingAdmin(false);
        }
    };

    const handleDeleteAdmin = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir retirer les droits d'administration à cet utilisateur ?")) return;

        const { error } = await supabase.from('admins').delete().eq('id', id);
        if (error) toast.error("Erreur suppression");
        else {
            toast.success("Administrateur supprimé");
            setAdmins(prev => prev.filter(a => a.id !== id));
        }
    };

    return (
        <div className="flex min-h-screen bg-[#f8fafc]">
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
                    <Link href="/admin/settings" className="nav-item active">
                        <span className="nav-icon">⚙️</span>
                        <span>Paramètres</span>
                    </Link>
                </nav>

                <div className="user-profile">
                    <div className="avatar">A</div>
                    <div className="user-info">
                        <div className="user-name">Admin</div>
                        <div className="user-email">admin@oreegami.com</div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content px-8">
                <div className="top-bar mt-24 mb-12 flex justify-between items-end">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-indigo-500 w-fit">Paramètres</h1>
                        <p className="text-slate-500 dark:text-slate-400">Configuration de votre espace et gestion de l&apos;équipe.</p>
                    </div>
                    <button onClick={() => router.push('/auth')} className="logout-btn mb-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors font-bold uppercase tracking-wider">
                        Déconnexion
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 mb-8 border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`pb-4 px-2 font-bold text-sm transition-all relative ${activeTab === 'profile' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <span className="flex items-center gap-2">
                            <User size={18} /> Mon Profil
                        </span>
                        {activeTab === 'profile' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('team')}
                        className={`pb-4 px-2 font-bold text-sm transition-all relative ${activeTab === 'team' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <span className="flex items-center gap-2">
                            <Shield size={18} /> Gestion Équipe
                        </span>
                        {activeTab === 'team' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('data')}
                        className={`pb-4 px-2 font-bold text-sm transition-all relative ${activeTab === 'data' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <span className="flex items-center gap-2">
                            <Layers size={18} /> Données & Sync
                        </span>
                        {activeTab === 'data' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full" />}
                    </button>
                </div>

                <div className="max-w-4xl">
                    {activeTab === 'profile' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
                            {/* Main Profile Info */}
                            <div className="md:col-span-2 space-y-6">
                                <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                    <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                        <User className="text-indigo-500" size={20} />
                                        Informations Personnelles
                                    </h2>
                                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Prénom</label>
                                                <input
                                                    type="text"
                                                    value={profileForm.firstName}
                                                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                                                    className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl outline-none transition-all font-medium"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nom</label>
                                                <input
                                                    type="text"
                                                    value={profileForm.lastName}
                                                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                                                    className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl outline-none transition-all font-medium"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="email"
                                                    value={profileForm.email}
                                                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl outline-none transition-all font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={loadingProfile}
                                                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                                            >
                                                {loadingProfile ? 'Enregistrement...' : <> <Save size={18} /> Enregistrer </>}
                                            </button>
                                        </div>
                                    </form>
                                </section>

                                <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                    <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                        <Key className="text-orange-500" size={20} />
                                        Sécurité
                                    </h2>
                                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                        <div>
                                            <h3 className="font-bold text-orange-900">Mot de passe</h3>
                                            <p className="text-sm text-orange-700 mt-1">Vous recevrez un email pour définir un nouveau mot de passe.</p>
                                        </div>
                                        <button
                                            onClick={handleResetPassword}
                                            className="px-4 py-2 bg-white text-orange-600 font-bold rounded-lg text-sm shadow-sm hover:bg-orange-600 hover:text-white transition-all"
                                        >
                                            Modifier
                                        </button>
                                    </div>
                                </section>
                            </div>

                            {/* Sidebar Info */}
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
                                    <div className="relative z-10">
                                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl mb-4 border border-white/30">
                                            👋
                                        </div>
                                        <h3 className="text-xl font-black mb-2">Bonjour {profileForm.firstName} !</h3>
                                        <p className="text-indigo-100 text-sm leading-relaxed">
                                            Vous êtes connecté en tant qu&apos;administrateur principal. Vous avez tous les droits sur la plateforme.
                                        </p>
                                    </div>
                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div className="space-y-8 animate-fade-in">
                            {/* Add Admin Block */}
                            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <Plus className="text-indigo-500" size={20} />
                                    Ajouter un administrateur
                                </h2>
                                <form onSubmit={handleAddAdmin} className="flex gap-4 items-end">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Prénom</label>
                                        <input
                                            type="text"
                                            value={newAdminFirstName}
                                            onChange={(e) => setNewAdminFirstName(e.target.value)}
                                            placeholder="Ex: Thomas"
                                            className="w-full p-3 bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl outline-none"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nom</label>
                                        <input
                                            type="text"
                                            value={newAdminLastName}
                                            onChange={(e) => setNewAdminLastName(e.target.value)}
                                            placeholder="Ex: Anderson"
                                            className="w-full p-3 bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl outline-none"
                                        />
                                    </div>
                                    <div className="flex-[2] space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email professionnel</label>
                                        <input
                                            type="email"
                                            value={newAdminEmail}
                                            onChange={(e) => setNewAdminEmail(e.target.value)}
                                            placeholder="thomas@oreegami.com"
                                            className="w-full p-3 bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-xl outline-none"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isAddingAdmin}
                                        className="h-[50px] px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Plus size={20} />
                                        Ajouter
                                    </button>
                                </form>
                                <p className="mt-4 text-xs text-slate-400 flex items-center gap-1">
                                    <AlertTriangle size={12} />
                                    La personne devra se connecter avec Google ou créer un compte avec cet email pour accéder à l&apos;admin.
                                </p>
                            </section>

                            {/* Admin List */}
                            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                        <tr>
                                            <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Administrateur</th>
                                            <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Email</th>
                                            <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {admins.map((admin) => (
                                            <tr key={admin.id} className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="p-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                            {admin.first_name?.[0]}{admin.last_name?.[0]}
                                                        </div>
                                                        <div className="font-bold text-gray-900">
                                                            {admin.first_name} {admin.last_name}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-sm text-gray-500 font-medium font-mono">
                                                    {admin.email}
                                                </td>
                                                <td className="p-6 text-right">
                                                    <button
                                                        onClick={() => handleDeleteAdmin(admin.id)}
                                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Supprimer l'accès"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="space-y-8 animate-fade-in">
                            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <Layers className="text-indigo-500" size={20} />
                                    Sources de Données
                                </h2>

                                <div className="border border-indigo-100 bg-indigo-50/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-indigo-50 p-3 flex items-center justify-center">
                                            {/* Airtable Logo Simulation */}
                                            <div className="w-full h-full relative">
                                                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-yellow-400"></div>
                                                <div className="absolute inset-x-0 top-0 h-1/2 flex gap-1">
                                                    <div className="w-1/2 h-full bg-red-500"></div>
                                                    <div className="w-1/2 h-full bg-blue-500"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-gray-900">Airtable: Intervenants</h3>
                                            <p className="text-sm text-gray-500 mt-1 max-w-md">
                                                Synchronisez la table &quot;Intervenants&quot; de votre base Airtable vers Supabase.
                                                La clé unique de correspondance est l&apos;email.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSyncIntervenants}
                                        disabled={syncing}
                                        className="whitespace-nowrap flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                                        {syncing ? 'Synchro en cours...' : 'Synchroniser'}
                                    </button>
                                </div>

                                {lastSyncResult && (
                                    <div className="mt-6 p-4 rounded-xl bg-green-50 border border-green-100 text-sm">
                                        <h4 className="font-bold text-green-800 flex items-center gap-2 mb-2">
                                            <CheckCircle size={16} /> Résultat de la dernière synchro :
                                        </h4>
                                        <ul className="list-disc list-inside text-green-700 space-y-1 ml-1">
                                            <li>Lignes Airtable lues : <strong>{lastSyncResult.subtotal_airtable}</strong></li>
                                            <li>Intervenants valides (email) : <strong>{lastSyncResult.valid_records}</strong></li>
                                            <li>Mises à jour / Ajouts : <strong>{lastSyncResult.upserted}</strong></li>
                                            <li>Supressions (plus dans Airtable) : <strong>{lastSyncResult.deleted}</strong></li>
                                        </ul>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </div>
            </main >
        </div >
    );
}
