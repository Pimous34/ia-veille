'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Heart, X } from 'lucide-react';

interface Topic {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
}

interface SwipePreferencesProps {
  topics: Topic[];
  onComplete: (liked: string[], disliked: string[]) => void;
}

const SwipePreferences = ({ topics, onComplete }: SwipePreferencesProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [disliked, setDisliked] = useState<string[]>([]);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleSwipe = (direction: 'left' | 'right') => {
    const currentTopic = topics[currentIndex];
    
    if (direction === 'right') {
      setLiked([...liked, currentTopic.id]);
    } else {
      setDisliked([...disliked, currentTopic.id]);
    }

    if (currentIndex === topics.length - 1) {
      onComplete([...liked, ...(direction === 'right' ? [currentTopic.id] : [])], 
                 [...disliked, ...(direction === 'left' ? [currentTopic.id] : [])]);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100) {
      handleSwipe('right');
    } else if (info.offset.x < -100) {
      handleSwipe('left');
    }
  };

  if (currentIndex >= topics.length) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Merci ! Vos préférences sont enregistrées
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Nous allons personnaliser votre veille en fonction de vos choix.
        </p>
      </div>
    );
  }

  const currentTopic = topics[currentIndex];

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="mb-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {currentIndex + 1} / {topics.length}
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mt-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / topics.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="relative h-[500px] flex items-center justify-center">
        <motion.div
          className="absolute w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 cursor-grab active:cursor-grabbing"
          style={{ x, rotate, opacity }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          whileTap={{ scale: 0.95 }}
        >
          <div className="mb-4">
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
              {currentTopic.category}
            </span>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {currentTopic.title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {currentTopic.description}
          </p>
          
          <div className="flex flex-wrap gap-2">
            {currentTopic.tags.map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex justify-center gap-8 mt-8">
        <button
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
          aria-label="Je n'aime pas"
        >
          <X size={32} />
        </button>
        
        <button
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
          aria-label="J'aime"
        >
          <Heart size={32} />
        </button>
      </div>

      <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
        Swipez à gauche pour ignorer, à droite pour aimer
      </div>
    </div>
  );
};

export default SwipePreferences;
