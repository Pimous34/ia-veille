import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EspacePersonnelClient from '@/components/EspacePersonnelClient';

export default function ParametresPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow">
         <EspacePersonnelClient />
      </main>
      <Footer />
    </div>
  );
}
