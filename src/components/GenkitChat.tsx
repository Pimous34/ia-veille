
"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Loader2, Paperclip, Settings, Save, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';

type Message = {
    role: 'user' | 'model';
    content: string;
};

export const GenkitChat = ({ 
    tenantId = 'oreegami', 
    standalone = false 
}: { 
    tenantId?: string;
    standalone?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(standalone);
    const [mounted, setMounted] = useState(false);
    const [tenantConfig, setTenantConfig] = useState<{
        name?: string;
        systemGreeting?: string;
        primaryColor?: string;
        driveFolderId?: string;
    } | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<{
        id: string;
        email: string;
        profile: {
            age?: number;
            experience_level?: string;
            user_type?: string;
        } | null;
    } | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [configForm, setConfigForm] = useState({
        primaryColor: '',
        systemGreeting: '',
        driveFolderId: ''
    });
    const [isUploading, setIsLoadingUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    useEffect(() => {
        setMounted(true);
        
        // Fetch Tenant Config
        fetch(`/api/tenant-config?tenantId=${tenantId}`)
            .then(res => res.json())
            .then(data => {
                setTenantConfig(data);
                setConfigForm({
                    primaryColor: data.primaryColor || '#f97316',
                    systemGreeting: data.systemGreeting || "Bonjour ! Comment puis-je vous aider ?",
                    driveFolderId: data.driveFolderId || ''
                });
                if (messages.length === 0) {
                    setMessages([{ role: 'model', content: data.systemGreeting || "Bonjour ! Comment puis-je vous aider ?" }]);
                }
            })
            .catch(err => console.error("Config fetch error:", err));

        const getUser = async () => {
             const { data: { session } } = await supabase.auth.getSession();
              if (session?.user) {
                  const { data: profile } = await supabase
                      .from('profiles')
                      .select('age, experience_level, user_type')
                      .eq('id', session.user.id)
                      .single();
                  
                   setUser({ 
                       id: session.user.id,
                       email: session.user.email!,
                       profile: (profile as { age?: number; experience_level?: string; user_type?: string }) || null
                   });
              } else {
                 setUser(null);
             }
        };
        getUser();
    }, [supabase, tenantId, messages.length]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsLoadingUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userEmail', user.email);

        try {
            const res = await fetch('/api/upload-drive', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            
            if (data.success) {
                const linkFormat = `[Fichier: ${data.name}](${data.link})`;
                setInput(prev => prev ? `${prev}\n\n${linkFormat}` : linkFormat);
            } else {
                alert('Erreur: ' + data.error);
            }
        } catch (error) {
            console.error(error);
            alert('Erreur réseau.');
        } finally {
            setIsLoadingUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (mounted) scrollToBottom();
    }, [messages, isOpen, mounted]);

    const toggleChat = (state: boolean) => {
        setIsOpen(state);
        if (typeof window !== 'undefined' && window.parent) {
             window.parent.postMessage({ type: 'OREEGAMI_CHAT_RESIZE', isOpen: state }, '*');
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // Prepare history for context (exclude last user message which is being sent)
            const history = messages.map(m => ({
                role: m.role,
                content: [{ text: m.content }]
            }));

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    question: userMessage,
                    history: history,
                    tenantId: tenantId,
                    userData: user?.profile ? {
                        age: user.profile.age,
                        experience_level: user.profile.experience_level,
                        user_type: user.profile.user_type
                    } : undefined
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to fetch response');
            }

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'model', content: data.text }]);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Désolée, une erreur est survenue.';
            console.error('Chat Error:', error);
            setMessages(prev => [...prev, { role: 'model', content: `Désolé, une erreur est survenue : ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingConfig(true);
        try {
            const res = await fetch('/api/admin-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId,
                    config: configForm
                }),
            });
            if (res.ok) {
                setTenantConfig(prev => prev ? { ...prev, ...configForm } : null);
                setIsSettingsOpen(false);
            } else {
                const data = await res.json();
                alert('Erreur: ' + data.error);
            }
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la sauvegarde.');
        } finally {
            setIsSavingConfig(false);
        }
    };

    const handleSyncDrive = async () => {
        if (!configForm.driveFolderId) return;
        setIsSyncing(true);
        try {
            const res = await fetch('/api/ingest-drive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId,
                    driveFolderId: configForm.driveFolderId
                }),
            });
            const data = await res.json();
            if (data.success) {
                alert(`Synchronisation terminée : ${data.processedFiles} fichiers traités.`);
            } else {
                alert('Erreur: ' + data.error);
            }
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la synchronisation.');
        } finally {
            setIsSyncing(false);
        }
    };

    const isAdmin = user?.profile?.user_type === 'admin' || user?.profile?.user_type === 'teacher';

    if (!mounted) return null;

    return (
        <div className={standalone 
            ? "w-full h-full flex flex-col font-sans overflow-hidden bg-zinc-50" 
            : "fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans"
        }>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={standalone ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={standalone ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={standalone 
                            ? "w-full h-full flex flex-col overflow-hidden"
                            : "mb-4 w-[380px] h-[600px] max-h-[80vh] bg-zinc-50 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/50 backdrop-blur-sm"
                        }
                    >
                        {/* Header */}
                        <div className="p-5 bg-white/80 backdrop-blur-md border-b border-zinc-100 flex justify-between items-center sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-10 h-10 rounded-xl rotate-3 shadow-lg flex items-center justify-center transform hover:rotate-6 transition-transform"
                                    style={{ background: tenantConfig?.primaryColor || 'linear-gradient(to bottom right, #f97316, #e11d48)' }}
                                >
                                    <MessageSquare size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-800 text-lg leading-tight">
                                        {tenantConfig?.name || 'Chat Oree'}
                                    </h3>
                                    <p className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        En ligne
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {isAdmin && (
                                    <button 
                                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                        className={`p-2 rounded-full transition-colors ${isSettingsOpen ? 'bg-orange-100 text-orange-600' : 'hover:bg-zinc-100 text-zinc-400'}`}
                                        title="Paramètres Admin"
                                    >
                                        <Settings size={20} />
                                    </button>
                                )}
                                {!standalone && (
                                    <button 
                                        onClick={() => toggleChat(false)}
                                        className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-zinc-600"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content Area */}
                        {isSettingsOpen ? (
                            <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6 animate-in fade-in duration-200">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-zinc-800 flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
                                        Apparence
                                    </h4>
                                    
                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Couleur Primaire</label>
                                        <div className="flex gap-2">
                                            {['#f97316', '#e11d48', '#8b5cf6', '#0ea5e9', '#10b981', '#18181b'].map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => setConfigForm(prev => ({ ...prev, primaryColor: color }))}
                                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${configForm.primaryColor === color ? 'border-zinc-900 scale-110 shadow-md' : 'border-transparent'}`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                            <input 
                                                type="color" 
                                                value={configForm.primaryColor}
                                                onChange={(e) => setConfigForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                                                className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200 cursor-pointer overflow-hidden p-0"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Message de bienvenue</label>
                                        <textarea 
                                            value={configForm.systemGreeting}
                                            onChange={(e) => setConfigForm(prev => ({ ...prev, systemGreeting: e.target.value }))}
                                            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all h-24 resize-none text-zinc-700"
                                            placeholder="Bonjour ! Comment puis-je vous aider ?"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-zinc-800 flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                                        Source de données
                                    </h4>
                                    
                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider text-blue-600 flex justify-between items-center">
                                            Google Drive Folder ID
                                            <button 
                                                onClick={handleSyncDrive}
                                                disabled={isSyncing || !configForm.driveFolderId}
                                                className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                                            >
                                                {isSyncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                                Sync
                                            </button>
                                        </label>
                                        <input 
                                            type="text" 
                                            value={configForm.driveFolderId}
                                            onChange={(e) => setConfigForm(prev => ({ ...prev, driveFolderId: e.target.value }))}
                                            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-zinc-700"
                                            placeholder="Ex: 1f4zikRox4qnnT8IkC12..."
                                        />
                                        <p className="text-[10px] text-zinc-400 italic">L&apos;ID du dossier se trouve à la fin de l&apos;URL Google Drive.</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveConfig}
                                    disabled={isSavingConfig}
                                    className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-lg active:scale-[0.98]"
                                >
                                    {isSavingConfig ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    Sauvegarder les paramètres
                                </button>
                                
                                <button
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="w-full py-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
                                >
                                    Annuler
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                            {messages.map((msg, idx) => (
                                <div 
                                    key={idx} 
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div 
                                        className={`max-w-[85%] mx-2 p-5 text-sm leading-relaxed shadow-sm ${
                                            msg.role === 'user' 
                                                ? 'bg-gradient-to-br from-orange-500 to-rose-600 text-white rounded-2xl rounded-tr-sm shadow-orange-500/20' 
                                                : 'bg-white text-zinc-700 rounded-2xl rounded-tl-sm shadow-md border border-zinc-50'
                                        }`}
                                    >
                                        {msg.content.split('\n').map((line, i) => (
                                            <p key={i} className="min-h-[1em] mb-2 last:mb-0 wrap-break-word">
                                                {line.split(/(\[[^\]]+\]\([^)]+\))/g).map((part, j) => {
                                                    // Check for Markdown link: [text](url) or [text](url "title")
                                                    const mdMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                                                    if (mdMatch) {
                                                        const [fullMatch, text, fullUrl] = mdMatch;
                                                        console.log('Markdown link match:', fullMatch);
                                                        // Split by space to ignore legitimate markdown titles -> [text](url "title")
                                                        const url = fullUrl.trim().split(/\s+/)[0]; 
                                                        return (
                                                            <a 
                                                                key={j}
                                                                href={url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className={`underline font-medium decoration-1 underline-offset-2 ${
                                                                    msg.role === 'user' ? 'text-white/90 hover:text-white' : 'text-orange-600 hover:text-orange-700'
                                                                }`}
                                                            >
                                                                {text}
                                                            </a>
                                                        );
                                                    }

                                                    // Fallback: Check for raw URLs in the remaining text
                                                    return part.split(/(https?:\/\/[^\s]+)/g).map((subPart, k) => {
                                                        if (/(https?:\/\/[^\s]+)/g.test(subPart)) {
                                                            // Clean trailing punctuation that might be captured by [^\s]+
                                                            // e.g. "http://url]" -> "http://url"
                                                            const cleanUrl = subPart.trim().replace(/[\]).,;]+$/, '');
                                                            return (
                                                                <a 
                                                                    key={`${j}-${k}`}
                                                                    href={cleanUrl} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className={`underline font-medium decoration-1 underline-offset-2 ${
                                                                        msg.role === 'user' ? 'text-white/90 hover:text-white' : 'text-orange-600 hover:text-orange-700'
                                                                    }`}
                                                                >
                                                                    {subPart}
                                                                </a>
                                                            );
                                                        }
                                                        return subPart;
                                                    });
                                                })}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-md border border-zinc-50 flex items-center gap-3">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                        <span className="text-xs font-medium text-zinc-400">Analyse en cours...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        )}

                        {/* Input */}
                        {!isSettingsOpen && (
                            <div className="p-4 bg-white/50 backdrop-blur-sm">
                            <form 
                                onSubmit={handleSubmit} 
                                className="relative flex items-center gap-2 p-1.5 bg-white rounded-full shadow-lg border border-zinc-100 ring-1 ring-zinc-50"
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileUpload} 
                                    className="hidden" 
                                />
                                
                                {user && (
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className={`p-2 rounded-full transition-colors flex items-center justify-center ${
                                            isUploading 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : 'text-zinc-400 hover:text-orange-600 hover:bg-orange-50'
                                        }`}
                                        title="Ajouter un fichier"
                                    >
                                        {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Paperclip size={18} />}
                                    </button>
                                )}

                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={user ? "Posez votre question..." : "Connectez-vous pour plus..."}
                                    className="flex-1 pl-2 py-2.5 bg-transparent border-none focus:outline-none text-zinc-700 placeholder:text-zinc-400 text-sm"
                                    disabled={isLoading}
                                />
                                <button 
                                    type="submit" 
                                    disabled={!input.trim() || isLoading}
                                    className="p-2.5 bg-zinc-900 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-zinc-900 transition-all duration-300 shadow-md transform hover:scale-105 active:scale-95"
                                >
                                    <Send size={16} className={input.trim() ? "translate-x-0.5" : ""} />
                                </button>
                            </form>
                            {!user && (
                                <p className="text-[10px] text-center text-zinc-300 mt-2 font-medium">
                                    Connectez-vous pour envoyer des fichiers
                                </p>
                            )}
                            <div className="text-center mt-2">
                                <span className="text-[10px] text-zinc-300 font-medium">Oreegami Assistant Intelligence</span>
                            </div>
                        </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {!standalone && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleChat(!isOpen)}
                    className="w-16 h-16 bg-linear-to-br from-orange-500 to-rose-600 text-white rounded-blob shadow-2xl flex items-center justify-center hover:shadow-orange-500/30 transition-all focus:outline-none"
                    style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
                >
                    {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
                </motion.button>
            )}
        </div>
    );
};
