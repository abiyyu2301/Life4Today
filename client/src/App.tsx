// client/src/App.tsx

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Camera, Share2, Check, X, Download } from 'lucide-react';

interface Photo {
  id: string;
  file: File;
  url: string;
  topic: string;
}

interface Player {
  id: string;
  name: string;
  photos: Photo[];
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

const TOPICS: Topic[] = [
  'food', 'ootd', 'cute animals', 'trending topics', 'selfies', 
  'views', 'drinks', 'watching/listening', 'quote of the day', 
  'workstation', 'transportation'
];

const Life4TodayApp: React.FC = () => {
  const [gameId, setGameId] = useState<string>('');
  const [currentPlayer, setCurrentPlayer] = useState<Player>({
    id: '',
    name: '',
    photos: []
  });
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'viewing'>('setup');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize new game
  const createGame = useCallback(() => {
    const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGameId(newGameId);
    setGameState('playing');
  }, []);

  // Join existing game
  const joinGame = useCallback((id: string, playerName: string) => {
    setGameId(id);
    setCurrentPlayer(prev => ({ ...prev, name: playerName, id: Date.now().toString() }));
    setGameState('playing');
  }, []);

  // Handle photo upload
  const handlePhotoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedTopic) {
      const photoUrl = URL.createObjectURL(file);
      const newPhoto: Photo = {
        id: Date.now().toString(),
        file,
        url: photoUrl,
        topic: selectedTopic
      };

      setCurrentPlayer(prev => ({
        ...prev,
        photos: [...prev.photos.filter(p => p.topic !== selectedTopic), newPhoto]
      }));
      setSelectedTopic(null);
    }
  }, [selectedTopic]);

  // Get completed topics for current player
  const getCompletedTopics = useCallback((): Topic[] => {
    return currentPlayer.photos.map(photo => photo.topic as Topic);
  }, [currentPlayer.photos]);

  // Get missing topics
  const getMissingTopics = useCallback((): Topic[] => {
    const completed = getCompletedTopics();
    return TOPICS.filter(topic => !completed.includes(topic));
  }, [getCompletedTopics]);

  // Generate sharing text
  const generateShareText = useCallback((type: 'completed' | 'reminder') => {
    const completed = getCompletedTopics();
    const missing = getMissingTopics();
    
    if (type === 'completed') {
      return `🎯 Life4Today Challenge Complete! 
Game ID: ${gameId}
Player: ${currentPlayer.name}
✅ Completed all ${completed.length}/11 topics!

Join the fun: [Your App URL]?game=${gameId}`;
    } else {
      return `📸 Life4Today Reminder!
Game ID: ${gameId}
Player: ${currentPlayer.name}

Still need photos for:
${missing.map(topic => `❌ ${topic}`).join('\n')}

Completed: ${completed.length}/11
Join the game: [Your App URL]?game=${gameId}`;
    }
  }, [gameId, currentPlayer.name, getCompletedTopics, getMissingTopics]);

  // Generate collage
  const generateCollage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || currentPlayer.photos.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (matching the template proportions)
    canvas.width = 400;
    canvas.height = 600;

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#E91E63');
    gradient.addColorStop(1, '#8E24AA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 600);

    // Define photo positions (top-left, top-right, bottom-left, bottom-right)
    const positions = [
      { x: 20, y: 20, width: 170, height: 240 },
      { x: 210, y: 20, width: 170, height: 240 },
      { x: 20, y: 340, width: 170, height: 240 },
      { x: 210, y: 340, width: 170, height: 240 }
    ];

    // Draw photos
    for (let i = 0; i < Math.min(4, currentPlayer.photos.length); i++) {
      const photo = currentPlayer.photos[i];
      const pos = positions[i];
      
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(pos.x, pos.y, pos.width, pos.height, 10);
        ctx.clip();
        ctx.drawImage(img, pos.x, pos.y, pos.width, pos.height);
        ctx.restore();
        
        // Add topic label
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(pos.x, pos.y + pos.height - 30, pos.width, 30);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(photo.topic, pos.x + 5, pos.y + pos.height - 10);
      };
      img.src = photo.url;
    }

    // Add logo/title
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

  // Download collage
  const downloadCollage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `life4today-${currentPlayer.name}-${gameId}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, [currentPlayer.name, gameId]);

  // Copy share text
  const copyShareText = useCallback((type: 'completed' | 'reminder') => {
    navigator.clipboard.writeText(generateShareText(type));
  }, [generateShareText]);

  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Life4Today
            </h1>
            <p className="text-gray-600 mt-2">Photo Challenge Game</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={createGame}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200"
            >
              Create New Game
            </button>

            <div className="text-center text-gray-500">or</div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Enter Game ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                onChange={(e) => setGameId(e.target.value.toUpperCase())}
              />
              <input
                type="text"
                placeholder="Your Name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                onChange={(e) => setCurrentPlayer(prev => ({ ...prev, name: e.target.value }))}
              />
              <button
                onClick={() => joinGame(gameId, currentPlayer.name)}
                disabled={!gameId || !currentPlayer.name}
                className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Join Game
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 to-purple-600 p-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Life4Today
            </h1>
            <p className="text-gray-600">Game ID: {gameId} | Player: {currentPlayer.name}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-800">
              {getCompletedTopics().length}/11
            </div>
            <div className="text-sm text-gray-600">completed</div>
          </div>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Photo Topics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {TOPICS.map((topic) => {
            const isCompleted = getCompletedTopics().includes(topic);
            return (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  isCompleted
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : selectedTopic === topic
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-gray-200 hover:border-pink-300 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{topic}</span>
                  {isCompleted ? <Check size={16} /> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Photo Upload */}
      {selectedTopic && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            Upload photo for: <span className="text-pink-600 capitalize">{selectedTopic}</span>
          </h3>
          <div className="flex gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <Upload size={20} />
              Upload Photo
            </button>
            <button
              onClick={() => setSelectedTopic(null)}
              className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-all duration-200"
            >
              <X size={20} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Photo Preview Grid */}
      {currentPlayer.photos.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Your Photos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentPlayer.photos.map((photo) => (
              <div key={photo.id} className="relative">
                <img
                  src={photo.url}
                  alt={photo.topic}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {photo.topic}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collage Generation */}
      {currentPlayer.photos.length >= 4 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Generate Collage</h3>
          <div className="flex gap-4 mb-4">
            <button
              onClick={generateCollage}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <Camera size={20} />
              Generate Collage
            </button>
            <button
              onClick={downloadCollage}
              className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-all duration-200"
            >
              <Download size={20} />
              Download
            </button>
          </div>
          <canvas
            ref={canvasRef}
            className="border border-gray-200 rounded-lg max-w-full"
            style={{ maxHeight: '400px' }}
          />
        </div>
      )}

      {/* Sharing Options */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Share Progress</h3>
        <div className="space-y-3">
          <button
            onClick={() => copyShareText('completed')}
            disabled={getCompletedTopics().length < 11}
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Share2 size={20} />
            Share Completion (All Done!)
          </button>
          
          <button
            onClick={() => copyShareText('reminder')}
            disabled={getMissingTopics().length === 0}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Share2 size={20} />
            Share Reminder (Need Help!)
          </button>
        </div>

        {/* Progress Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h4 className="font-semibold text-gray-800 mb-2">Progress Summary</h4>
          <div className="space-y-2">
            <div>
              <span className="text-green-600 font-medium">Completed ({getCompletedTopics().length}):</span>
              <p className="text-sm text-gray-600 mt-1">
                {getCompletedTopics().join(', ') || 'None yet'}
              </p>
            </div>
            {getMissingTopics().length > 0 && (
              <div>
                <span className="text-orange-600 font-medium">Still needed ({getMissingTopics().length}):</span>
                <p className="text-sm text-gray-600 mt-1">
                  {getMissingTopics().join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Life4TodayApp;