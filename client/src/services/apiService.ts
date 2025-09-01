// client/src/services/apiService.ts

import { Photo, Player, GameInfo } from '../types/game';

const API_BASE = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export class ApiService {
  static async createGame(): Promise<{ success: boolean; gameId?: string; topics?: string[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE}/games`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Failed to create game' };
    }
  }

  static async getGame(gameId: string): Promise<{ success: boolean; game?: GameInfo; message?: string }> {
    try {
      const response = await fetch(`${API_BASE}/games/${gameId}`);
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Failed to get game info' };
    }
  }

  static async joinGame(gameId: string, playerName: string, playerId: string): Promise<{ success: boolean; player?: Player; message?: string }> {
    try {
      const response = await fetch(`${API_BASE}/games/${gameId}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName,
          playerId
        }),
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Failed to generate share text' };
    }
  }

  static async syncPlayerState(gameId: string, playerId: string): Promise<{ success: boolean; player?: Player; message?: string }> {
    try {
      // Get fresh player data from server
      const photosResponse = await this.getPlayerPhotos(gameId, playerId);
      if (!photosResponse.success || !photosResponse.photos) {
        return { success: false, message: 'Failed to sync player state' };
      }

      // Also get game info to ensure player still exists
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