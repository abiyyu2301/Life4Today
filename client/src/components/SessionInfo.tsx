// client/src/components/SessionInfo.tsx

import React from 'react';
import { Clock, RefreshCw, LogOut } from 'lucide-react';

interface SessionInfoProps {
  timeRemaining: number;
  onSync: () => void;
  onRenew: () => void;
  onClear: () => void;
  isSyncing?: boolean;
  formatTime: (ms: number) => string;
}

export const SessionInfo: React.FC<SessionInfoProps> = ({
  timeRemaining,
  onSync,
  onRenew,
  onClear,
  isSyncing = false,
  formatTime
}) => {
  const isLowTime = timeRemaining < 30 * 60 * 1000; // Less than 30 minutes

  return (
    <div className={`rounded-xl p-3 ${isLowTime ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={16} className={isLowTime ? 'text-orange-600' : 'text-green-600'} />
          <span className={`text-sm font-medium ${isLowTime ? 'text-orange-700' : 'text-green-700'}`}>
            Session: {formatTime(timeRemaining)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-1 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Sync with server"
          >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>
          
          {isLowTime && (
            <button
              onClick={onRenew}
              className="flex items-center gap-1 text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
              title="Renew session for 4 more hours"
            >
              <Clock size={12} />
              Renew
            </button>
          )}
          
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
            title="End session"
          >
            <LogOut size={12} />
            End
          </button>
        </div>
      </div>
      
      {isLowTime && (
        <p className="text-xs text-orange-600 mt-1">
          ⚠️ Session expires soon. Click "Renew" to extend for 4 more hours.
        </p>
      )}
    </div>
  );
};