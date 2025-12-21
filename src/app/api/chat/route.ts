
import { chatWithDocuments } from '@/genkit/chat';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { question, history } = await req.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Call the Genkit flow diretly
    const response = await chatWithDocuments({
      question,
      history: history || [],
    });

    return NextResponse.json({ text: response });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
