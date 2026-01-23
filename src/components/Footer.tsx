import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">IA Veille</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Votre source d&apos;information sur les dernières avancées en intelligence artificielle.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Navigation</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">Accueil</Link></li>
              <li><Link href="/articles" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">Articles</Link></li>
              <li><Link href="/categories" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">Catégories</Link></li>
              <li><Link href="/a-propos" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">À propos</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Catégories</h4>
            <ul className="space-y-2">
              <li><Link href="/categorie/machine-learning" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">Machine Learning</Link></li>
              <li><Link href="/categorie/llm" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">LLM</Link></li>
              <li><Link href="/categorie/computer-vision" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">Computer Vision</Link></li>
              <li><Link href="/categorie/ethique-ia" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">Éthique IA</Link></li>
            </ul>
          </div>



          <div className="flex flex-col items-start lg:items-end">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4 lg:text-right w-full">Contact</h4>
            <Link href="/contact" className="inline-block text-white font-semibold no-underline py-2 px-5 rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap" style={{ background: 'linear-gradient(135deg, #9C27B0 0%, #5E35B1 100%)', boxShadow: '0 4px 6px rgba(156, 39, 176, 0.3)' }}>
              Nous contacter
            </Link>
          </div>

        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            © {currentYear} IA Veille. Tous droits réservés.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="https://www.linkedin.com/school/oreegami-academy/posts/?feedView=all" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <span className="sr-only">LinkedIn</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
