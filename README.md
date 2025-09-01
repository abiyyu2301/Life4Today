# Life4Today - Photo Challenge Game

A multiplayer photo challenge game where players get 4 random topics from a pool of 11 and create photo collages to share their daily life.

## Features

- **Session Persistence**: User sessions are saved locally and auto-restore on page refresh
  - Sessions last 4 hours and can be renewed
  - Automatic session restoration when returning to the app
  - Manual sync button to synchronize with server state
  - Session timeout warnings and renewal options
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
- **State Synchronization**: Manual sync button to ensure data consistency with server

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

## Session Management

### Automatic Session Persistence

- **Local Storage**: User sessions are automatically saved to browser's local storage
- **4-Hour Duration**: Sessions remain active for 4 hours from last activity
- **Auto-Restore**: When you refresh the page or return to the app, your session is automatically restored
- **Session Info Display**: Shows remaining session time with visual indicators

### Session Features

- **Manual Sync**: Click the "Sync" button to ensure your local state matches the server
- **Session Renewal**: Extend your session for another 4 hours when it's about to expire
- **Session Termination**: Manually end your session with the "End" button
- **Cross-Tab Support**: Sessions work across multiple browser tabs
- **Data Integrity**: Automatic validation ensures session data matches server state

### Session Data Stored

- Game ID and player information
- Selected topics and lock preferences
- Session creation and last activity timestamps
- Player name and preferences

### Session States

- **Active Session**: Green indicator, full functionality
- **Expiring Soon**: Orange indicator (< 30 minutes), shows renewal option
- **Expired**: Session automatically cleared, returns to setup screen

## How to Play

### Session Restoration

1. If you have a valid session when you visit the app, you'll see a "Previous Session Found" banner
2. Click "Continue" to restore your game state
3. Your topics, progress, and game will be automatically loaded
4. Use the "Sync" button if you need to refresh your data from the server

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

- **Session Management**: Persistent sessions with 4-hour duration using localStorage
- **Component Architecture**: Modular components for better maintainability
- **Custom Hooks**: Separate hooks for session management and game logic
- **Service Layer**: Dedicated API service for all server communications
- **State Management**: React hooks with session persistence
- **Styling**: Tailwind CSS for responsive design
- **Icons**: Lucide React for consistent iconography
- **Canvas**: HTML5 Canvas for collage generation
- **Real-time Updates**: Periodic polling for multiplayer updates with manual sync option

### Architecture Overview

- **Types**: Centralized TypeScript types in `types/game.ts`
- **Services**: API communication abstracted in `services/apiService.ts`
- **Hooks**: Custom hooks for session (`useSession`) and game logic (`useGameLogic`)
- **Utils**: Session management utility with localStorage integration
- **Components**: Reusable UI components for session info and topic management

### File Structure

```
life4today-app/
├── server.ts              # Backend server
├── package.json           # Root package.json
├── tsconfig.json          # TypeScript config
├── client/                # React frontend
│   ├── src/
│   │   ├── App.tsx        # Main React component (refactored)
│   │   ├── index.tsx      # React entry point
│   │   ├── index.css      # Tailwind CSS
│   │   ├── types/
│   │   │   └── game.ts    # Game-related TypeScript types
│   │   ├── services/
│   │   │   └── apiService.ts  # API communication service
│   │   ├── hooks/
│   │   │   ├── useSession.ts     # Session management hook
│   │   │   └── useGameLogic.ts   # Game logic hook
│   │   ├── utils/
│   │   │   └── sessionManager.ts # Session persistence utility
│   │   └── components/
│   │       ├── SessionInfo.tsx   # Session status component
│   │       └── TopicManager.tsx  # Topic management component
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

- **Session Persistence**: 4-hour sessions with automatic restoration on page refresh
- **Topics**: Each player gets 4 unique random topics
- **Completion**: Players must upload 1 photo for each of their 4 topics
- **Multiplayer**: Multiple players can join the same game with different topic sets
- **Progress Tracking**: Real-time progress updates for all players
- **Topic Locking**: Prevent favorite topics from being shuffled away
- **Collage Generation**: Automatic collage creation upon completion
- **State Synchronization**: Manual sync to ensure data consistency with server
- **Session Management**: Renewable sessions with expiration warnings

## Future Enhancements

- Database integration for persistent storage
- Real-time WebSocket updates instead of polling
- Push notifications for session expiration warnings
- Cross-device session synchronization
- Photo filters and editing
- Custom topic creation
- Tournament/competition modes
- Social media integration
- Mobile app version
- Offline mode with sync when online
- Session sharing between devices
- Advanced session analytics
