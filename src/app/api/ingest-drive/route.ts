
import { ingestDocuments } from '@/genkit/ingest';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profile?.user_type !== 'admin' && profile?.user_type !== 'teacher') {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { tenantId, driveFolderId } = await req.json();

    if (!tenantId || !driveFolderId) {
      return NextResponse.json({ error: 'Missing tenantId or driveFolderId' }, { status: 400 });
    }

    console.log(`Starting manual ingestion for tenant: ${tenantId}, folder: ${driveFolderId}`);
    
    // Call the Genkit flow
    const result = await ingestDocuments({
      driveFolderId,
      tenantId,
    });

    return NextResponse.json({ 
        success: true, 
        processedFiles: result.processedFiles,
        errors: result.errors 
    });
  } catch (error: unknown) {
    console.error('Error in ingest-drive API:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
