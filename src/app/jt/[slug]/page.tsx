import ClientJT from './ClientJT';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return [{ slug: 'exemple' }];
}

export default function JTWatchPage() {
  return <ClientJT />;
}
