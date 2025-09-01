// client/src/components/TopicManager.tsx

import React from 'react';
import { Check, Heart, Shuffle } from 'lucide-react';
import { Topic } from '../types/game';

interface TopicManagerProps {
  playerTopics: Topic[];
  lockedTopics: Set<Topic>;
  completedTopics: Topic[];
  selectedTopic: Topic | null;
  loading: boolean;
  onTopicSelect: (topic: Topic) => void;
  onToggleTopicLock: (topic: Topic) => void;
  onShuffleTopics: (topic?: Topic) => void;
}

export const TopicManager: React.FC<TopicManagerProps> = ({
  playerTopics,
  lockedTopics,
  completedTopics,
  selectedTopic,
  loading,
  onTopicSelect,
  onToggleTopicLock,
  onShuffleTopics
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Topics (4/11)</h2>
        <button
          onClick={() => onShuffleTopics()}
          disabled={lockedTopics.size === 4 || loading}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
        >
          <Shuffle size={16} />
          Shuffle Unlocked
        </button>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Click the heart to lock topics you like, then shuffle to replace the unlocked ones! 
        Topics with photos are automatically locked.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {playerTopics.map((topic) => {
          const isCompleted = completedTopics.includes(topic);
          const isLocked = lockedTopics.has(topic);
          
          return (
            <div key={topic} className="relative">
              <button
                onClick={() => onTopicSelect(topic)}
                disabled={isCompleted || loading}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                  isCompleted
                    ? 'border-green-500 bg-green-50 text-green-700 cursor-default'
                    : selectedTopic === topic
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : isLocked
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-pink-300 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{topic}</span>
                  {isCompleted ? <Check size={16} /> : null}
                </div>
              </button>
              
              {/* Lock/Unlock button */}
              {!isCompleted && (
                <button
                  onClick={() => onToggleTopicLock(topic)}
                  className={`absolute -top-2 -right-2 p-1 rounded-full border-2 border-white transition-all duration-200 ${
                    isLocked
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-gray-200 text-gray-600 hover:bg-red-100'
                  }`}
                >
                  <Heart size={12} fill={isLocked ? 'currentColor' : 'none'} />
                </button>
              )}
              
              {/* Individual shuffle button */}
              {!isCompleted && !isLocked && (
                <button
                  onClick={() => onShuffleTopics(topic)}
                  disabled={loading}
                  className="absolute -bottom-2 -right-2 p-1 bg-blue-500 text-white rounded-full border-2 border-white hover:bg-blue-600 transition-all duration-200"
                >
                  <Shuffle size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      {lockedTopics.size > 0 && (
        <div className="mt-4 p-3 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-700">
            <Heart size={14} className="inline mr-1" fill="currentColor" />
            Locked topics: {Array.from(lockedTopics).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};