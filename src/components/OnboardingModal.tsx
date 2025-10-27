'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface OnboardingData {
  userType: 'professionnel' | 'particulier' | null;
  experienceLevel: 'debutant' | 'intermediaire' | 'pro' | null;
  aiTools: string[]; // IA utilisées (ChatGPT, Claude, etc.)
  interests: string[];
  toolsUsed: string[];
  wantsNewsletter: boolean;
  newsletterFrequency: number; // 1 = quotidien, 2 = tous les 2 jours, ..., 7 = hebdomadaire
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: OnboardingData) => void;
}

const INTERESTS_OPTIONS = [
  'Machine Learning',
  'LLM (Large Language Models)',
  'Computer Vision',
  'NLP (Natural Language Processing)',
  'Robotique',
  'Éthique IA',
  'IA Générative',
  'Deep Learning',
  'Data Science',
  'Data Analyst',
  'IA en Santé',
  'IA en Finance',
  'Graphisme',
  'Vidéo',
  'Jeux vidéo',
  'Vibecoding',
  'No-code',
];

const AI_TOOLS_OPTIONS = [
  'ChatGPT',
  'Claude',
  'Gemini',
  'Grok',
  'MCP',
  'Mistral AI',
  'Llama',
  'Perplexity',
  'Copilot',
  'Midjourney',
  'DALL-E',
  'Stable Diffusion',
];

const TOOLS_OPTIONS = [
  'n8n',
  'Make (Integromat)',
  'Zapier',
  'Airtable',
  'Notion',
  'Cursor',
  'GitHub Copilot',
  'LangChain',
  'Supabase',
  'Vercel',
  'Figma',
  'Linear',
];

// Liste étendue pour l'autocomplétion
const ALL_TOOLS_SUGGESTIONS = [
  'TensorFlow',
  'PyTorch',
  'Hugging Face',
  'LangChain',
  'OpenAI API',
  'Anthropic API',
  'Cursor',
  'GitHub Copilot',
  'Keras',
  'Scikit-learn',
  'XGBoost',
  'LightGBM',
  'FastAPI',
  'Flask',
  'Django',
  'Streamlit',
  'Gradio',
  'Weights & Biases',
  'MLflow',
  'Ray',
  'Apache Spark',
  'Dask',
  'Pandas',
  'NumPy',
  'Matplotlib',
  'Seaborn',
  'Plotly',
  'Jupyter',
  'VS Code',
  'PyCharm',
  'Colab',
  'Kaggle',
  'Docker',
  'Kubernetes',
  'AWS SageMaker',
  'Azure ML',
  'Google Cloud AI',
  'Vertex AI',
  'Databricks',
  'Snowflake',
  'dbt',
  'Airflow',
  'Prefect',
  'Great Expectations',
  'DVC',
  'ClearML',
  'Neptune.ai',
  'Comet.ml',
  'Evidently AI',
  'Seldon',
  'BentoML',
  'ONNX',
  'TensorRT',
  'OpenVINO',
  'Triton',
  'LlamaIndex',
  'Semantic Kernel',
  'AutoGPT',
  'LangSmith',
  'Pinecone',
  'Weaviate',
  'Chroma',
  'Qdrant',
  'Milvus',
  'FAISS',
  'Elasticsearch',
  'Redis',
  'PostgreSQL',
  'MongoDB',
  'Supabase',
  'Firebase',
  'Vercel',
  'Netlify',
  'Railway',
  'Render',
  // No-code/Low-code & Automation
  'n8n',
  'Make (Integromat)',
  'Zapier',
  'Airtable',
  'Notion',
  'Coda',
  'Retool',
  'Bubble',
  'Webflow',
  'Framer',
  'Figma',
  // Productivity & Collaboration
  'Slack',
  'Discord',
  'Linear',
  'Jira',
  'Asana',
  'Trello',
  'Monday.com',
  'ClickUp',
  'Miro',
  'FigJam',
  'Excalidraw',
  // Data & Analytics
  'Tableau',
  'Power BI',
  'Looker',
  'Metabase',
  'Superset',
  'Redash',
  'Google Analytics',
  'Mixpanel',
  'Amplitude',
  'Segment',
  'Rudderstack',
  // CMS & Content
  'Contentful',
  'Sanity',
  'Strapi',
  'WordPress',
  'Ghost',
  'Webflow CMS',
  // API & Backend
  'Postman',
  'Insomnia',
  'Swagger',
  'GraphQL',
  'REST',
  'tRPC',
  'Prisma',
  'Drizzle',
  // Testing & QA
  'Playwright',
  'Cypress',
  'Selenium',
  'Jest',
  'Vitest',
  'Pytest',
  // Version Control & CI/CD
  'Git',
  'GitHub',
  'GitLab',
  'Bitbucket',
  'GitHub Actions',
  'GitLab CI',
  'CircleCI',
  'Jenkins',
  'Travis CI',
  // Monitoring & Observability
  'Sentry',
  'Datadog',
  'New Relic',
  'Grafana',
  'Prometheus',
  'LogRocket',
  'Hotjar',
  'FullStory',
  // Other
  'Stripe',
  'Twilio',
  'SendGrid',
  'Mailchimp',
  'Resend',
  'Cloudflare',
  'AWS',
  'GCP',
  'Azure',
  'DigitalOcean',
  'Heroku',
];

const OnboardingModal = ({ isOpen, onClose, onComplete }: OnboardingModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    userType: null,
    experienceLevel: null,
    aiTools: [],
    interests: [],
    toolsUsed: [],
    wantsNewsletter: false,
    newsletterFrequency: 1, // Par défaut quotidien
  });

  const totalSteps = 7;
  const supabase = createClient();
  
  // État pour le champ de saisie personnalisé des outils
  const [customToolInput, setCustomToolInput] = useState('');
  const [toolSuggestions, setToolSuggestions] = useState<string[]>([]);

  // Fonction générique pour l'authentification OAuth
  const handleOAuthSignIn = async (provider: 'google' | 'apple' | 'facebook' | 'twitter' | 'azure') => {
    try {
      // Sauvegarder les données de l'onboarding dans localStorage avant la redirection OAuth
      localStorage.setItem('onboarding-data', JSON.stringify(formData));
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/`,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error(`Erreur d'authentification ${provider}:`, error);
        alert(`Erreur lors de la connexion avec ${provider}. Veuillez réessayer.`);
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Une erreur est survenue. Veuillez réessayer.');
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const toggleAiTool = (tool: string) => {
    setFormData(prev => ({
      ...prev,
      aiTools: prev.aiTools.includes(tool)
        ? prev.aiTools.filter(t => t !== tool)
        : [...prev.aiTools, tool],
    }));
  };

  const toggleTool = (tool: string) => {
    setFormData(prev => ({
      ...prev,
      toolsUsed: prev.toolsUsed.includes(tool)
        ? prev.toolsUsed.filter(t => t !== tool)
        : [...prev.toolsUsed, tool],
    }));
  };

  // Gérer la saisie de l'outil personnalisé
  const handleCustomToolInput = (value: string) => {
    setCustomToolInput(value);
    
    if (value.trim().length > 0) {
      // Filtrer les suggestions basées sur la saisie
      const filtered = ALL_TOOLS_SUGGESTIONS.filter(tool =>
        tool.toLowerCase().includes(value.toLowerCase()) &&
        !formData.toolsUsed.includes(tool)
      ).slice(0, 5); // Limiter à 5 suggestions
      setToolSuggestions(filtered);
    } else {
      setToolSuggestions([]);
    }
  };

  // Ajouter un outil personnalisé ou depuis les suggestions
  const addCustomTool = (tool: string) => {
    const trimmedTool = tool.trim();
    if (trimmedTool && !formData.toolsUsed.includes(trimmedTool)) {
      setFormData(prev => ({
        ...prev,
        toolsUsed: [...prev.toolsUsed, trimmedTool],
      }));
      setCustomToolInput('');
      setToolSuggestions([]);
    }
  };

  // Gérer l'appui sur Entrée
  const handleCustomToolKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customToolInput.trim()) {
      e.preventDefault();
      addCustomTool(customToolInput);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.userType !== null;
      case 2:
        return formData.experienceLevel !== null;
      case 3:
        return formData.aiTools.length > 0;
      case 4:
        return formData.interests.length > 0;
      case 5:
        return true; // Tools are optional
      case 6:
        return true; // Newsletter is optional
      case 7:
        return false; // Sign up step - no "next" button, only sign up buttons
      default:
        return false;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden"
          >
            <div className="relative max-w-3xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Personnalisez votre expérience
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Étape {step} sur {totalSteps}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="h-1 bg-gray-200 dark:bg-gray-700">
                <motion.div
                  className="h-full bg-indigo-600"
                  initial={{ width: '0%' }}
                  animate={{ width: `${(step / totalSteps) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Step 1: User Type */}
                    {step === 1 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                          Vous êtes un professionnel ou un particulier ?
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button
                            onClick={() => setFormData({ ...formData, userType: 'professionnel' })}
                            className={`p-6 rounded-xl border-2 transition-all ${
                              formData.userType === 'professionnel'
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                            }`}
                          >
                            <div className="text-4xl mb-3">💼</div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              Professionnel
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              J&apos;utilise l&apos;IA dans mon travail ou mon entreprise
                            </p>
                          </button>
                          <button
                            onClick={() => setFormData({ ...formData, userType: 'particulier' })}
                            className={`p-6 rounded-xl border-2 transition-all ${
                              formData.userType === 'particulier'
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                            }`}
                          >
                            <div className="text-4xl mb-3">👤</div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              Particulier
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Je m&apos;intéresse à l&apos;IA par curiosité personnelle
                            </p>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Experience Level */}
                    {step === 2 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                          Quel est votre niveau d'expérience avec l'IA ?
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <button
                            onClick={() => setFormData({ ...formData, experienceLevel: 'debutant' })}
                            className={`p-6 rounded-xl border-2 transition-all ${
                              formData.experienceLevel === 'debutant'
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                            }`}
                          >
                            <div className="text-4xl mb-3">🌱</div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              Débutant
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Je découvre l&apos;IA
                            </p>
                          </button>
                          <button
                            onClick={() => setFormData({ ...formData, experienceLevel: 'intermediaire' })}
                            className={`p-6 rounded-xl border-2 transition-all ${
                              formData.experienceLevel === 'intermediaire'
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                            }`}
                          >
                            <div className="text-4xl mb-3">📚</div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              Intermédiaire
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              J&apos;ai des connaissances de base
                            </p>
                          </button>
                          <button
                            onClick={() => setFormData({ ...formData, experienceLevel: 'pro' })}
                            className={`p-6 rounded-xl border-2 transition-all ${
                              formData.experienceLevel === 'pro'
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                            }`}
                          >
                            <div className="text-4xl mb-3">🚀</div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              Pro
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Je suis expert en IA
                            </p>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: AI Tools */}
                    {step === 3 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                          Quelles IA avez-vous l&apos;habitude d&apos;utiliser ?
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {AI_TOOLS_OPTIONS.map((tool) => (
                            <button
                              key={tool}
                              onClick={() => toggleAiTool(tool)}
                              className={`p-4 rounded-lg border-2 transition-all text-left ${
                                formData.aiTools.includes(tool)
                                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                              }`}
                            >
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {tool}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 4: Interests */}
                    {step === 4 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                          Quels domaines de l&apos;IA vous intéressent ?
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Sélectionnez un ou plusieurs domaines
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {INTERESTS_OPTIONS.map((interest) => (
                            <button
                              key={interest}
                              onClick={() => toggleInterest(interest)}
                              className={`p-4 rounded-lg border-2 transition-all text-left ${
                                formData.interests.includes(interest)
                                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                              }`}
                            >
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {interest}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 5: Tools */}
                    {step === 5 && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Quels logiciels/frameworks utilisez-vous ?
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Optionnel - Pour les développeurs et data scientists
                          </p>
                        </div>

                        {/* Champ de saisie personnalisé EN HAUT */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Rechercher ou ajouter un outil
                          </label>
                          <input
                            type="text"
                            value={customToolInput}
                            onChange={(e) => handleCustomToolInput(e.target.value)}
                            onKeyPress={handleCustomToolKeyPress}
                            placeholder="Tapez le nom d'un outil (ex: n8n, Notion, Zapier)..."
                            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all"
                          />
                          
                          {/* Suggestions d'autocomplétion */}
                          {toolSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {toolSuggestions.map((suggestion) => (
                                <button
                                  key={suggestion}
                                  onClick={() => addCustomTool(suggestion)}
                                  className="w-full px-4 py-3 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Outils sélectionnés (tags) - JUSTE EN DESSOUS */}
                        {formData.toolsUsed.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                              Outils sélectionnés ({formData.toolsUsed.length}) :
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {formData.toolsUsed.map((tool) => (
                                <span
                                  key={tool}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium"
                                >
                                  {tool}
                                  <button
                                    onClick={() => toggleTool(tool)}
                                    className="hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-0.5 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Outils populaires suggérés - EN BAS */}
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Outils populaires :
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {TOOLS_OPTIONS.map((tool) => (
                              <button
                                key={tool}
                                onClick={() => toggleTool(tool)}
                                className={`p-4 rounded-lg border-2 transition-all text-left ${
                                  formData.toolsUsed.includes(tool)
                                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                                }`}
                              >
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {tool}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 6: Newsletter */}
                    {step === 6 && (
                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                          Souhaitez-vous recevoir notre newsletter ?
                        </h3>
                        
                        {/* Yes/No Toggle */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                          <button
                            onClick={() => setFormData({ ...formData, wantsNewsletter: true })}
                            className={`p-6 rounded-xl border-2 transition-all ${
                              formData.wantsNewsletter
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                            }`}
                          >
                            <div className="text-4xl mb-3">📧</div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Oui, je veux rester informé
                            </h4>
                          </button>
                          <button
                            onClick={() => setFormData({ ...formData, wantsNewsletter: false })}
                            className={`p-6 rounded-xl border-2 transition-all ${
                              !formData.wantsNewsletter
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                            }`}
                          >
                            <div className="text-4xl mb-3">🔕</div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Non merci
                            </h4>
                          </button>
                        </div>

                        {/* Frequency Slider (only if wants newsletter) */}
                        {formData.wantsNewsletter && (
                          <div className="space-y-4 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <label className="block text-lg font-semibold text-gray-900 dark:text-white">
                              À quelle fréquence ?
                            </label>
                            <div className="space-y-6">
                              <input
                                type="range"
                                min="1"
                                max="7"
                                value={formData.newsletterFrequency}
                                onChange={(e) => setFormData({ ...formData, newsletterFrequency: parseInt(e.target.value) })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
                              />
                              <div className="text-center">
                                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                                  {formData.newsletterFrequency === 1 && '📬 Quotidien'}
                                  {formData.newsletterFrequency === 2 && '📬 Tous les 2 jours'}
                                  {formData.newsletterFrequency === 3 && '📬 Tous les 3 jours'}
                                  {formData.newsletterFrequency === 4 && '📬 Tous les 4 jours'}
                                  {formData.newsletterFrequency === 5 && '📬 Tous les 5 jours'}
                                  {formData.newsletterFrequency === 6 && '📬 Tous les 6 jours'}
                                  {formData.newsletterFrequency === 7 && '📬 Hebdomadaire'}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {formData.newsletterFrequency === 1 && 'Recevez les dernières actualités IA chaque jour'}
                                  {formData.newsletterFrequency === 7 && 'Un résumé hebdomadaire des meilleures actualités'}
                                  {formData.newsletterFrequency > 1 && formData.newsletterFrequency < 7 && 
                                    `Recevez une newsletter tous les ${formData.newsletterFrequency} jours`}
                                </p>
                              </div>
                              {/* Visual frequency markers */}
                              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                                <span>Quotidien</span>
                                <span>2j</span>
                                <span>3j</span>
                                <span>4j</span>
                                <span>5j</span>
                                <span>6j</span>
                                <span>Hebdo</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 7: Sign Up */}
                    {step === 7 && (
                      <div className="space-y-6">
                        <div className="text-center mb-8">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            Créez votre compte
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            Choisissez votre méthode d&apos;inscription pour commencer
                          </p>
                        </div>

                        {/* Social Sign Up Buttons */}
                        <div className="space-y-3">
                          {/* Google */}
                          <button
                            onClick={() => handleOAuthSignIn('google')}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-400 transition-all shadow-sm hover:shadow-lg hover:scale-[1.02]"
                          >
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continuer avec Google
                          </button>

                          {/* Apple */}
                          <button
                            onClick={() => handleOAuthSignIn('apple')}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-black dark:bg-white border-2 border-black dark:border-white rounded-xl font-semibold text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-sm hover:shadow-lg hover:scale-[1.02]"
                          >
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                            </svg>
                            Continuer avec Apple
                          </button>

                          {/* Facebook */}
                          <button
                            onClick={() => handleOAuthSignIn('facebook')}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#1877F2] border-2 border-[#1877F2] rounded-xl font-semibold text-white hover:bg-[#166FE5] hover:border-[#0d5dbf] transition-all shadow-sm hover:shadow-lg hover:scale-[1.02]"
                          >
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Continuer avec Facebook
                          </button>

                          {/* X (Twitter) */}
                          <button
                            onClick={() => handleOAuthSignIn('twitter')}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-black dark:bg-white border-2 border-black dark:border-white rounded-xl font-semibold text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-sm hover:shadow-lg hover:scale-[1.02]"
                          >
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            Continuer avec X
                          </button>

                          {/* Microsoft */}
                          <button
                            onClick={() => handleOAuthSignIn('azure')}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-400 transition-all shadow-sm hover:shadow-lg hover:scale-[1.02]"
                          >
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                              <path fill="#F25022" d="M0 0h11.377v11.372H0z"/>
                              <path fill="#00A4EF" d="M12.623 0H24v11.372H12.623z"/>
                              <path fill="#7FBA00" d="M0 12.623h11.377V24H0z"/>
                              <path fill="#FFB900" d="M12.623 12.623H24V24H12.623z"/>
                            </svg>
                            Continuer avec Microsoft
                          </button>
                        </div>

                        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-8">
                          En vous inscrivant, vous acceptez nos{' '}
                          <a href="/terms" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                            Conditions d&apos;utilisation
                          </a>
                          {' '}et notre{' '}
                          <a href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                            Politique de confidentialité
                          </a>
                        </p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleBack}
                  disabled={step === 1}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    step === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Retour
                </button>
                {step !== 7 && (
                  <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                      canProceed()
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Suivant
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;
