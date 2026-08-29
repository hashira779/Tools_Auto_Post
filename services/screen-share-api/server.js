const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// roomId -> Set(socketIds)
const rooms = new Map();
const socketToRoom = new Map();

io.on('connection', (socket) => {
  console.log(`[CONNECT] Client connected: ${socket.id}`);

  // Join a multiparty room
  socket.on('join-room', ({ roomId }) => {
    socket.join(roomId);
    socketToRoom.set(socket.id, roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    
    const room = rooms.get(roomId);
    const existingUsers = Array.from(room);
    
    // Add the new user
    room.add(socket.id);
    console.log(`[ROOM] User ${socket.id} joined room ${roomId}. Total users: ${room.size}`);

    // Tell the new user who else is in the room so they can expect offers or initiate them
    // In Full Mesh, usually the newly joined user receives offers from everyone already there.
    socket.emit('all-users', existingUsers);

    // Tell everyone else that a new user joined
    socket.to(roomId).emit('user-joined', { userId: socket.id });
  });

  // WebRTC Signaling: Offer
  socket.on('webrtc-offer', ({ targetId, callerId, offer }) => {
    console.log(`[WEBRTC] Offer from ${callerId} to ${targetId}`);
    io.to(targetId).emit('webrtc-offer', { callerId, offer });
  });

  // WebRTC Signaling: Answer
  socket.on('webrtc-answer', ({ targetId, callerId, answer }) => {
    console.log(`[WEBRTC] Answer from ${callerId} to ${targetId}`);
    io.to(targetId).emit('webrtc-answer', { callerId, answer });
  });

  // WebRTC Signaling: ICE Candidate
  socket.on('ice-candidate', ({ targetId, callerId, candidate }) => {
    io.to(targetId).emit('ice-candidate', { callerId, candidate });
  });

  // Real-time Chat
  socket.on('chat-message', ({ roomId, message, senderId, senderName }) => {
    // Broadcast to everyone in the room, including sender
    io.to(roomId).emit('chat-message', {
      id: Date.now().toString(),
      message,
      senderId,
      senderName,
      timestamp: Date.now()
    });
  });

  // Real-time Reactions (floating emojis)
  socket.on('room-reaction', ({ roomId, emoji, senderId }) => {
    // Broadcast to everyone in the room
    io.to(roomId).emit('room-reaction', {
      id: Date.now().toString() + Math.random(),
      emoji,
      senderId
    });
  });

  // Disconnect Handling
  socket.on('disconnect', () => {
    console.log(`[DISCONNECT] Client disconnected: ${socket.id}`);
    const roomId = socketToRoom.get(socket.id);
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        room.delete(socket.id);
        socketToRoom.delete(socket.id);
        
        // Notify others that this user left
        io.to(roomId).emit('user-left', { userId: socket.id });
        console.log(`[ROOM] User ${socket.id} left room ${roomId}. Remaining: ${room.size}`);
        
        if (room.size === 0) {
          rooms.delete(roomId);
          console.log(`[CLEANUP] Room ${roomId} deleted (empty).`);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Multiparty Signaling API listening on port ${PORT}`);
});
