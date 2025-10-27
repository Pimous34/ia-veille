'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingData {
  userType: 'professionnel' | 'particulier' | null;
  experienceLevel: 'debutant' | 'intermediaire' | 'pro' | null;
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
  'NLP (Traitement du langage)',
  'Robotique',
  'Éthique IA',
  'IA Générative',
  'Deep Learning',
  'Data Science',
  'MLOps',
  'IA en Santé',
  'IA en Finance',
];

const TOOLS_OPTIONS = [
  'ChatGPT',
  'Claude',
  'Gemini',
  'Midjourney',
  'Stable Diffusion',
  'TensorFlow',
  'PyTorch',
  'Hugging Face',
  'LangChain',
  'OpenAI API',
  'Copilot',
  'Cursor',
];

const OnboardingModal = ({ isOpen, onClose, onComplete }: OnboardingModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    userType: null,
    experienceLevel: null,
    interests: [],
    toolsUsed: [],
    wantsNewsletter: false,
    newsletterFrequency: 7, // Par défaut hebdomadaire
  });

  const totalSteps = 5;

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

  const toggleTool = (tool: string) => {
    setFormData(prev => ({
      ...prev,
      toolsUsed: prev.toolsUsed.includes(tool)
        ? prev.toolsUsed.filter(t => t !== tool)
        : [...prev.toolsUsed, tool],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.userType !== null;
      case 2:
        return formData.experienceLevel !== null;
      case 3:
        return formData.interests.length > 0;
      case 4:
        return true; // Tools are optional
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

                    {/* Step 3: Interests */}
                    {step === 3 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                          Quels sujets vous intéressent ? (Sélectionnez-en plusieurs)
                        </h3>
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

                    {/* Step 4: Tools */}
                    {step === 4 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                          Quels outils utilisez-vous ? (Optionnel)
                        </h3>
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
                    )}

                    {/* Step 5: Newsletter */}
                    {step === 5 && (
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
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    canProceed()
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {step === totalSteps ? 'Terminer' : 'Suivant'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;
