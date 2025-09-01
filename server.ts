// Backend: Node.js/Express TypeScript API
// Save as server.ts

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Types
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
  lastActive: string;
}

interface Game {
  id: string;
  players: Player[];
  createdAt: string;
  lastActivity: string;
}

// In-memory storage (replace with database in production)
const games: Map<string, Game> = new Map();
const topics = [
  'food', 'ootd', 'cute animals', 'trending topics', 'selfies', 
  'views', 'drinks', 'watching/listening', 'quote of the day', 
  'workstation', 'transportation'
];

// Helper functions
const generateGameId = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const cleanupOldGames = () => {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  for (const [gameId, game] of games.entries()) {
    if (now - new Date(game.lastActivity).getTime() > dayInMs) {
      // Clean up associated files
      game.players.forEach(player => {
        player.photos.forEach(photo => {
          const filePath = path.join('uploads', photo.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      });
      games.delete(gameId);
    }
  }
};

// Clean up old games every hour
setInterval(cleanupOldGames, 60 * 60 * 1000);

// API Routes

// Create new game
app.post('/api/games', (req, res) => {
  const gameId = generateGameId();
  const newGame: Game = {
    id: gameId,
    players: [],
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };
  
  games.set(gameId, newGame);
  
  res.json({
    success: true,
    gameId,
    topics
  });
});

// Get game info
app.get('/api/games/:gameId', (req, res) => {
  const { gameId } = req.params;
  const game = games.get(gameId);
  
  if (!game) {
    return res.status(404).json({ success: false, message: 'Game not found' });
  }
  
  res.json({
    success: true,
    game: {
      id: game.id,
      players: game.players.map(player => ({
        id: player.id,
        name: player.name,
        photoCount: player.photos.length,
        completedTopics: player.photos.map(p => p.topic),
        lastActive: player.lastActive
      })),
      topics
    }
  });
});

// Join game / Update player
app.post('/api/games/:gameId/players', (req, res) => {
  const { gameId } = req.params;
  const { playerName, playerId } = req.body;
  
  const game = games.get(gameId);
  if (!game) {
    return res.status(404).json({ success: false, message: 'Game not found' });
  }
  
  let player = game.players.find(p => p.id === playerId);
  
  if (!player) {
    player = {
      id: playerId || uuidv4(),
      name: playerName,
      photos: [],
      lastActive: new Date().toISOString()
    };
    game.players.push(player);
  } else {
    player.name = playerName;
    player.lastActive = new Date().toISOString();
  }
  
  game.lastActivity = new Date().toISOString();
  
  res.json({
    success: true,
    player: {
      id: player.id,
      name: player.name,
      photos: player.photos
    }
  });
});

// Upload photo
app.post('/api/games/:gameId/players/:playerId/photos', upload.single('photo'), (req, res) => {
  const { gameId, playerId } = req.params;
  const { topic } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No photo uploaded' });
  }
  
  if (!topics.includes(topic)) {
    return res.status(400).json({ success: false, message: 'Invalid topic' });
  }
  
  const game = games.get(gameId);
  if (!game) {
    return res.status(404).json({ success: false, message: 'Game not found' });
  }
  
  const player = game.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ success: false, message: 'Player not found' });
  }
  
  // Remove existing photo for this topic
  const existingPhotoIndex = player.photos.findIndex(p => p.topic === topic);
  if (existingPhotoIndex !== -1) {
    const oldPhoto = player.photos[existingPhotoIndex];
    const oldFilePath = path.join('uploads', oldPhoto.filename);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }
    player.photos.splice(existingPhotoIndex, 1);
  }
  
  // Add new photo
  const newPhoto: Photo = {
    id: uuidv4(),
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`,
    topic,
    uploadedAt: new Date().toISOString()
  };
  
  player.photos.push(newPhoto);
  player.lastActive = new Date().toISOString();
  game.lastActivity = new Date().toISOString();
  
  res.json({
    success: true,
    photo: newPhoto
  });
});

// Get player photos
app.get('/api/games/:gameId/players/:playerId/photos', (req, res) => {
  const { gameId, playerId } = req.params;
  
  const game = games.get(gameId);
  if (!game) {
    return res.status(404).json({ success: false, message: 'Game not found' });
  }
  
  const player = game.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ success: false, message: 'Player not found' });
  }
  
  res.json({
    success: true,
    photos: player.photos
  });
});

// Delete photo
app.delete('/api/games/:gameId/players/:playerId/photos/:photoId', (req, res) => {
  const { gameId, playerId, photoId } = req.params;
  
  const game = games.get(gameId);
  if (!game) {
    return res.status(404).json({ success: false, message: 'Game not found' });
  }
  
  const player = game.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ success: false, message: 'Player not found' });
  }
  
  const photoIndex = player.photos.findIndex(p => p.id === photoId);
  if (photoIndex === -1) {
    return res.status(404).json({ success: false, message: 'Photo not found' });
  }
  
  const photo = player.photos[photoIndex];
  const filePath = path.join('uploads', photo.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  
  player.photos.splice(photoIndex, 1);
  player.lastActive = new Date().toISOString();
  game.lastActivity = new Date().toISOString();
  
  res.json({ success: true });
});

// Generate share text
app.post('/api/games/:gameId/players/:playerId/share', (req, res) => {
  const { gameId, playerId } = req.params;
  const { type } = req.body; // 'completed' or 'reminder'
  
  const game = games.get(gameId);
  if (!game) {
    return res.status(404).json({ success: false, message: 'Game not found' });
  }
  
  const player = game.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ success: false, message: 'Player not found' });
  }
  
  const completedTopics = player.photos.map(p => p.topic);
  const missingTopics = topics.filter(topic => !completedTopics.includes(topic));
  
  let shareText = '';
  
  if (type === 'completed') {
    shareText = `🎯 Life4Today Challenge Complete! 
Game ID: ${gameId}
Player: ${player.name}
✅ Completed all ${completedTopics.length}/11 topics!

Join the fun: ${req.headers.origin || 'your-app-url'}?game=${gameId}`;
  } else {
    shareText = `📸 Life4Today Reminder!
Game ID: ${gameId}
Player: ${player.name}

Still need photos for:
${missingTopics.map(topic => `❌ ${topic}`).join('\n')}

Completed: ${completedTopics.length}/11
Join the game: ${req.headers.origin || 'your-app-url'}?game=${gameId}`;
  }
  
  res.json({
    success: true,
    shareText,
    completedCount: completedTopics.length,
    missingCount: missingTopics.length
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Life4Today API is running!',
    activeGames: games.size
  });
});

// Error handling
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

app.listen(PORT, () => {
  console.log(`Life4Today server running on port ${PORT}`);
});

export default app;