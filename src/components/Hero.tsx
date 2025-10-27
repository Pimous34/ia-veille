import Link from 'next/link';

const Hero = () => {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center">
          {/* Problématique */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Trop d&apos;informations sur l&apos;IA,<br />
            <span className="text-indigo-600 dark:text-indigo-400">tue l&apos;IA !</span>
          </h1>
          
          {/* Solution */}
          <h2 className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8 font-semibold">
            Nous simplifions votre veille personnalisée
          </h2>
          
          {/* Argument Clé */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto">
            Grâce à nos newsletters personnalisées et notre classification intelligente, ne recevez que l&apos;essentiel : 
            les avancées, les modèles et les analyses qui font progresser votre secteur.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link 
              href="/inscription" 
              className="px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Démarrez ma Veille IA Personnalisée
            </Link>
            <Link 
              href="#apercu" 
              className="px-8 py-4 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 rounded-lg font-semibold text-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
            >
              Voir un Aperçu des Dernières Tendances
            </Link>
          </div>

          {/* Bénéfices Clés */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {[
              {
                icon: '🎯',
                title: 'Personnalisé',
                description: 'Swipez vos préférences comme sur Tinder pour affiner votre veille'
              },
              {
                icon: '📧',
                title: 'Newsletter Intelligente',
                description: 'Recevez uniquement les articles qui comptent pour vous'
              },
              {
                icon: '🎙️',
                title: 'Podcast Audio',
                description: 'Écoutez les news du jour générées automatiquement'
              }
            ].map((benefit, index) => (
              <div 
                key={index}
                className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Featured Categories */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Machine Learning', color: 'bg-blue-100 dark:bg-blue-900/30', icon: '🤖' },
            { name: 'LLM', color: 'bg-purple-100 dark:bg-purple-900/30', icon: '💬' },
            { name: 'Computer Vision', color: 'bg-green-100 dark:bg-green-900/30', icon: '👁️' },
            { name: 'Éthique IA', color: 'bg-yellow-100 dark:bg-yellow-900/30', icon: '⚖️' },
          ].map((category, index) => (
            <Link
              key={index}
              href={`/categorie/${category.name.toLowerCase().replace(' ', '-')}`}
              className={`p-6 rounded-xl ${category.color} hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer`}
            >
              <div className="text-3xl mb-2">{category.icon}</div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200">{category.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
