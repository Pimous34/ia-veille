"use client";

import { useEffect } from 'react';

export const N8nChat = () => {
    useEffect(() => {
        // Determine n8n host (assume running on same machine on port 5678)
        const n8nHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5678'
            : `http://${window.location.hostname}:5678`;

        const webhookUrl = `${n8nHost}/webhook/86a50552-8058-4896-bd7e-ab95eba073ce/chat`;

        // Load the n8n chat styles
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css';
        document.head.appendChild(link);

        // Load the n8n chat script
        const script = document.createElement('script');
        script.type = 'module';
        script.innerHTML = `
            import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';
            
            createChat({
                webhookUrl: '${webhookUrl}',
                webhookConfig: {
                    title: 'Assistant Oreegami',
                    welcomeMessage: 'Bonjour ! Je suis l\\'assistant virtuel d\\'Oreegami. Comment puis-je vous aider aujourd\\'hui ?',
                    initialMessages: [
                        'Que peux-tu faire pour moi ?',
                        'Parle-moi des dernières news IA'
                    ]
                },
            });
        `;
        document.body.appendChild(script);

        return () => {
            // Cleanup if necessary (though rarely needed for global chat widgets)
            document.body.removeChild(script);
        };
    }, []);

    return <div id="n8n-chat"></div>;
};
