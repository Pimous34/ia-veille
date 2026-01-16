
import { GenkitChat } from '@/components/GenkitChat';

export default function EmbedPage({
  searchParams,
}: {
  searchParams: { tenantId?: string; primaryColor?: string };
}) {
  const tenantId = searchParams.tenantId || 'oreegami';
  
  // Pass tenantId to GenkitChat (Need to update GenkitChat to accept props!)
  // For now, usage of tenantId is server-side in API, but client needs to send it?
  // Actually, GenkitChat calls `chat` Server Action. The Server Action needs tenantId.
  // We need to update GenkitChat to accept `tenantId` prop and pass it to `chat` action.
  
  return (
    <div className="h-screen w-screen bg-transparent">
        <GenkitChat tenantId={tenantId} />
    </div>
  );
}
