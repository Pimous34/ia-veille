
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  return NextResponse.json({ 
      success: false, 
      message: "Genkit ingestion is disabled."
  });
}
