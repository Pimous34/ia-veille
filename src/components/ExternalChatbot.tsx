'use client';

import { useEffect } from 'react';

export default function ExternalChatbot() {
  useEffect(() => {
    // Éviter les injections multiples si le composant est re-rendu
    if (document.querySelector('script[src*="chatbot.js"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = "https://widgets-c0daf.web.app/chatbot.js?v=2";
    script.async = true;
    // On peut passer un ID spécifique si besoin via data-bot-id
    script.setAttribute('data-bot-id', 'ia_veille_bot'); 
    
    document.body.appendChild(script);

    return () => {
      // Nettoyage optionnel si on veut retirer le chatbot quand le composant est démonté
      // Mais généralement un chatbot persiste.
      // const element = document.getElementById('cb-widget-params');
      // if (element) element.remove();
    };
  }, []);

  return null; // Ce composant ne fait qu'injecter le script
}
