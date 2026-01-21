import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EspacePersonnelClient from '@/components/EspacePersonnelClient';

export default function ParametresPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <Navbar />
      <main className="flex-grow">
        <EspacePersonnelClient />
      </main>
      <Footer />
    </div>
  );
}
