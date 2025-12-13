
import ClientJT from './ClientJT';

export async function generateStaticParams() {
  return [{ slug: 'exemple' }];
}

export default function JTWatchPage() {
  return <ClientJT />;
}
