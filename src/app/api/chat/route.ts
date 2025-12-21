
import { chatWithDocuments } from '@/genkit/chat';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const { question, history, tenantId, userData } = await req.json();
    console.log(`Chat Request - Tenant: ${tenantId}, HasAuth: ${!!authHeader}, UserData: ${JSON.stringify(userData)}`);

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Call the Genkit flow diretly
    const response = await chatWithDocuments({
      question,
      history: history || [],
      tenantId: tenantId || 'oreegami',
      userData: userData,
    });
    console.log('Chat response generated successfully');

    return NextResponse.json({ text: response });
  } catch (error: unknown) {
    console.error('Error in chat API:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
