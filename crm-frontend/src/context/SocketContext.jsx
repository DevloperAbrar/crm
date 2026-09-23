import React, { createContext, useEffect, useState, useContext } from 'react';
import { connectSocket, disconnectSocket } from '../lib/socket/socketClient.js';
import { AuthContext } from './AuthContext.jsx';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('accessToken');
      const s = connectSocket(token);
      setSocket(s);
    } else {
      disconnectSocket();
      setSocket(null);
    }

    return () => {
      if (!isAuthenticated) disconnectSocket();
    };
  }, [isAuthenticated]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}
