
"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Loader2, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { chat } from '@/app/actions';

type Message = {
    role: 'user' | 'model';
    content: string;
};

export const GenkitChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: "Bonjour ! Je suis l'assistant IA d'Oreegami. Posez-moi vos questions sur nos formations, l'IA ou le NoCode." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
             const { data: { session } } = await supabase.auth.getSession();
             setUser(session?.user ?? null);
        };
        getUser();
    }, [supabase]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
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
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // Prepare history for context (exclude last user message which is being sent)
            // Genkit expects history in a specific format if needed, but for now we just send the question
            // For a robust implementation, we should map local state to Genkit history format
            const history = messages.map(m => ({
                role: m.role,
                content: [{ text: m.content }]
            }));

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    question: userMessage,
                    history: history 
                }),
            });

            if (!res.ok) throw new Error('Failed to fetch response');

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'model', content: data.text }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', content: "Désolé, une erreur est survenue. Veuillez réessayer." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 w-[380px] h-[600px] max-h-[80vh] bg-zinc-50 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/50 backdrop-blur-sm"
                    >
                        {/* Header */}
                        <div className="p-5 bg-white/80 backdrop-blur-md border-b border-zinc-100 flex justify-between items-center sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-linear-to-br from-orange-500 to-rose-500 rounded-xl rotate-3 shadow-lg flex items-center justify-center transform hover:rotate-6 transition-transform">
                                    <MessageSquare size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-800 text-lg leading-tight">Chat Oree</h3>
                                    <p className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        En ligne
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-zinc-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                            {messages.map((msg, idx) => (
                                <div 
                                    key={idx} 
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div 
                                        className={`max-w-[85%] mx-2 p-5 text-sm leading-relaxed shadow-sm ${
                                            msg.role === 'user' 
                                                ? 'bg-linear-to-br from-orange-500 to-rose-600 text-white rounded-2xl rounded-tr-sm shadow-orange-500/20' 
                                                : 'bg-white text-zinc-700 rounded-2xl rounded-tl-sm shadow-md border border-zinc-50'
                                        }`}
                                    >
                                        {msg.content.split('\n').map((line, i) => (
                                            <p key={i} className="min-h-[1em] mb-2 last:mb-0 break-words">
                                                {line.split(/(\[[^\]]+\]\([^)]+\))/g).map((part, j) => {
                                                    // Check for Markdown link: [text](url) or [text](url "title")
                                                    const mdMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                                                    if (mdMatch) {
                                                        const [_, text, fullUrl] = mdMatch;
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

                        {/* Input */}

                        {/* Input */}
                        <div className="p-4 bg-white/50 backdrop-blur-sm">
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    // Manually call handleSubmit passing the event logic essentially
                                    // Or better yet, just inline the logic here as the user wants
                                    if (!input.trim() || isLoading) return;
                                    const userMessage = input.trim();
                                    setInput('');
                                    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
                                    setIsLoading(true);
                                    
                                    chat([...messages, { role: 'user', content: userMessage }]).then((response: any) => {
                                         setMessages(prev => [...prev, { role: 'model', content: response.text }]);
                                    }).catch((err) => {
                                         console.error(err);
                                         setMessages(prev => [...prev, { role: 'model', content: "Désolé, une erreur est survenue." }]);
                                    }).finally(() => setIsLoading(false));
                                }} 
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
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 bg-gradient-to-br from-orange-500 to-rose-600 text-white rounded-blob shadow-2xl flex items-center justify-center hover:shadow-orange-500/30 transition-all focus:outline-none"
                style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
            </motion.button>
        </div>
    );
};
