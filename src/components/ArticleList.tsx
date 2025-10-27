import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
}

// Données factices pour les articles (à remplacer par une vraie source de données)
const articles = [
  {
    id: 1,
    title: 'Les dernières avancées en matière de modèles de langage',
    excerpt: 'Une analyse approfondie des modèles de langage de nouvelle génération et de leur impact sur le traitement du langage naturel.',
    category: 'LLM',
    date: '2025-10-25',
    readTime: '5 min',
    image: '/placeholder-article-1.jpg'
  },
  {
    id: 2,
    title: 'L\'éthique de l\'IA : Enjeux et perspectives',
    excerpt: 'Exploration des défis éthiques posés par le développement rapide des systèmes d\'intelligence artificielle.',
    category: 'Éthique IA',
    date: '2025-10-20',
    readTime: '4 min',
    image: '/placeholder-article-2.jpg'
  },
  {
    id: 3,
    title: 'Computer Vision : Les innovations récentes',
    excerpt: 'Tour d\'horizon des dernières avancées en vision par ordinateur et de leurs applications pratiques.',
    category: 'Computer Vision',
    date: '2025-10-15',
    readTime: '6 min',
    image: '/placeholder-article-3.jpg'
  },
];

const ArticleCard = ({ article }: { article: Article }) => {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-center mb-2">
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
            {article.category}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {article.readTime} de lecture
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
          <Link href={`/articles/${article.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            {article.title}
          </Link>
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {article.excerpt}
        </p>
        <div className="flex justify-between items-center">
          <time dateTime={article.date} className="text-sm text-gray-500 dark:text-gray-400">
            {format(new Date(article.date), 'd MMMM yyyy', { locale: fr })}
          </time>
          <Link 
            href={`/articles/${article.id}`} 
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm flex items-center"
          >
            Lire l&apos;article
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
};

const ArticleList = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Derniers articles
          </h2>
          <Link 
            href="/articles" 
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium flex items-center"
          >
            Voir tout
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArticleList;
