// client/src/index.tsx (rename from index.ts to index.tsx)

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Life4TodayApp from './App.tsx';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Life4TodayApp />
  </React.StrictMode>
);