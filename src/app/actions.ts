'use server';

import { chatWithDocuments } from '@/genkit/chat';

export async function chat(history: any[], tenantId: string = 'oreegami') {
  const lastMessage = history[history.length - 1];
  const question = lastMessage.content;
  const historyWithoutLast = history.slice(0, -1).map(h => ({
    role: h.role, 
    content: [{ text: h.content }]
  }));

  try {
    const result = await chatWithDocuments({
      question,
      history: historyWithoutLast,
      tenantId
    });
    return { text: result };
  } catch (error) {
    console.error('Error in chat action:', error);
    throw error;
  }
}
