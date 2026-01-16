'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const FlashcardsClient = dynamic(() => import('@/components/FlashcardsClient'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  )
});

export default FlashcardsClient;
