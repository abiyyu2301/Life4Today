// client/src/hooks/useSession.ts

import { useState, useEffect, useCallback } from 'react';
import { SessionManager, UserSession } from '../utils/sessionManager';
import { Player, Topic, ALL_TOPICS } from '../types/game';

export const useSession = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number>(0);

  // Load session on mount
  useEffect(() => {
    const savedSession = SessionManager.loadSession();
    if (savedSession) {
      setSession(savedSession);
    }
  }, []);

  // Update session time remaining every minute
  useEffect(() => {
    const updateTimeRemaining = () => {
      const sessionInfo = SessionManager.getSessionInfo();
      setSessionTimeRemaining(sessionInfo.timeRemaining);
      
      if (!sessionInfo.isActive && session) {
        // Session expired, clear it
        clearSession();
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [session]);

  const saveSession = useCallback((
    gameId: string,
    playerId: string,
    playerName: string,
    playerTopics: Topic[],
    lockedTopics: Topic[]
  ) => {
    const newSession: UserSession = {
      gameId,
      playerId,
      playerName,
      playerTopics: playerTopics.map(t => t.toString()),
      lockedTopics: lockedTopics.map(t => t.toString()),
      createdAt: Date.now(),
      lastActive: Date.now()
    };
    
    SessionManager.saveSession(newSession);
    setSession(newSession);
  }, []);

  const updateSession = useCallback((updates: Partial<UserSession>) => {
    SessionManager.updateSession(updates);
    const updatedSession = SessionManager.loadSession();
    setSession(updatedSession);
  }, []);

  const clearSession = useCallback(() => {
    SessionManager.clearSession();
    setSession(null);
    setSessionTimeRemaining(0);
  }, []);

  const renewSession = useCallback(() => {
    SessionManager.renewSession();
    const renewedSession = SessionManager.loadSession();
    setSession(renewedSession);
  }, []);

  const restorePlayerFromSession = useCallback((sessionData: UserSession): {
    player: Player;
    topics: Topic[];
    locked: Topic[];
  } => {
    const topics = sessionData.playerTopics.filter((topic): topic is Topic => 
      ALL_TOPICS.includes(topic as Topic)
    );
    const locked = sessionData.lockedTopics.filter((topic): topic is Topic => 
      ALL_TOPICS.includes(topic as Topic)
    );
    
    const player: Player = {
      id: sessionData.playerId,
      name: sessionData.playerName,
      photos: [], // Will be loaded from server
      completedTopics: [],
      photoCount: 0,
      lastActive: new Date().toISOString()
    };

    return { player, topics, locked };
  }, []);

  const formatTimeRemaining = useCallback((milliseconds: number): string => {
    return SessionManager.formatTimeRemaining(milliseconds);
  }, []);

  return {
    session,
    sessionTimeRemaining,
    saveSession,
    updateSession,
    clearSession,
    renewSession,
    restorePlayerFromSession,
    formatTimeRemaining,
    hasValidSession: !!session && sessionTimeRemaining > 0
  };
};