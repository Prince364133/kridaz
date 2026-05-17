import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SOCKET } from '@kridaz/shared-constants/socketEvents';
import { io } from 'socket.io-client';
import { SOCKET } from '@kridaz/shared-constants/socketEvents';
import { useSelector } from 'react-redux';
import { SOCKET } from '@kridaz/shared-constants/socketEvents';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [lastSeenMap, setLastSeenMap] = useState({});
  const { user, token } = useSelector((state) => state.auth);
  const ENDPOINT = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (user && token) {
      const newSocket = io(ENDPOINT, {
        auth: {
          token: token
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        newSocket.emit('setup', user);
      });

      newSocket.on('connected', () => {
        console.log('Socket confirmed setup');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      // Track online users
      newSocket.on('online users', (users) => {
        setOnlineUsers(users);
      });

      // Track last seen
      newSocket.on('user last seen', ({ userId, lastSeen }) => {
        setLastSeenMap(prev => ({ ...prev, [userId]: lastSeen }));
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, token, ENDPOINT]);

  const isUserOnline = useCallback((userId) => {
    return onlineUsers.includes(userId);
  }, [onlineUsers]);

  const getLastSeen = useCallback((userId) => {
    return lastSeenMap[userId] || null;
  }, [lastSeenMap]);

  const updateLocation = useCallback((lat, lng) => {
    if (socket) {
      socket.emit(SOCKET.UPDATE_LOCATION, { lat, lng });
    }
  }, [socket]);

  const value = {
    socket,
    onlineUsers,
    isUserOnline,
    getLastSeen,
    lastSeenMap,
    updateLocation,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
