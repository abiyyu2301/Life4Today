// client/src/utils/sessionManager.ts

export interface UserSession {
  gameId: string;
  playerId: string;
  playerName: string;
  playerTopics: string[];
  lockedTopics: string[];
  createdAt: number;
  lastActive: number;
}

const SESSION_KEY = 'life4today_session';
const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

export class SessionManager {
  static saveSession(session: UserSession): void {
    try {
      const sessionData = {
        ...session,
        lastActive: Date.now()
      };
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
      
      // Check if session has expired
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

    const updatedSession = {
      ...existingSession,
      ...updates,
      lastActive: Date.now()
    };

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
    return (now - session.lastActive) > SESSION_DURATION;
  }

  static renewSession(): void {
    const session = this.loadSession();
    if (session) {
      this.updateSession({ lastActive: Date.now() });
    }
  }

  static getSessionInfo(): { isActive: boolean; timeRemaining: number } {
    const session = this.loadSession();
    if (!session) {
      return { isActive: false, timeRemaining: 0 };
    }

    const timeRemaining = SESSION_DURATION - (Date.now() - session.lastActive);
    return {
      isActive: timeRemaining > 0,
      timeRemaining: Math.max(0, timeRemaining)
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