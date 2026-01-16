'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Send, Save, Settings, Users, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

interface Promo {
  id: string;
  name: string;
  tuto_config: { sources: string[] };
  video_config: { tags: string[] };
}

export default function TeacherPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  // Data
  const [promos, setPromos] = useState<Promo[]>([]);
  const [selectedPromoId, setSelectedPromoId] = useState<string>('');
  
  // Message Form State
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'alert' | 'success'>('info');
  const [messageLink, setMessageLink] = useState('');
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Config Form State
  const [tutoSources, setTutoSources] = useState('');
  const [videoTags, setVideoTags] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [configStatus, setConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load Initial Data
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setLoading(false);
        return; // Redirect logic could go here
      }

      // Fetch Promos
      const { data: promosData } = await supabase
        .from('promos')
        .select('*')
        .order('name');
      
      if (promosData) {
        setPromos(promosData);
        if (promosData.length > 0) {
            setSelectedPromoId(promosData[0].id);
        }
      }
      
      setLoading(false);
    };
    init();
  }, [supabase]);

  // Load Promo Config when selection changes
  useEffect(() => {
    if (!selectedPromoId) return;
    const promo = promos.find(p => p.id === selectedPromoId);
    if (promo) {
        // Parse config or default
        const sources = promo.tuto_config?.sources || [];
        setTutoSources(sources.join(', '));

        const tags = promo.video_config?.tags || [];
        setVideoTags(tags.join(', '));
    }
  }, [selectedPromoId, promos]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedPromoId) return;
    
    setSending(true);
    setSendStatus('idle');

    try {
        const { error } = await supabase
            .from('app_messages')
            .insert({
                text: messageText,
                type: messageType,
                link: messageLink || null, // Handle empty string
                active: true,
                promo_id: selectedPromoId
            });

        if (error) throw error;

        setSendStatus('success');
        setMessageText('');
        setMessageLink('');
        // Reset status after 3s
        setTimeout(() => setSendStatus('idle'), 3000);

    } catch (err) {
        console.error("Error sending message:", err);
        setSendStatus('error');
    } finally {
        setSending(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPromoId) return;

    setSavingConfig(true);
    setConfigStatus('idle');

    try {
        // Parse CSV
        const sourcesArray = tutoSources.split(',').map(s => s.trim()).filter(Boolean);
        const tagsArray = videoTags.split(',').map(s => s.trim()).filter(Boolean);

        const { error } = await supabase
            .from('promos')
            .update({
                tuto_config: { sources: sourcesArray },
                video_config: { tags: tagsArray }
            })
            .eq('id', selectedPromoId);

        if (error) throw error;

        // Update local state
        setPromos(prev => prev.map(p => 
            p.id === selectedPromoId 
            ? { ...p, tuto_config: { sources: sourcesArray }, video_config: { tags: tagsArray } }
            : p
        ));

        setConfigStatus('success');
        setTimeout(() => setConfigStatus('idle'), 3000);

    } catch (err) {
        console.error("Error saving config:", err);
        setConfigStatus('error');
    } finally {
        setSavingConfig(false);
    }
  };


  if (loading) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>;
  }

  if (!user) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Accès Restreint</h1>
            <p className="mb-6 text-gray-600">Vous devez être connecté pour accéder à l&apos;espace formateur.</p>
            <Link href="/" className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
                Retour à l&apos;accueil
            </Link>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link href="/" className="p-2 -ml-2 text-gray-500 hover:text-blue-600 transition hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Espace Formateur
                    </span>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-200">BETA</span>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="text-sm text-right hidden sm:block">
                    <div className="font-semibold text-gray-900">{user.email}</div>
                    <div className="text-gray-500 text-xs">Formateur</div>
                </div>
                <div className="h-8 w-8 bg-linear-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
            </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Promo Selector */}
        <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users size={24} />
            </div>
            <div className="flex-1 w-full">
                <label className="block text-sm font-bold text-gray-700 mb-1">Sélectionner une promotion</label>
                <div className="relative">
                    <select 
                        id="promo-select"
                        name="promoId"
                        value={selectedPromoId}
                        onChange={(e) => setSelectedPromoId(e.target.value)}
                        className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-lg rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 pr-10 font-semibold"
                    >
                        {promos.length === 0 && <option value="">Aucune promo disponible</option>}
                        {promos.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            </div>
            <div className="hidden sm:block text-sm text-gray-500 max-w-xs">
                Sélectionnez la promo pour laquelle vous souhaitez envoyer un message ou configurer les sources.
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Col: Send Message */}
            <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-linear-to-br from-gray-50 to-white">
                        <div className="flex items-center gap-3 mb-1">
                            <Send className="text-blue-600" size={20} />
                            <h2 className="text-xl font-bold text-gray-800">Envoyer un message</h2>
                        </div>
                        <p className="text-sm text-gray-500">Ce message apparaîtra dans l&apos;espace &quot;Oreegami Express&quot; des étudiants de la promo sélectionnée.</p>
                    </div>
                    
                    <form onSubmit={handleSendMessage} className="p-6 space-y-5">
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Type de message</label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMessageType('info')}
                                    className={`flex-1 py-2 px-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${messageType === 'info' ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold shadow-sm' : 'border-gray-100 text-gray-500 hover:border-gray-300'}`}
                                >
                                    <Info size={16} /> Info
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMessageType('success')}
                                    className={`flex-1 py-2 px-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${messageType === 'success' ? 'border-green-500 bg-green-50 text-green-700 font-bold shadow-sm' : 'border-gray-100 text-gray-500 hover:border-gray-300'}`}
                                >
                                    <CheckCircle size={16} /> Succès
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMessageType('alert')}
                                    className={`flex-1 py-2 px-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${messageType === 'alert' ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold shadow-sm' : 'border-gray-100 text-gray-500 hover:border-gray-300'}`}
                                >
                                    <AlertTriangle size={16} /> Alert
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                            <textarea
                                id="message-text"
                                name="message"
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Votre message..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Lien (optionnel)</label>
                            <input
                                id="message-link"
                                name="link"
                                type="url"
                                value={messageLink}
                                onChange={(e) => setMessageLink(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://..."
                            />
                        </div>

                        <div className="pt-2">
                             <button 
                                type="submit" 
                                disabled={sending || !selectedPromoId}
                                className={`w-full py-3 px-6 rounded-xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 
                                    ${sending ? 'bg-gray-400 cursor-not-allowed' : 'bg-linear-to-r from-blue-600 to-indigo-600 hover:shadow-xl'}`}
                             >
                                {sending ? <span className="animate-pulse">Envoi...</span> : <><Send size={20} /> Envoyer le message</>}
                             </button>
                             
                             {sendStatus === 'success' && (
                                 <div className="mt-3 p-3 bg-green-100 text-green-700 rounded-lg text-center text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
                                     Message envoyé avec succès !
                                 </div>
                             )}
                             {sendStatus === 'error' && (
                                 <div className="mt-3 p-3 bg-red-100 text-red-700 rounded-lg text-center text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
                                     Erreur lors de l&apos;envoi.
                                 </div>
                             )}
                        </div>

                    </form>
                </div>
            </div>

            {/* Right Col: Configuration */}
            <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-linear-to-br from-gray-50 to-white">
                        <div className="flex items-center gap-3 mb-1">
                            <Settings className="text-purple-600" size={20} />
                            <h2 className="text-xl font-bold text-gray-800">Configuration du flux</h2>
                        </div>
                        <p className="text-sm text-gray-500">Personnalisez les sources des contenus affichés pour la promo <strong>{promos.find(p => p.id === selectedPromoId)?.name}</strong>.</p>
                    </div>

                    <form onSubmit={handleSaveConfig} className="p-6 space-y-6">
                        
                        {/* Tutos Config */}
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                             <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                                🚀 Sources des Tutos
                             </h3>
                             <p className="text-xs text-purple-700 mb-3">
                                Liste des chaînes YouTube ou mots-clés pour filtrer les tutoriels. Séparez par des virgules.
                             </p>
                             <textarea
                                id="tuto-sources"
                                name="tutoSources"
                                value={tutoSources}
                                onChange={(e) => setTutoSources(e.target.value)}
                                className="w-full h-24 p-3 bg-white border border-purple-200 rounded-lg text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                placeholder="Ex: Micode, Grafikart, React, ..."
                             />
                        </div>

                        {/* Videos Config */}
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                             <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                📺 Sources des Vidéos
                             </h3>
                             <p className="text-xs text-indigo-700 mb-3">
                                Tags ou catégories pour filtrer les vidéos/JTs affichés. Séparez par des virgules.
                             </p>
                             <textarea
                                id="video-tags"
                                name="videoTags"
                                value={videoTags}
                                onChange={(e) => setVideoTags(e.target.value)}
                                className="w-full h-24 p-3 bg-white border border-indigo-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                placeholder="Ex: IA, Veille, Tech News, ..."
                             />
                        </div>

                        <div className="pt-2">
                             <button 
                                type="submit" 
                                disabled={savingConfig || !selectedPromoId}
                                className={`w-full py-3 px-6 rounded-xl text-white font-bold text-lg shadow-md flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 
                                    ${savingConfig ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-900 hover:shadow-lg'}`}
                             >
                                {savingConfig ? <span className="animate-pulse">Enregistrement...</span> : <><Save size={20} /> Enregistrer la configuration</>}
                             </button>

                             {configStatus === 'success' && (
                                 <div className="mt-3 p-3 bg-green-100 text-green-700 rounded-lg text-center text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
                                     Configuration sauvegardée !
                                 </div>
                             )}
                             {configStatus === 'error' && (
                                 <div className="mt-3 p-3 bg-red-100 text-red-700 rounded-lg text-center text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
                                     Erreur lors de la sauvegarde.
                                 </div>
                             )}
                        </div>

                    </form>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
}
