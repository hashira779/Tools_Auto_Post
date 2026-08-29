import { io } from 'socket.io-client';

// If deployed, this points to the same host since Nginx proxies /socket.io/
// In local dev, Vite proxy can proxy /socket.io to localhost:4000 if needed, 
// or you can explicitly pass VITE_SOCKET_URL=http://localhost:4000
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
