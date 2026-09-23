import { useContext, useEffect, useRef } from 'react';
import { SocketContext } from '../context/SocketContext.jsx';

export function useSocket() {
  return useContext(SocketContext);
}

// Convenience hook to subscribe to a single socket event with automatic cleanup.
//
// Uses a ref for the handler so pages that pass an inline arrow function
// (e.g. `useSocketEvent('x', (payload) => { ... })`) don't tear down and
// re-attach the listener on every render - only `socket` or `eventName`
// changing does that. This matters more now that pages like
// LeadProfilePage attach several of these on one screen.
export function useSocketEvent(eventName, handler) {
  const socket = useSocket();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!socket) return undefined;
    const wrapped = (...args) => handlerRef.current(...args);
    socket.on(eventName, wrapped);
    return () => socket.off(eventName, wrapped);
  }, [socket, eventName]);
}
