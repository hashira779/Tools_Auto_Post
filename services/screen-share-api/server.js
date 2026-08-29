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
    origin: '*', // In production, we could restrict this to the exact domain
    methods: ['GET', 'POST']
  },
  // We specify path here if needed, but by default it's /socket.io/
  // and Nginx will proxy /socket.io/ to this container.
});

// Store room metadata to handle cleanup and state
// roomId -> { createdAt, presenter: socketId, viewer: socketId, status }
const rooms = new Map();

const ROOM_EXPIRATION_MS = parseInt(process.env.ROOM_EXPIRATION_MINUTES || '30') * 60 * 1000;

// Cleanup stale rooms periodically (every 5 mins)
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.createdAt > ROOM_EXPIRATION_MS) {
      // Notify anyone left in the room
      io.to(roomId).emit('room-expired');
      io.in(roomId).socketsLeave(roomId);
      rooms.delete(roomId);
      console.log(`[CLEANUP] Room ${roomId} expired.`);
    }
  }
}, 5 * 60 * 1000);

io.on('connection', (socket) => {
  console.log(`[CONNECT] Client connected: ${socket.id}`);

  // PC Viewer creating/joining a room
  socket.on('create-room', ({ roomId }) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        createdAt: Date.now(),
        viewer: socket.id,
        presenter: null,
        status: 'waiting'
      });
      console.log(`[ROOM] PC created room: ${roomId}`);
    } else {
      const room = rooms.get(roomId);
      room.viewer = socket.id; // Update viewer if reconnected
      console.log(`[ROOM] PC rejoined room: ${roomId}`);
    }
    
    // If the presenter is already here (e.g. PC refreshed but phone is still connected)
    const currentRoom = rooms.get(roomId);
    if (currentRoom.presenter) {
      io.to(roomId).emit('presenter-status', { connected: true });
    }
  });

  // Mobile Presenter joining a room
  socket.on('join-room-presenter', ({ roomId }) => {
    const room = rooms.get(roomId);
    
    // Ensure room exists
    if (!room) {
      socket.emit('error', { message: 'Room not found or expired.' });
      return;
    }

    // Check if another presenter is already active
    if (room.presenter && room.presenter !== socket.id) {
      // For simplicity, we just allow the new presenter to take over
      // Or we can reject. Let's allow takeover in case of mobile refresh
      io.to(room.presenter).emit('error', { message: 'Another device took over this session.' });
    }

    socket.join(roomId);
    room.presenter = socket.id;
    room.status = 'connected';
    
    console.log(`[ROOM] Mobile joined room: ${roomId}`);
    
    // Notify the PC viewer that the presenter is connected
    socket.to(roomId).emit('presenter-status', { connected: true });
  });

  // Relay WebRTC signaling: Offer
  socket.on('webrtc-offer', ({ roomId, offer }) => {
    console.log(`[WEBRTC] Offer from ${socket.id} to room ${roomId}`);
    // The presenter sends the offer, relay to the viewer
    socket.to(roomId).emit('webrtc-offer', offer);
  });

  // Relay WebRTC signaling: Answer
  socket.on('webrtc-answer', ({ roomId, answer }) => {
    console.log(`[WEBRTC] Answer from ${socket.id} to room ${roomId}`);
    // The viewer sends the answer, relay to the presenter
    socket.to(roomId).emit('webrtc-answer', answer);
  });

  // Relay ICE Candidates
  socket.on('ice-candidate', ({ roomId, candidate }) => {
    console.log(`[WEBRTC] ICE Candidate from ${socket.id} to room ${roomId}`);
    socket.to(roomId).emit('ice-candidate', candidate);
  });

  // Presenter stopped sharing explicitly
  socket.on('stop-sharing', ({ roomId }) => {
    console.log(`[ROOM] Presenter stopped sharing in room: ${roomId}`);
    socket.to(roomId).emit('presenter-stopped');
  });

  // Handle Disconnection
  socket.on('disconnect', () => {
    console.log(`[DISCONNECT] Client disconnected: ${socket.id}`);
    
    // Find if the disconnected socket was a viewer or presenter in any room
    for (const [roomId, room] of rooms.entries()) {
      if (room.viewer === socket.id) {
        room.viewer = null;
        console.log(`[ROOM] Viewer left room: ${roomId}`);
        // If viewer leaves, we could notify presenter, but often viewer just reloads.
      }
      if (room.presenter === socket.id) {
        room.presenter = null;
        console.log(`[ROOM] Presenter left room: ${roomId}`);
        // Notify viewer that presenter disconnected (maybe temporarily)
        io.to(roomId).emit('presenter-status', { connected: false });
      }
      
      // If both are gone, maybe clean up immediately or let the timeout handle it.
      // We'll let the timeout handle it in case of transient network drops.
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Screen Share Signaling API listening on port ${PORT}`);
});
