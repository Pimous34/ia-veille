'use client';

import React, { useState, useEffect } from 'react';
import { Check, MessageSquare, Bell, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Message {
  id: number;
  text: string;
  type: 'info' | 'alert' | 'success';
  link?: string;
}

export default function OreegamiMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [archivedMessages, setArchivedMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fadingIds, setFadingIds] = useState<number[]>([]);
  const [showArchives, setShowArchives] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        let promoId: string | null = null;

        if (user && user.email) {
            // 2. Find student profile to get promo_id
            const { data: studentData } = await supabase
                .from('students')
                .select('promo_id')
                .eq('email', user.email)
                .single();
            
            if (studentData) {
                promoId = studentData.promo_id;
            }
        }

        // 3. Fetch messages (Global OR Matching Promo)
        let query = supabase
          .from('app_messages')
          .select('*, user_message_actions(is_archived)')
          .eq('active', true)
          .order('id', { ascending: false });
        
        if (promoId) {
            // Logic: promo_id IS NULL or promo_id = user's promo_id
            query = query.or(`promo_id.is.null,promo_id.eq.${promoId}`);
        } else {
             // If no promo found (e.g. admin or guest), maybe just show global messages?
             // specific logic: show global only
             query = query.is('promo_id', null);
        }

        const { data: messagesData, error } = await query;

        if (error) {
             // Fallback if table doesn't exist or other error
            console.warn('Could not fetch messages from DB, using fallback.', error.message);
            setMessages([{id: 1, text: "Bienvenue sur Oreegami'IA !", type: 'info'}]);
            return;
        }

        const active: Message[] = [];
        const archived: Message[] = [];

        interface MessageResponse extends Message {
            user_message_actions?: { is_archived: boolean }[];
        }

        messagesData?.forEach((msg: MessageResponse) => {
          // If user has an action and it is archived, it goes to archived
          const isArchived = msg.user_message_actions && msg.user_message_actions.length > 0 && msg.user_message_actions[0].is_archived;
          
          const formattedMsg: Message = {
            id: msg.id,
            text: msg.text,
            type: msg.type,
            link: msg.link
          };

          if (isArchived) {
            archived.push(formattedMsg);
          } else {
            active.push(formattedMsg);
          }
        });

        setMessages(active);
        setArchivedMessages(archived);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([{id: 1, text: "Bienvenue sur Oreegami'IA !", type: 'info'}]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [supabase]);

  const handleDismiss = async (id: number) => {
    if (fadingIds.includes(id)) return;
    setFadingIds(prev => [...prev, id]);
    
    // Optimistic UI update
    setTimeout(() => {
      const msgToArchive = messages.find(m => m.id === id);
      if (msgToArchive) {
        setArchivedMessages(prev => [msgToArchive, ...prev].sort((a,b) => b.id - a.id));
        setMessages(prev => prev.filter(m => m.id !== id));
      }
      setFadingIds(prev => prev.filter(fid => fid !== id));
    }, 300);

    // Persist to DB
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('user_message_actions').upsert({
                user_id: user.id,
                message_id: id,
                is_archived: true
            });
        }
    } catch (err) {
        console.error("Failed to archive message", err);
    }
  };

  const handleRestore = async (id: number) => {
    if (fadingIds.includes(id)) return;
    setFadingIds(prev => [...prev, id]);

    // Optimistic UI Update
    setTimeout(() => {
        const msgToRestore = archivedMessages.find(m => m.id === id);
        if (msgToRestore) {
            setMessages(prev => [msgToRestore, ...prev].sort((a,b) => b.id - a.id));
            setArchivedMessages(prev => prev.filter(m => m.id !== id));
        }
        setFadingIds(prev => prev.filter(fid => fid !== id));
    }, 300);

    // Persist to DB
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Remove the archive record
            await supabase.from('user_message_actions').delete().match({ user_id: user.id, message_id: id });
        }
    } catch (err) {
        console.error("Failed to restore message", err);
    }
  };

  const displayedMessages = showArchives ? archivedMessages : messages;

  if (isLoading) {
      return (
        <div className="vignette-column flex flex-col h-full items-center justify-center">
            <Loader2 className="animate-spin text-pink-500" size={32} />
        </div>
      );
  }

  return (
    <div className="vignette-column flex flex-col h-full">
      <h3 
        className="vignette-title flex items-center gap-2 mb-4 cursor-pointer hover:opacity-80 transition-opacity select-none"
        onClick={() => setShowArchives(!showArchives)}
        title={showArchives ? "Retour aux messages" : "Voir les archives"}
      >
        <MessageSquare size={20} className={showArchives ? "text-gray-400" : "text-pink-500"} />
        <span className={`bg-linear-to-r ${showArchives ? 'from-gray-500 to-gray-600' : 'from-pink-500 to-purple-600'} bg-clip-text text-transparent font-bold`}>
            {showArchives ? "Archives" : "Oreegami Express"}
        </span>
        <span className={`ml-auto ${showArchives ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-600'} text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1`}>
            <Bell size={10} />
            {showArchives ? archivedMessages.length : messages.length}
        </span>
      </h3>
      
      <div className="vignettes-list flex-1 overflow-y-auto pr-2 space-y-3">
        {displayedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                <p>{showArchives ? "Aucune archive." : "Tout est lu !"}</p>
                {!showArchives && messages.length === 0 && (
                     <button 
                        onClick={(e) => { e.stopPropagation(); setShowArchives(true); }}
                        className="mt-2 text-xs text-blue-500 underline"
                     >
                        Voir les archives
                     </button>
                )}
            </div>
        ) : (
            displayedMessages.map((msg) => (
            <div 
                key={msg.id} 
                onClick={() => showArchives ? handleRestore(msg.id) : handleDismiss(msg.id)}
                className={`
                    group relative flex items-start gap-3 p-4 
                    bg-white rounded-xl border border-gray-100 shadow-sm 
                    ${showArchives 
                        ? 'opacity-70 hover:opacity-100 hover:border-gray-300 bg-gray-50' 
                        : 'hover:shadow-md hover:border-blue-100 hover:bg-blue-50/30'
                    }
                    cursor-pointer transition-all duration-300 ease-in-out
                    ${fadingIds.includes(msg.id) ? 'opacity-0 transform translate-x-10' : 'opacity-100 transform translate-x-0'}
                `}
            >
                {/* Checkbox circle / Restore icon */}
                <div className={`
                    shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 
                    flex items-center justify-center transition-all duration-200
                    ${showArchives 
                        ? 'border-gray-300 group-hover:border-blue-500 group-hover:bg-blue-500' 
                        : (msg.type === 'alert' ? 'border-orange-200' : 'border-gray-300') + ' group-hover:border-green-500 group-hover:bg-green-500'
                    }
                `}>
                    {showArchives ? (
                         <div className="text-white opacity-0 group-hover:opacity-100 font-bold text-xs">↩</div>
                    ) : (
                        <Check size={12} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" strokeWidth={3} />
                    )}
                </div>
                
                {/* Text */}
                <div className="flex-1">
                    <p className={`text-sm font-medium leading-snug ${showArchives ? 'text-gray-500 line-through' : 'text-gray-700 group-hover:text-gray-900'}`}>
                        {msg.text}
                    </p>
                    {msg.link && !showArchives && (
                        <a 
                            href={msg.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={(e) => e.stopPropagation()}
                            className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            🔗 En savoir plus
                        </a>
                    )}
                    {msg.type === 'alert' && !showArchives && (
                        <span className="inline-block mt-2 text-[10px] uppercase font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-sm ml-2">
                            Important
                        </span>
                    )}
                </div>

                {/* Hover effect hint */}
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400">
                    {showArchives ? 'Restaurer' : '✖'}
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
}
