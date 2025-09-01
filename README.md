# Life4Today - Photo Challenge Game

A multiplayer photo challenge game where players get 4 random topics from a pool of 11 and create photo collages to share their daily life.

## Features

- **Multiplayer Support**: Multiple players can join the same game and see each other's progress
- **Host Naming**: Game creators can set their name when creating a new game
- **Topic Management**: 
  - Players get 4 random topics from 11 available categories
  - Lock favorite topics to keep them during shuffles
  - Automatically lock topics when photos are uploaded
  - Shuffle individual topics or all unlocked topics
- **Real-time Progress**: See other players' completion status
- **Photo Upload**: Upload photos for assigned topics
- **Collage Generation**: Create beautiful collages when all 4 topics are completed
- **Social Sharing**: Share completion status or progress reminders
- **URL Sharing**: Games can be joined via URL with game ID parameter

## Topics Available

1. food
2. ootd (outfit of the day)
3. cute animals
4. trending topics
5. selfies
6. views
7. drinks
8. watching/listening
9. quote of the day
10. workstation
11. transportation

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd life4today-app
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

3. **Development Setup**
   ```bash
   # Run both server and client in development mode
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:3001`
   - Frontend React app on `http://localhost:3000`

4. **Production Build**
   ```bash
   # Build the application
   npm run build
   
   # Start production server
   npm start
   ```

### Available Scripts

- `npm run dev` - Run both server and client in development mode
- `npm run server:dev` - Run only the backend server in development
- `npm run client:dev` - Run only the frontend client in development
- `npm run build` - Build both server and client for production
- `npm run server:build` - Build only the server
- `npm run client:build` - Build only the client
- `npm start` - Start the production server
- `npm run setup` - Install all dependencies (root and client)

## How to Play

### Creating a Game (Host)

1. Enter your name in the "Your Name" field
2. Click "Create New Game"
3. You'll be assigned 4 random topics from the 11 available
4. Share the Game ID with friends so they can join

### Joining a Game

1. Get the Game ID from the host
2. Enter the Game ID and your name
3. Click "Join Game"
4. You'll get your own set of 4 random topics

### Managing Topics

- **Lock Topics**: Click the heart icon to lock topics you like
- **Shuffle Topics**: Use the shuffle button to replace unlocked topics with new random ones
- **Individual Shuffle**: Click the small shuffle icon on each topic to replace just that one
- **Auto-Lock**: Topics are automatically locked when you upload a photo for them

### Uploading Photos

1. Click on a topic card to select it
2. Click "Upload Photo" to choose an image from your device
3. The photo will be uploaded and the topic will be automatically locked
4. Repeat for all 4 topics

### Viewing Progress

- See your completion status (X/4 completed)
- View other players' progress in the summary bar
- Click "View Others" to see detailed progress of all players
- Players can see each other's progress once they've uploaded at least one photo

### Generating Collage

- Once all 4 topics are completed, you can generate a collage
- Click "Generate Collage" to create your Life4Today collage
- Download the collage as a PNG file

### Sharing

- Share completion status when all 4 topics are done
- Share progress reminders to encourage friends
- Game URLs include the Game ID for easy joining

## Technical Details

### Backend (Node.js/Express)

- **File Storage**: Photos are stored locally in the `uploads` directory
- **Memory Storage**: Game data is stored in memory (use a database for production)
- **Auto Cleanup**: Games older than 24 hours are automatically cleaned up
- **File Limits**: 5MB maximum file size for photos
- **API Endpoints**: RESTful API for game management, player actions, and photo uploads

### Frontend (React/TypeScript)

- **State Management**: React hooks for local state management
- **Styling**: Tailwind CSS for responsive design
- **Icons**: Lucide React for consistent iconography
- **Canvas**: HTML5 Canvas for collage generation
- **Real-time Updates**: Periodic polling for multiplayer updates

### File Structure

```
life4today-app/
├── server.ts              # Backend server
├── package.json           # Root package.json
├── tsconfig.json          # TypeScript config
├── client/                # React frontend
│   ├── src/
│   │   ├── App.tsx        # Main React component
│   │   ├── index.tsx      # React entry point
│   │   └── index.css      # Tailwind CSS
│   ├── public/
│   │   └── index.html     # HTML template
│   ├── package.json       # Client dependencies
│   └── tailwind.config.js # Tailwind configuration
├── uploads/               # Photo storage (created automatically)
└── README.md             # This file
```

## Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

## Production Deployment

1. Build the application: `npm run build`
2. Set `NODE_ENV=production`
3. Start the server: `npm start`
4. The server will serve both API and static files

## Game Mechanics

- **Topics**: Each player gets 4 unique random topics
- **Completion**: Players must upload 1 photo for each of their 4 topics
- **Multiplayer**: Multiple players can join the same game with different topic sets
- **Progress Tracking**: Real-time progress updates for all players
- **Topic Locking**: Prevent favorite topics from being shuffled away
- **Collage Generation**: Automatic collage creation upon completion

## Future Enhancements

- Database integration for persistent storage
- Real-time WebSocket updates
- Photo filters and editing
- Custom topic creation
- Tournament/competition modes
- Social media integration
- Mobile app version
