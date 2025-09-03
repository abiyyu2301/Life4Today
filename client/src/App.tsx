// client/src/App.tsx - Complete fixed version

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Camera, Share2, Check, X, Download, Shuffle, Heart, Users, Eye, Clock, RefreshCw, LogOut, AlertTriangle } from 'lucide-react';


// Types and constants
interface Photo {
  id: string;
  filename: string;
  url: string;
  topic: string;
  uploadedAt: string;
}

interface Player {
  id: string;
  name: string;
  photos: Photo[];
  completedTopics: string[];
  photoCount: number;
  lastActive: string;
}

interface GameInfo {
  id: string;
  players: Player[];
  topics: string[];
}

type Topic = 
  | 'food' 
  | 'ootd' 
  | 'cute animals' 
  | 'trending topics' 
  | 'selfies' 
  | 'views' 
  | 'drinks' 
  | 'watching/listening' 
  | 'quote of the day' 
  | 'workstation' 
  | 'transportation';

const ALL_TOPICS: Topic[] = [
  'food', 'ootd', 'cute animals', 'trending topics', 'selfies', 
  'views', 'drinks', 'watching/listening', 'quote of the day', 
  'workstation', 'transportation'
];

type GameState = 'setup' | 'playing' | 'viewing';

// Fixed Session Management
interface UserSession {
  gameId: string;
  playerId: string;
  playerName: string;
  playerTopics: string[];
  lockedTopics: string[];
  createdAt: number;
  lastActive: number;
  renewals: number; // Track number of renewals
}

const SESSION_KEY = 'life4today_session';
const SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
const MAX_RENEWALS = 2; // Allow 2 renewals (total 36 hours max)

class SessionManager {
  static saveSession(session: UserSession): void {
    try {
      const sessionData = { ...session, lastActive: Date.now() };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
  }

  static loadSession(): UserSession | null {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) return null;
      const session: UserSession = JSON.parse(sessionData);
      
      // Ensure renewals field exists for backward compatibility
      if (session.renewals === undefined) {
        session.renewals = 0;
      }
      
      if (this.isSessionExpired(session)) {
        this.clearSession();
        return null;
      }
      return session;
    } catch (error) {
      console.warn('Failed to load session:', error);
      this.clearSession();
      return null;
    }
  }

  static updateSession(updates: Partial<UserSession>): void {
    const existingSession = this.loadSession();
    if (!existingSession) return;
    const updatedSession = { ...existingSession, ...updates, lastActive: Date.now() };
    this.saveSession(updatedSession);
  }

  static clearSession(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.warn('Failed to clear session:', error);
    }
  }

  static isSessionExpired(session: UserSession): boolean {
    const now = Date.now();
    const sessionAge = now - session.createdAt;
    const maxDuration = SESSION_DURATION * (session.renewals + 1);
    return sessionAge > maxDuration;
  }

  static canRenewSession(session: UserSession): boolean {
    return session.renewals < MAX_RENEWALS;
  }

  static renewSession(): boolean {
    const session = this.loadSession();
    if (!session || !this.canRenewSession(session)) {
      return false;
    }
    this.updateSession({ renewals: session.renewals + 1, lastActive: Date.now() });
    return true;
  }

  static getSessionInfo(): { 
    isActive: boolean; 
    timeRemaining: number; 
    canRenew: boolean;
    renewalsLeft: number;
  } {
    const session = this.loadSession();
    if (!session) {
      return { isActive: false, timeRemaining: 0, canRenew: false, renewalsLeft: 0 };
    }

    const now = Date.now();
    const sessionAge = now - session.createdAt;
    const maxDuration = SESSION_DURATION * (session.renewals + 1);
    const timeRemaining = Math.max(0, maxDuration - sessionAge);
    
    return {
      isActive: timeRemaining > 0,
      timeRemaining,
      canRenew: this.canRenewSession(session),
      renewalsLeft: MAX_RENEWALS - session.renewals
    };
  }

  static formatTimeRemaining(milliseconds: number): string {
    const hours = Math.floor(milliseconds / (60 * 60 * 1000));
    const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

// API Service
const API_BASE = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api';

class ApiService {
  static async createGame(): Promise<{ success: boolean; gameId?: string; topics?: string[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE}/games`, { method: 'POST' });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Failed to create game' };
    }
  }

  static async getGame(gameId: string): Promise<{ success: boolean; game?: GameInfo; message?: string }> {
    try {
      const response = await fetch(`${API_BASE}/games/${gameId}`);
      const result = await response.json();
      return {
        success: result.success,
        game: result.success ? result.game : undefined,
        message: result.message
      };
    } catch (error) {
      return { success: false, message: 'Failed to get game info' };
    }
  }

  static async joinGame(gameId: string, playerName: string, playerId: string): Promise<{ success: boolean; player?: Player; message?: string }> {
    try {
      const response = await fetch(`${API_BASE}/games/${gameId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, playerId }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Failed to join game' };
    }
  }

  static async uploadPhoto(gameId: string, playerId: string, photo: File, topic: string): Promise<{ success: boolean; photo?: Photo; message?: string }> {
    try {
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('topic', topic);
      const response = await fetch(`${API_BASE}/games/${gameId}/players/${playerId}/photos`, {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Failed to upload photo' };
    }
  }

  static async getPlayerPhotos(gameId: string, playerId: string): Promise<{ success: boolean; photos?: Photo[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE}/games/${gameId}/players/${playerId}/photos`);
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Failed to get photos' };
    }
  }

  static async generateShareText(gameId: string, playerId: string, type: 'completed' | 'reminder'): Promise<{ success: boolean; shareText?: string; message?: string }> {
    try {
      const response = await fetch(`${API_BASE}/games/${gameId}/players/${playerId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Failed to generate share text' };
    }
  }

  static async syncPlayerState(gameId: string, playerId: string): Promise<{ success: boolean; player?: Player; message?: string }> {
    try {
      const photosResponse = await this.getPlayerPhotos(gameId, playerId);
      if (!photosResponse.success || !photosResponse.photos) {
        return { success: false, message: 'Failed to sync player state' };
      }
      const gameResponse = await this.getGame(gameId);
      if (!gameResponse.success || !gameResponse.game) {
        return { success: false, message: 'Game not found' };
      }
      const player = gameResponse.game.players.find(p => p.id === playerId);
      if (!player) {
        return { success: false, message: 'Player not found in game' };
      }
      return {
        success: true,
        player: {
          ...player,
          photos: photosResponse.photos,
          completedTopics: photosResponse.photos.map(p => p.topic),
          photoCount: photosResponse.photos.length
        }
      };
    } catch (error) {
      return { success: false, message: 'Failed to sync player state' };
    }
  }

  static getPhotoUrl(photoUrl: string): string {
    return `${API_BASE.replace('/api', '')}${photoUrl}`;
  }
}

// Session Info Component
interface SessionInfoProps {
  timeRemaining: number;
  canRenew: boolean;
  renewalsLeft: number;
  onSync: () => void;
  onRenew: () => void;
  onClear: () => void;
  isSyncing?: boolean;
  formatTime: (ms: number) => string;
}

const SessionInfo: React.FC<SessionInfoProps> = ({
  timeRemaining, canRenew, renewalsLeft, onSync, onRenew, onClear, isSyncing = false, formatTime
}) => {
  const isLowTime = timeRemaining < 60 * 60 * 1000; // Less than 1 hour
  const isCriticalTime = timeRemaining < 30 * 60 * 1000; // Less than 30 minutes

  const getStatusColor = () => {
    if (isCriticalTime) return 'red';
    if (isLowTime) return 'orange';
    return 'green';
  };

  const statusColor = getStatusColor();

  return (
    <div className={`rounded-xl p-3 border ${
      statusColor === 'red' ? 'bg-red-50 border-red-200' :
      statusColor === 'orange' ? 'bg-orange-50 border-orange-200' :
      'bg-green-50 border-green-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCriticalTime && <AlertTriangle size={16} className="text-red-600" />}
          <Clock size={16} className={`${
            statusColor === 'red' ? 'text-red-600' :
            statusColor === 'orange' ? 'text-orange-600' :
            'text-green-600'
          }`} />
          <span className={`text-sm font-medium ${
            statusColor === 'red' ? 'text-red-700' :
            statusColor === 'orange' ? 'text-orange-700' :
            'text-green-700'
          }`}>
            Session: {formatTime(timeRemaining)}
          </span>
          {renewalsLeft > 0 && (
            <span className="text-xs text-gray-500">
              ({renewalsLeft} renewal{renewalsLeft !== 1 ? 's' : ''} left)
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={onSync} disabled={isSyncing} className="flex items-center gap-1 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Sync with server">
            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>
          
          {isLowTime && canRenew && (
            <button onClick={onRenew} className="flex items-center gap-1 text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors" title={`Renew session for 12 more hours (${renewalsLeft} renewal${renewalsLeft !== 1 ? 's' : ''} left)`}>
              <Clock size={12} />
              Renew (+12h)
            </button>
          )}
          
          <button onClick={onClear} className="flex items-center gap-1 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors" title="End session">
            <LogOut size={12} />
            End
          </button>
        </div>
      </div>
      
      {isCriticalTime && (
        <div className="mt-2 text-xs text-red-600">
          <AlertTriangle size={12} className="inline mr-1" />
          <strong>Critical:</strong> Session expires very soon!
          {canRenew && ' Click "Renew" to extend.'}
          {!canRenew && ' No renewals left. Session will end soon.'}
        </div>
      )}
      
      {isLowTime && !isCriticalTime && canRenew && (
        <p className="text-xs text-orange-600 mt-1">
          ⚠️ Session expires in less than 1 hour. Click "Renew" to extend for 12 more hours.
        </p>
      )}
      
      {!canRenew && renewalsLeft === 0 && (
        <p className="text-xs text-gray-600 mt-1">
          ℹ️ No renewals remaining. Session will end when timer reaches zero.
        </p>
      )}
    </div>
  );
};

// Topic Manager Component
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

const TopicManager: React.FC<TopicManagerProps> = ({
  playerTopics, lockedTopics, completedTopics, selectedTopic, loading,
  onTopicSelect, onToggleTopicLock, onShuffleTopics
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
                  isCompleted ? 'border-green-500 bg-green-50 text-green-700 cursor-default'
                    : selectedTopic === topic ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : isLocked ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-pink-300 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{topic}</span>
                  {isCompleted ? <Check size={16} /> : null}
                </div>
              </button>
              {!isCompleted && (
                <button onClick={() => onToggleTopicLock(topic)} className={`absolute -top-2 -right-2 p-1 rounded-full border-2 border-white transition-all duration-200 ${isLocked ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 text-gray-600 hover:bg-red-100'}`}>
                  <Heart size={12} fill={isLocked ? 'currentColor' : 'none'} />
                </button>
              )}
              {!isCompleted && !isLocked && (
                <button onClick={() => onShuffleTopics(topic)} disabled={loading} className="absolute -bottom-2 -right-2 p-1 bg-blue-500 text-white rounded-full border-2 border-white hover:bg-blue-600 transition-all duration-200">
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

const Life4TodayApp: React.FC = () => {
  // Session hooks - updated to use new session system
  const [session, setSession] = useState<UserSession | null>(null);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number>(0);
  const [canRenew, setCanRenew] = useState<boolean>(false);
  const [renewalsLeft, setRenewalsLeft] = useState<number>(0);

  // Game logic hooks
  const [playerTopics, setPlayerTopics] = useState<Topic[]>([]);
  const [lockedTopics, setLockedTopics] = useState<Set<Topic>>(new Set());

  // State
  const [gameId, setGameId] = useState<string>('');
  const [currentPlayer, setCurrentPlayer] = useState<Player>({
    id: '', name: '', photos: [], completedTopics: [], photoCount: 0, lastActive: ''
  });
  const [gameState, setGameState] = useState<GameState>('setup');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [hostName, setHostName] = useState<string>('');
  const [joinName, setJoinName] = useState<string>('');
  const [joinGameId, setJoinGameId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [syncing, setSyncing] = useState<boolean>(false);
  const [otherPlayersPhotos, setOtherPlayersPhotos] = useState<Map<string, Photo[]>>(new Map());
  const [loadingPlayerPhotos, setLoadingPlayerPhotos] = useState<Set<string>>(new Set());
  const [selectedPlayerPhotos, setSelectedPlayerPhotos] = useState<{player: Player, photos: Photo[]} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Utility functions
  const getRandomTopics = useCallback((excludeTopics: Topic[] = []): Topic[] => {
    const availableTopics = ALL_TOPICS.filter(topic => !excludeTopics.includes(topic));
    const shuffled = [...availableTopics].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  }, []);

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

  // Session management - Updated to use new SessionManager
  const saveSession = useCallback((gameId: string, playerId: string, playerName: string, playerTopics: Topic[], lockedTopics: Topic[]) => {
    const newSession: UserSession = {
      gameId, playerId, playerName,
      playerTopics: playerTopics.map(t => t.toString()),
      lockedTopics: lockedTopics.map(t => t.toString()),
      createdAt: Date.now(), lastActive: Date.now(), renewals: 0
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
    setCanRenew(false);
    setRenewalsLeft(0);
  }, []);

  const renewSession = useCallback(() => {
    const success = SessionManager.renewSession();
    if (success) {
      const renewedSession = SessionManager.loadSession();
      setSession(renewedSession);
      // Force update session info immediately
      const sessionInfo = SessionManager.getSessionInfo();
      setSessionTimeRemaining(sessionInfo.timeRemaining);
      setCanRenew(sessionInfo.canRenew);
      setRenewalsLeft(sessionInfo.renewalsLeft);
      return true;
    }
    return false;
  }, []);

  const loadOtherPlayersPhotos = useCallback(async () => {
    if (!gameInfo || gameInfo.players.length === 0) return;
    
    const otherPlayers = gameInfo.players.filter(p => p.id !== currentPlayer.id);
    const newPhotosMap = new Map(otherPlayersPhotos);
    
    for (const player of otherPlayers) {
      if (!newPhotosMap.has(player.id) && !loadingPlayerPhotos.has(player.id)) {
        setLoadingPlayerPhotos(prev => new Set(prev).add(player.id));
        
        try {
          const response = await ApiService.getPlayerPhotos(gameId, player.id);
          if (response.success && response.photos) {
            newPhotosMap.set(player.id, response.photos);
          }
        } catch (error) {
          console.error(`Failed to load photos for player ${player.name}:`, error);
        } finally {
          setLoadingPlayerPhotos(prev => {
            const newSet = new Set(prev);
            newSet.delete(player.id);
            return newSet;
          });
        }
      }
    }
    
    setOtherPlayersPhotos(newPhotosMap);
  }, [gameInfo, gameId, currentPlayer.id, otherPlayersPhotos, loadingPlayerPhotos]);

  const restorePlayerFromSession = useCallback((sessionData: UserSession): { player: Player; topics: Topic[]; locked: Topic[] } => {
    const topics = sessionData.playerTopics.filter((topic): topic is Topic => ALL_TOPICS.includes(topic as Topic));
    const locked = sessionData.lockedTopics.filter((topic): topic is Topic => ALL_TOPICS.includes(topic as Topic));
    const player: Player = {
      id: sessionData.playerId, name: sessionData.playerName, photos: [],
      completedTopics: [], photoCount: 0, lastActive: new Date().toISOString()
    };
    return { player, topics, locked };
  }, []);

  const hasValidSession = !!session && sessionTimeRemaining > 0;

  // Effects - Updated to use new session system
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameParam = urlParams.get('game');
    if (gameParam) setJoinGameId(gameParam.toUpperCase());
  }, []);

  useEffect(() => {
    const savedSession = SessionManager.loadSession();
    if (savedSession) setSession(savedSession);
  }, []);

  // Updated session timer effect
  useEffect(() => {
    const updateSessionInfo = () => {
      const sessionInfo = SessionManager.getSessionInfo();
      setSessionTimeRemaining(sessionInfo.timeRemaining);
      setCanRenew(sessionInfo.canRenew);
      setRenewalsLeft(sessionInfo.renewalsLeft);
      if (!sessionInfo.isActive && session) clearSession();
    };
    updateSessionInfo();
    const interval = setInterval(updateSessionInfo, 60000);
    return () => clearInterval(interval);
  }, [session, clearSession]);

  useEffect(() => {
    if (hasValidSession && session && gameState === 'setup') {
      restoreFromSession();
    }
  }, [hasValidSession, session, gameState]);

  useEffect(() => {
    if (gameState === 'playing' && playerTopics.length === 0) {
      if (session?.playerTopics) {
        setPlayerTopics(session.playerTopics as Topic[]);
      } else {
        initializeTopics();
      }
    }
  }, [gameState, playerTopics.length, initializeTopics, session]);

  useEffect(() => {
    const completedTopics = currentPlayer.photos.map(photo => photo.topic as Topic);
    const manuallyLocked = session?.lockedTopics as Topic[] || [];
    const newLockedTopics = new Set([...completedTopics, ...manuallyLocked.filter(t => !completedTopics.includes(t))]);
    setLockedTopics(newLockedTopics);
    
    if (session && gameState === 'playing') {
      updateSession({
        playerTopics: playerTopics.map(t => t.toString()),
        lockedTopics: Array.from(newLockedTopics).map(t => t.toString())
      });
    }
  }, [currentPlayer.photos, playerTopics, session, gameState, updateSession]);

  useEffect(() => {
    if (gameState === 'playing' && gameId) {
      loadGameInfo();
      const interval = setInterval(loadGameInfo, 10000);
      return () => clearInterval(interval);
    }
  }, [gameState, gameId]);

  useEffect(() => {
    if (gameState === 'viewing' && gameInfo) {
      loadOtherPlayersPhotos();
    }
  }, [gameState, gameInfo, loadOtherPlayersPhotos]);

  // Handlers
  const restoreFromSession = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const gameResponse = await ApiService.getGame(session.gameId);
      if (!gameResponse.success) {
        setError('Saved game no longer exists. Starting fresh.');
        clearSession();
        return;
      }
      const syncResponse = await ApiService.syncPlayerState(session.gameId, session.playerId);
      if (!syncResponse.success || !syncResponse.player) {
        setError('Failed to restore session. Player may have been removed.');
        clearSession();
        return;
      }
      const { player, topics, locked } = restorePlayerFromSession(session);
      setGameId(session.gameId);
      setCurrentPlayer({
        ...player, photos: syncResponse.player.photos,
        completedTopics: syncResponse.player.completedTopics, photoCount: syncResponse.player.photoCount
      });
      setPlayerTopics(topics);
      setLockedTopics(new Set(locked));
      setGameState('playing');
      setGameInfo(gameResponse.game || null);
      window.history.pushState({}, '', `?game=${session.gameId}`);
    } catch (err) {
      setError('Failed to restore session. Please start a new game.');
      clearSession();
    } finally {
      setLoading(false);
    }
  }, [session, restorePlayerFromSession, clearSession]);

  const syncPlayerState = useCallback(async () => {
    if (!session || !gameId) return;
    setSyncing(true);
    try {
      const syncResponse = await ApiService.syncPlayerState(gameId, currentPlayer.id);
      if (syncResponse.success && syncResponse.player) {
        setCurrentPlayer(prev => ({
          ...prev, photos: syncResponse.player!.photos,
          completedTopics: syncResponse.player!.completedTopics, photoCount: syncResponse.player!.photoCount
        }));
        await loadGameInfo();
      } else {
        setError(syncResponse.message || 'Failed to sync with server');
      }
    } catch (err) {
      setError('Failed to sync with server');
    } finally {
      setSyncing(false);
    }
  }, [session, gameId, currentPlayer.id]);

  const loadGameInfo = useCallback(async () => {
    if (!gameId) return;
    try {
      const response = await ApiService.getGame(gameId);
      if (response.success && response.game) {
        setGameInfo(response.game);
        setAllPlayers(response.game.players.filter((p: Player) => p.id !== currentPlayer.id));
      }
    } catch (err) {
      console.error('Failed to load game info:', err);
    }
  }, [gameId, currentPlayer.id]);

  const createGame = useCallback(async () => {
    if (!hostName.trim()) {
      setError('Please enter your name');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const gameResponse = await ApiService.createGame();
      if (!gameResponse.success || !gameResponse.gameId) {
        setError(gameResponse.message || 'Failed to create game');
        return;
      }
      const playerId = Date.now().toString();
      const playerResponse = await ApiService.joinGame(gameResponse.gameId, hostName, playerId);
      if (playerResponse.success && playerResponse.player) {
        const newGameId = gameResponse.gameId;
        const player = playerResponse.player;
        setGameId(newGameId);
        setCurrentPlayer({ ...player, completedTopics: [], photoCount: 0, lastActive: new Date().toISOString() });
        setGameState('playing');
        const initialTopics = initializeTopics();
        saveSession(newGameId, player.id, player.name, initialTopics, []);
        window.history.pushState({}, '', `?game=${newGameId}`);
      }
    } catch (err) {
      setError('Failed to create game. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [hostName, initializeTopics, saveSession]);

  const joinGame = useCallback(async () => {
    if (!joinGameId.trim() || !joinName.trim()) {
      setError('Please enter both game ID and your name');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const gameResponse = await ApiService.getGame(joinGameId);
      if (!gameResponse.success) {
        setError('Game not found. Please check the Game ID.');
        return;
      }
      const playerId = Date.now().toString();
      const playerResponse = await ApiService.joinGame(joinGameId, joinName, playerId);
      if (playerResponse.success && playerResponse.player) {
        const player = playerResponse.player;
        setGameId(joinGameId);
        setCurrentPlayer({
          ...player, completedTopics: player.photos?.map((p: Photo) => p.topic) || [],
          photoCount: player.photos?.length || 0, lastActive: new Date().toISOString()
        });
        setGameState('playing');
        const initialTopics = initializeTopics();
        saveSession(joinGameId, player.id, player.name, initialTopics, []);
        window.history.pushState({}, '', `?game=${joinGameId}`);
        setGameInfo(gameResponse.game || null);
      }
    } catch (err) {
      setError('Failed to join game. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [joinGameId, joinName, initializeTopics, saveSession]);

  const handlePhotoUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTopic) return;
    setLoading(true);
    try {
      const response = await ApiService.uploadPhoto(gameId, currentPlayer.id, file, selectedTopic);
      if (response.success && response.photo) {
        setCurrentPlayer(prev => {
          const filteredPhotos = prev.photos.filter(p => p.topic !== selectedTopic);
          return {
            ...prev, photos: [...filteredPhotos, response.photo!],
            completedTopics: [...filteredPhotos.map(p => p.topic), selectedTopic],
            photoCount: filteredPhotos.length + 1
          };
        });
        setSelectedTopic(null);
        loadGameInfo();
      } else {
        setError(response.message || 'Failed to upload photo');
      }
    } catch (err) {
      setError('Failed to upload photo. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedTopic, gameId, currentPlayer.id, loadGameInfo]);

  const getCompletedTopics = useCallback((): Topic[] => currentPlayer.photos.map(photo => photo.topic as Topic), [currentPlayer.photos]);
  const getMissingTopics = useCallback((): Topic[] => playerTopics.filter(topic => !getCompletedTopics().includes(topic)), [getCompletedTopics, playerTopics]);

  const shuffleTopics = useCallback((topicToReplace?: Topic) => {
    if (topicToReplace) {
      const currentTopicsWithoutReplaced = playerTopics.filter(t => t !== topicToReplace);
      const usedTopics = [...currentTopicsWithoutReplaced, ...Array.from(lockedTopics)];
      const availableTopics = ALL_TOPICS.filter(topic => !usedTopics.includes(topic));
      if (availableTopics.length > 0) {
        const randomReplacement = availableTopics[Math.floor(Math.random() * availableTopics.length)];
        setPlayerTopics(prev => prev.map(t => t === topicToReplace ? randomReplacement : t));
      }
    } else {
      const lockedArray = Array.from(lockedTopics);
      const unlockedTopics = playerTopics.filter(t => !lockedTopics.has(t));
      const usedTopics = [...lockedArray];
      const availableTopics = ALL_TOPICS.filter(topic => !usedTopics.includes(topic));
      const shuffledAvailable = [...availableTopics].sort(() => 0.5 - Math.random());
      const newUnlockedTopics = shuffledAvailable.slice(0, unlockedTopics.length);
      const newTopics = [...lockedArray];
      newUnlockedTopics.forEach(topic => { if (newTopics.length < 4) newTopics.push(topic); });
      while (newTopics.length < 4) {
        const remaining = ALL_TOPICS.filter(t => !newTopics.includes(t));
        if (remaining.length > 0) newTopics.push(remaining[Math.floor(Math.random() * remaining.length)]);
        else break;
      }
      setPlayerTopics(newTopics);
    }
  }, [playerTopics, lockedTopics]);

  const toggleTopicLock = useCallback((topic: Topic) => {
    const isCompleted = getCompletedTopics().includes(topic);
    if (isCompleted) return;
    setLockedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topic)) newSet.delete(topic);
      else newSet.add(topic);
      return newSet;
    });
  }, [getCompletedTopics]);

  const handleSessionClear = useCallback(() => {
    clearSession();
    setGameState('setup');
    setGameId('');
    setCurrentPlayer({ id: '', name: '', photos: [], completedTopics: [], photoCount: 0, lastActive: '' });
    setPlayerTopics([]);
    setLockedTopics(new Set());
    window.history.pushState({}, '', '/');
  }, [clearSession]);

  // Updated session renew handler
  const handleSessionRenew = useCallback(() => {
    const success = renewSession();
    if (!success) {
      setError('Unable to renew session. Maximum renewals reached or session invalid.');
    }
  }, [renewSession]);

  // Generate collage function
  const generateCollage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || currentPlayer.photos.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 600;

    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#E91E63');
    gradient.addColorStop(1, '#8E24AA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 600);

    const positions = [
      { x: 20, y: 20, width: 170, height: 240 },
      { x: 210, y: 20, width: 170, height: 240 },
      { x: 20, y: 340, width: 170, height: 240 },
      { x: 210, y: 340, width: 170, height: 240 }
    ];

    for (let i = 0; i < Math.min(4, currentPlayer.photos.length); i++) {
      const photo = currentPlayer.photos[i];
      const pos = positions[i];
      
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(pos.x, pos.y, pos.width, pos.height, 10);
        } else {
          ctx.rect(pos.x, pos.y, pos.width, pos.height);
        }
        ctx.clip();
        ctx.drawImage(img, pos.x, pos.y, pos.width, pos.height);
        ctx.restore();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(pos.x, pos.y + pos.height - 30, pos.width, 30);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(photo.topic, pos.x + 5, pos.y + pos.height - 10);
      };
      img.src = ApiService.getPhotoUrl(photo.url);
    }

    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Life4', 160, 300);
    ctx.fillStyle = '#E91E63';
    ctx.fillRect(210, 275, 40, 30);
    ctx.fillStyle = 'white';
    ctx.fillText('4', 225, 295);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('TODAY', 140, 330);
  }, [currentPlayer.photos]);

  const downloadCollage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `life4today-${currentPlayer.name}-${gameId}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, [currentPlayer.name, gameId]);

  const copyShareText = useCallback(async (type: 'completed' | 'reminder') => {
    const completed = getCompletedTopics();
    const shareText = type === 'completed' 
      ? `🎯 Life4Today Challenge Complete!\nGame ID: ${gameId}\nPlayer: ${currentPlayer.name}\n✅ Completed all ${completed.length}/4 topics!\n\nMy topics were: ${playerTopics.join(', ')}\n\nJoin the fun: ${window.location.origin}?game=${gameId}`
      : `📸 Life4Today Reminder!\nGame ID: ${gameId}\nPlayer: ${currentPlayer.name}\n\nMy assigned topics:\n${playerTopics.map(topic => completed.includes(topic) ? `✅ ${topic}` : `❌ ${topic}`).join('\n')}\n\nCompleted: ${completed.length}/4\nJoin the game: ${window.location.origin}?game=${gameId}`;
    navigator.clipboard.writeText(shareText);
  }, [gameId, currentPlayer.name, getCompletedTopics, playerTopics]);

  // Setup screen
  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">Life4Today</h1>
            <p className="text-gray-600 mt-2">Photo Challenge Game</p>
            <p className="text-sm text-gray-500 mt-1">Get 4 random topics and create your collage!</p>
          </div>
          {hasValidSession && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-blue-800">Previous Session Found</p>
                  <p className="text-xs text-blue-600">Game: {session?.gameId} | Player: {session?.playerName}</p>
                  <p className="text-xs text-blue-500">Time left: {SessionManager.formatTimeRemaining(sessionTimeRemaining)}</p>
                </div>
                <button onClick={restoreFromSession} disabled={loading} className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50">
                  {loading ? 'Restoring...' : 'Continue'}
                </button>
              </div>
            </div>
          )}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">{error}</div>}
          <div className="space-y-4">
            <div className="space-y-2">
              <input type="text" placeholder="Your Name" value={hostName} onChange={(e) => setHostName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent" />
              <button onClick={createGame} disabled={!hostName.trim() || loading} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Creating...' : 'Create New Game'}
              </button>
            </div>
            <div className="text-center text-gray-500">or</div>
            <div className="space-y-2">
              <input type="text" placeholder="Enter Game ID" value={joinGameId} onChange={(e) => setJoinGameId(e.target.value.toUpperCase())} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent" />
              <input type="text" placeholder="Your Name" value={joinName} onChange={(e) => setJoinName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent" />
              <button onClick={joinGame} disabled={!joinGameId.trim() || !joinName.trim() || loading} className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                {loading ? 'Joining...' : 'Join Game'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Viewing other players screen
  // Enhanced Viewing other players screen
  if (gameState === 'viewing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-400 to-purple-600 p-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">Life4Today - All Players</h1>
              <p className="text-gray-600">Game ID: {gameId}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={loadOtherPlayersPhotos} 
                disabled={loadingPlayerPhotos.size > 0}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-all duration-200"
              >
                <RefreshCw size={16} className={loadingPlayerPhotos.size > 0 ? 'animate-spin' : ''} />
                {loadingPlayerPhotos.size > 0 ? 'Loading...' : 'Refresh'}
              </button>
              <button 
                onClick={() => setGameState('playing')} 
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Back to My Game
              </button>
            </div>
          </div>
        </div>

        {/* Photo Detail Modal */}
        {selectedPlayerPhotos && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedPlayerPhotos(null)}>
            <div className="bg-white rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{selectedPlayerPhotos.player.name}'s Photos</h3>
                <button 
                  onClick={() => setSelectedPlayerPhotos(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPlayerPhotos.photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img 
                      src={ApiService.getPhotoUrl(photo.url)} 
                      alt={photo.topic} 
                      className="w-full h-64 object-cover rounded-lg shadow-md"
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-sm px-3 py-1 rounded capitalize font-medium">
                      {photo.topic}
                    </div>
                    <div className="absolute top-2 right-2 bg-white bg-opacity-90 text-gray-700 text-xs px-2 py-1 rounded">
                      {new Date(photo.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Players Grid */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Users size={24} />
            All Players ({gameInfo?.players.length || 0})
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {gameInfo?.players.map((player) => {
              const playerPhotos = otherPlayersPhotos.get(player.id) || [];
              const isLoadingPhotos = loadingPlayerPhotos.has(player.id);
              const isCurrentPlayer = player.id === currentPlayer.id;
              
              return (
                <div key={player.id} className={`border rounded-xl p-4 ${isCurrentPlayer ? 'border-pink-300 bg-pink-50' : 'border-gray-200'}`}>
                  {/* Player Header */}
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {player.name}
                        {isCurrentPlayer && <span className="text-pink-600 text-sm">(You)</span>}
                      </h3>
                      <p className="text-sm text-gray-600">{player.photoCount}/4 topics completed</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">{player.photoCount}/4</div>
                      {player.photoCount === 4 && <div className="text-green-600 text-sm font-medium">Complete!</div>}
                    </div>
                  </div>

                  {/* Completed Topics */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {player.completedTopics.map((topic) => (
                      <span key={topic} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm capitalize">
                        ✅ {topic}
                      </span>
                    ))}
                  </div>

                  {/* Photos Section */}
                  {!isCurrentPlayer && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-700">Photos</h4>
                        {playerPhotos.length > 0 && (
                          <button
                            onClick={() => setSelectedPlayerPhotos({player, photos: playerPhotos})}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                          >
                            View All ({playerPhotos.length})
                          </button>
                        )}
                      </div>
                      
                      {isLoadingPhotos ? (
                        <div className="flex items-center justify-center h-24 bg-gray-100 rounded-lg">
                          <RefreshCw size={20} className="animate-spin text-gray-500" />
                          <span className="ml-2 text-gray-500">Loading photos...</span>
                        </div>
                      ) : playerPhotos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {playerPhotos.slice(0, 4).map((photo) => (
                            <div key={photo.id} className="relative group cursor-pointer" onClick={() => setSelectedPlayerPhotos({player, photos: playerPhotos})}>
                              <img 
                                src={ApiService.getPhotoUrl(photo.url)} 
                                alt={photo.topic} 
                                className="w-full h-24 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                <Eye size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded capitalize">
                                {photo.topic}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <Camera size={24} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-500 text-sm">No photos uploaded yet</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Current Player Photos */}
                  {isCurrentPlayer && currentPlayer.photos.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">Your Photos</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {currentPlayer.photos.slice(0, 4).map((photo) => (
                          <div key={photo.id} className="relative">
                            <img 
                              src={ApiService.getPhotoUrl(photo.url)} 
                              alt={photo.topic} 
                              className="w-full h-24 object-cover rounded-lg shadow-sm"
                            />
                            <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded capitalize">
                              {photo.topic}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{player.photoCount}/4</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          player.photoCount === 4 
                            ? 'bg-green-500' 
                            : player.photoCount >= 2 
                            ? 'bg-yellow-500' 
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${(player.photoCount / 4) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Last Activity */}
                  <div className="mt-3 text-xs text-gray-500 text-center">
                    Last active: {new Date(player.lastActive).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall Game Stats */}
          {gameInfo && gameInfo.players.length > 1 && (
            <div className="mt-8 bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span>🏆</span>
                Game Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {gameInfo.players.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Players</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {gameInfo.players.filter(p => p.photoCount === 4).length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {gameInfo.players.reduce((sum, p) => sum + p.photoCount, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Photos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round((gameInfo.players.reduce((sum, p) => sum + p.photoCount, 0) / (gameInfo.players.length * 4)) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Overall Progress</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main game screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 to-purple-600 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">Life4Today</h1>
            <p className="text-gray-600">Game ID: {gameId} | Player: {currentPlayer.name}</p>
          </div>
          <div className="flex items-center gap-4">
            {currentPlayer.photos.length > 0 && allPlayers.length > 0 && (
              <button onClick={() => setGameState('viewing')} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-all duration-200">
                <Eye size={16} />
                View Others
              </button>
            )}
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-800">{getCompletedTopics().length}/4</div>
              <div className="text-sm text-gray-600">completed</div>
            </div>
          </div>
        </div>
      </div>

      {hasValidSession && (
        <div className="mb-6">
          <SessionInfo
            timeRemaining={sessionTimeRemaining}
            canRenew={canRenew}
            renewalsLeft={renewalsLeft}
            onSync={syncPlayerState}
            onRenew={handleSessionRenew}
            onClear={handleSessionClear}
            isSyncing={syncing}
            formatTime={SessionManager.formatTimeRemaining}
          />
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">{error}</div>}

      {allPlayers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Users size={20} />
            Other Players ({allPlayers.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {allPlayers.map((player) => (
              <div key={player.id} className="bg-gray-100 rounded-lg px-3 py-2 text-sm">
                <span className="font-medium">{player.name}</span>
                <span className="text-gray-600 ml-2">{player.photoCount}/4</span>
                {player.photoCount === 4 && <span className="text-green-600 ml-1">✅</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <TopicManager
        playerTopics={playerTopics}
        lockedTopics={lockedTopics}
        completedTopics={getCompletedTopics()}
        selectedTopic={selectedTopic}
        loading={loading}
        onTopicSelect={setSelectedTopic}
        onToggleTopicLock={toggleTopicLock}
        onShuffleTopics={shuffleTopics}
      />

      {selectedTopic && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            Upload photo for: <span className="text-pink-600 capitalize">{selectedTopic}</span>
          </h3>
          <div className="flex gap-4">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} disabled={loading} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              <Upload size={20} />
              {loading ? 'Uploading...' : 'Upload Photo'}
            </button>
            <button onClick={() => setSelectedTopic(null)} disabled={loading} className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-all duration-200">
              <X size={20} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {currentPlayer.photos.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Your Photos</h3>
          <div className="grid grid-cols-2 gap-4">
            {currentPlayer.photos.map((photo) => (
              <div key={photo.id} className="relative">
                <img src={ApiService.getPhotoUrl(photo.url)} alt={photo.topic} className="w-full h-32 object-cover rounded-lg" />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded capitalize">{photo.topic}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentPlayer.photos.length >= 4 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">🎉 Challenge Complete! Generate Your Collage</h3>
          <div className="flex gap-4 mb-4">
            <button onClick={generateCollage} className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200">
              <Camera size={20} />
              Generate Collage
            </button>
            <button onClick={downloadCollage} className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-all duration-200">
              <Download size={20} />
              Download
            </button>
          </div>
          <canvas ref={canvasRef} className="border border-gray-200 rounded-lg max-w-full" style={{ maxHeight: '400px' }} />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Share Progress</h3>
        <div className="space-y-3">
          <button onClick={() => copyShareText('completed')} disabled={getCompletedTopics().length < 4} className="w-full flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200">
            <Share2 size={20} />
            Share Completion (All 4 Done!)
          </button>
          <button onClick={() => copyShareText('reminder')} disabled={getMissingTopics().length === 0} className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200">
            <Share2 size={20} />
            Share Progress
          </button>
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h4 className="font-semibold text-gray-800 mb-2">Progress Summary</h4>
          <div className="space-y-2">
            <div>
              <span className="text-green-600 font-medium">Completed ({getCompletedTopics().length}):</span>
              <p className="text-sm text-gray-600 mt-1 capitalize">{getCompletedTopics().join(', ') || 'None yet'}</p>
            </div>
            {getMissingTopics().length > 0 && (
              <div>
                <span className="text-orange-600 font-medium">Still needed ({getMissingTopics().length}):</span>
                <p className="text-sm text-gray-600 mt-1 capitalize">{getMissingTopics().join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Life4TodayApp;