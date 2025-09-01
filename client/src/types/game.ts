// client/src/types/game.ts

export interface Photo {
  id: string;
  filename: string;
  url: string;
  topic: string;
  uploadedAt: string;
}

export interface Player {
  id: string;
  name: string;
  photos: Photo[];
  completedTopics: string[];
  photoCount: number;
  lastActive: string;
}

export interface GameInfo {
  id: string;
  players: Player[];
  topics: string[];
}

export type Topic = 
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

export const ALL_TOPICS: Topic[] = [
  'food', 'ootd', 'cute animals', 'trending topics', 'selfies', 
  'views', 'drinks', 'watching/listening', 'quote of the day', 
  'workstation', 'transportation'
];

export type GameState = 'setup' | 'playing' | 'viewing';