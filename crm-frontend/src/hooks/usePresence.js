import { useContext } from 'react';
import { PresenceContext } from '../context/PresenceContext.jsx';

/**
 * Returns isOnline(userId, fallback) - checks the live socket-driven set
 * first, and falls back to whatever the initial API fetch said (e.g.
 * member.isOnline from GET /api/users) if no live update has arrived yet
 * for that user this session.
 */
export function usePresence() {
  const onlineIds = useContext(PresenceContext);

  const isOnline = (userId, fallback = false) => {
    if (!userId) return false;
    return onlineIds?.has(String(userId)) ?? fallback;
  };

  return { isOnline };
}
