"use client";

import { useSearchParams } from 'next/navigation';
import { GenkitChat } from '@/components/GenkitChat';
import { Suspense } from 'react';

function ChatEmbedContent() {
    const searchParams = useSearchParams();
    const tenantId = searchParams.get('tenant') || 'oreegami';
    const adminMode = searchParams.get('admin') === '1';

    return (
        <main className="w-screen h-screen overflow-hidden">
            <GenkitChat tenantId={tenantId} standalone={true} adminMode={adminMode} />
        </main>
    );
}

export default function ChatEmbedPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center w-screen h-screen bg-zinc-50 font-sans text-zinc-400">Chargement de l&apos;assistant...</div>}>
            <ChatEmbedContent />
        </Suspense>
    );
}
