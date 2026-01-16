
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  return NextResponse.json({ 
      text: "Le chat IA est temporairement désactivé (Genkit supprimé)." 
  });
}
