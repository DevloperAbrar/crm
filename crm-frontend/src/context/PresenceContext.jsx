import React, { createContext, useEffect, useState, useContext } from 'react';
import { SocketContext } from './SocketContext.jsx';

/**
 * Tracks live online/offline status per user, updated via the
 * 'presence:update' Socket.io event (Section 7). Seeded lazily from
 * whatever `isOnline` value each API response already includes (the User
 * model has always had this field) - this context just keeps it fresh
 * after the initial page load without needing a full re-fetch.
 */
export const PresenceContext = createContext(null);

export function PresenceProvider({ children }) {
  const socket = useContext(SocketContext);
  const [onlineIds, setOnlineIds] = useState(() => new Set());

  useEffect(() => {
    if (!socket) return undefined;

    const handler = ({ userId, isOnline }) => {
      setOnlineIds((prev) => {
        const next = new Set(prev);
        if (isOnline) next.add(String(userId));
        else next.delete(String(userId));
        return next;
      });
    };

    socket.on('presence:update', handler);
    return () => socket.off('presence:update', handler);
  }, [socket]);

  return <PresenceContext.Provider value={onlineIds}>{children}</PresenceContext.Provider>;
}
