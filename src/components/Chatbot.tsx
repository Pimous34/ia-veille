'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import './Chatbot.css';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

interface SiteData {
    articles: any[];
    videos: any[];
}

const WEBHOOK_URL = 'https://oreegami.app.n8n.cloud/webhook/chatbot';
const WELCOME_MESSAGE = "Bonjour ! Je suis Oree votre assistant IA. Comment puis-je vous aider aujourd'hui ?";

interface ChatbotProps {
    embedded?: boolean;
}

export default function Chatbot({ embedded = false }: ChatbotProps) {
    const [isOpen, setIsOpen] = useState(embedded);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [siteData, setSiteData] = useState<SiteData>({ articles: [], videos: [] });
    const [inputValue, setInputValue] = useState('');
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    // Initial load and welcome message
    useEffect(() => {
        // Add welcome message if empty
        if (messages.length === 0) {
            setMessages([{
                id: Date.now().toString(),
                text: WELCOME_MESSAGE,
                sender: 'bot',
                timestamp: new Date()
            }]);
        }

        loadSiteData();
    }, []);

    // Force open if embedded
    useEffect(() => {
        if (embedded) setIsOpen(true);
    }, [embedded]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, isOpen]);

    // Focus input when opened (only if not embedded to prevent scroll jump)
    useEffect(() => {
        if (isOpen && !embedded) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 300);
        }
    }, [isOpen, embedded]);

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    const loadSiteData = async () => {
        try {
            const [articlesResult, videosResult] = await Promise.all([
                supabase
                    .from('articles')
                    .select('id, title, excerpt, summary, resume_ia, category, tags, published_at, url')
                    .order('published_at', { ascending: false })
                    .limit(50),
                supabase
                    .from('videos_youtube')
                    .select('id_video, titre, nom_chaine, date_publication, lien')
                    .order('date_publication', { ascending: false })
                    .limit(30)
            ]);

            const newSiteData: SiteData = {
                articles: articlesResult.data || [],
                videos: videosResult.data || []
            };

            setSiteData(newSiteData);
            console.log('✅ Chatbot: Data loaded', { 
                articles: newSiteData.articles.length, 
                videos: newSiteData.videos.length 
            });

        } catch (err) {
            console.error('❌ Error loading site data for chatbot:', err);
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        
        if (!inputValue.trim() || isLoading) return;

        const userText = inputValue.trim();
        setInputValue('');

        // Add user message
        const userMsg: Message = {
            id: Date.now().toString(),
            text: userText,
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            console.log('📤 Envoi au webhook N8N:', userText);

            const contextData = {
                articles: siteData.articles.map(a => ({
                    id: a.id,
                    title: a.title,
                    summary: a.resume_ia || a.excerpt || a.summary,
                    category: a.category,
                    tags: a.tags,
                    url: `shortnews.html?article=${a.id}`
                })),
                videos: siteData.videos.map(v => ({
                    id: v.id_video,
                    title: v.titre,
                    channel: v.nom_chaine,
                    url: `shortnews.html?article=${v.id_video}`
                }))
            };

            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userText,
                    sessionId: `session-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    context: contextData
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('📦 Données reçues de N8N:', data);

            let botText = null;

             // Extract response from various possible formats
             if (data.response) botText = data.response;
             else if (data.message) botText = data.message;
             else if (data.output) botText = data.output;
             else if (data.text) botText = data.text;
             else if (data.data?.response) botText = data.data.response;
             else if (Array.isArray(data) && data.length > 0) {
                 botText = data[0].response || data[0].message || data[0].output || data[0].text;
             }
             else if (typeof data === 'string') botText = data;

             if (!botText) {
                 console.warn('⚠️ Format de réponse non reconnu', data);
                 botText = "Réponse reçue mais format non reconnu.";
             }

             const botMsg: Message = {
                 id: (Date.now() + 1).toString(),
                 text: botText,
                 sender: 'bot',
                 timestamp: new Date()
             };

             setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi:', error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: `Désolé, une erreur s'est produite: ${error instanceof Error ? error.message : 'Unknown error'}`,
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            {/* Bouton flottant - Hide if embedded */}
            {!embedded && (
                <button 
                    className="chatbot-button" 
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
                >
                    {!isOpen ? (
                        <img src="/chatbot-mascot.png" alt="Assistant" className="chatbot-mascot-image" />
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    )}
                </button>
            )}

            {/* Fenêtre de chat */}
            {isOpen && (
                <div className={`chatbot-window ${embedded ? 'chatbot-embedded' : ''}`}>
                    <div className="chatbot-header">
                        <div className="chatbot-header-content">
                            <div className="chatbot-avatar">
                                <img src="/chatbot-mascot.png" alt="Assistant" className="chatbot-avatar-image" />
                            </div>
                            <div>
                                <h3 className="chatbot-title">Votre Assistant OREE</h3>
                                <p className="chatbot-status">En ligne</p>
                            </div>
                        </div>
                        {!embedded && (
                            <button className="chatbot-close" onClick={() => setIsOpen(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        )}
                    </div>

                    <div className="chatbot-messages" ref={messagesContainerRef}>
                        {messages.map((msg) => (
                            <div key={msg.id} className={`chatbot-message ${msg.sender === 'user' ? 'chatbot-message-user' : 'chatbot-message-bot'}`}>
                                <div className="chatbot-message-content">
                                    <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                                </div>
                                <div className="chatbot-message-time">{formatTime(msg.timestamp)}</div>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="chatbot-message chatbot-message-bot">
                                <div className="chatbot-message-content">
                                    <div className="chatbot-typing">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                    </div>

                    <form className="chatbot-input-form" onSubmit={handleSend}>
                        <input 
                            ref={inputRef}
                            type="text" 
                            className="chatbot-input"
                            placeholder="Tapez votre message..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={isLoading}
                        />
                        <button type="submit" className="chatbot-send" disabled={isLoading || !inputValue.trim()}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
