// client/src/hooks/useGameLogic.ts

import { useState, useCallback } from 'react';
import { Topic, ALL_TOPICS } from '../types/game';

export const useGameLogic = () => {
  const [playerTopics, setPlayerTopics] = useState<Topic[]>([]);
  const [lockedTopics, setLockedTopics] = useState<Set<Topic>>(new Set());

  // Get 4 random topics from the available pool
  const getRandomTopics = useCallback((excludeTopics: Topic[] = []): Topic[] => {
    const availableTopics = ALL_TOPICS.filter(topic => !excludeTopics.includes(topic));
    const shuffled = [...availableTopics].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  }, []);

  // Initialize player topics
  const initializeTopics = useCallback((existingTopics?: Topic[]): Topic[] => {
    if (existingTopics && existingTopics.length === 4) {
      setPlayerTopics(existingTopics);
      return existingTopics;
    } else {
      const newTopics = getRandomTopics();
      setPlayerTopics(newTopics);
      return newTopics;
    }
  }, [getRandomTopics]);

  // Shuffle unwanted topics while keeping locked ones
  const shuffleTopics = useCallback((topicToReplace?: Topic) => {
    if (topicToReplace) {
      // Replace specific topic
      const currentTopicsWithoutReplaced = playerTopics.filter(t => t !== topicToReplace);
      const usedTopics = [...currentTopicsWithoutReplaced, ...Array.from(lockedTopics)];
      const availableTopics = ALL_TOPICS.filter(topic => !usedTopics.includes(topic));
      
      if (availableTopics.length > 0) {
        const randomReplacement = availableTopics[Math.floor(Math.random() * availableTopics.length)];
        setPlayerTopics(prev => prev.map(t => t === topicToReplace ? randomReplacement : t));
      }
    } else {
      // Replace all unlocked topics
      const lockedArray = Array.from(lockedTopics);
      const unlockedTopics = playerTopics.filter(t => !lockedTopics.has(t));
      const usedTopics = [...lockedArray];
      const availableTopics = ALL_TOPICS.filter(topic => !usedTopics.includes(topic));
      
      const shuffledAvailable = [...availableTopics].sort(() => 0.5 - Math.random());
      const newUnlockedTopics = shuffledAvailable.slice(0, unlockedTopics.length);
      
      // Combine locked topics with new unlocked topics
      const newTopics = [...lockedArray];
      newUnlockedTopics.forEach(topic => {
        if (newTopics.length < 4) {
          newTopics.push(topic);
        }
      });
      
      // Fill remaining slots if needed
      while (newTopics.length < 4) {
        const remaining = ALL_TOPICS.filter(t => !newTopics.includes(t));
        if (remaining.length > 0) {
          newTopics.push(remaining[Math.floor(Math.random() * remaining.length)]);
        } else {
          break;
        }
      }
      
      setPlayerTopics(newTopics);
    }
  }, [playerTopics, lockedTopics]);

  // Toggle topic lock (only for non-completed topics)
  const toggleTopicLock = useCallback((topic: Topic, completedTopics: Topic[]) => {
    const isCompleted = completedTopics.includes(topic);
    if (isCompleted) return; // Can't unlock completed topics

    setLockedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topic)) {
        newSet.delete(topic);
      } else {
        newSet.add(topic);
      }
      return newSet;
    });
  }, []);

  // Update locked topics based on completed topics
  const updateLockedTopics = useCallback((completedTopics: Topic[], manuallyLocked: Topic[] = []) => {
    const newLockedTopics = new Set([...completedTopics, ...manuallyLocked]);
    setLockedTopics(newLockedTopics);
  }, []);

  return {
    playerTopics,
    lockedTopics,
    setPlayerTopics,
    setLockedTopics,
    getRandomTopics,
    initializeTopics,
    shuffleTopics,
    toggleTopicLock,
    updateLockedTopics
  };
};