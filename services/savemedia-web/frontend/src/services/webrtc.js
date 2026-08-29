import { socket } from './socket';

const getIceServers = () => {
  const servers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:camtech.cam:3478',
      username: 'camtech',
      credential: 'camtech_turn_secret'
    },
    {
      urls: 'turn:camtech.cam:3478?transport=tcp',
      username: 'camtech',
      credential: 'camtech_turn_secret'
    }
  ];
  
  if (import.meta.env.VITE_TURN_URL) {
    servers.push({
      urls: import.meta.env.VITE_TURN_URL,
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    });
  }
  
  return servers;
};

export class MultipartyWebRTC {
  constructor(roomId, localStream, onStreamAdded, onStreamRemoved) {
    this.roomId = roomId;
    this.localStream = localStream;
    this.onStreamAdded = onStreamAdded;
    this.onStreamRemoved = onStreamRemoved;
    this.peers = new Map(); // targetId -> RTCPeerConnection
    this.iceCandidateQueue = new Map(); // targetId -> RTCIceCandidate[]

    this.init();
  }

  processIceQueue(targetId) {
    const pc = this.peers.get(targetId);
    const queue = this.iceCandidateQueue.get(targetId);
    if (pc && pc.remoteDescription && queue) {
      while (queue.length > 0) {
        const candidate = queue.shift();
        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => {
          console.error("Error adding queued ice candidate:", err);
        });
      }
    }
  }

  init() {
    socket.on('all-users', (existingUsers) => {
      console.log("[WEBRTC] Existing users in room:", existingUsers);
      // I am the new guy. I must create an offer for every existing user in the room.
      existingUsers.forEach(userId => {
        this.createPeerConnection(userId, true);
      });
    });

    socket.on('user-joined', ({ userId }) => {
      console.log("[WEBRTC] New user joined:", userId);
      // We don't create the offer here, the new guy will create the offer to us
      // But we CAN prepare a PeerConnection to receive it. (Usually it's created lazily on receiving offer)
    });

    socket.on('webrtc-offer', async ({ callerId, offer }) => {
      console.log(`[WEBRTC] Received offer from ${callerId}`);
      let pc = this.peers.get(callerId);
      if (!pc) {
        pc = this.createPeerConnection(callerId, false);
      }
      
      try {
        await pc.setRemoteDescription(offer);
        await pc.setLocalDescription();
        socket.emit('webrtc-answer', { targetId: callerId, callerId: socket.id, answer: pc.localDescription });
        this.processIceQueue(callerId);
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    });

    socket.on('webrtc-answer', async ({ callerId, answer }) => {
      console.log(`[WEBRTC] Received answer from ${callerId}`);
      const pc = this.peers.get(callerId);
      if (pc) {
        try {
          await pc.setRemoteDescription(answer);
          this.processIceQueue(callerId);
        } catch (err) {
          console.error("Error setting remote description from answer:", err);
        }
      }
    });

    socket.on('ice-candidate', async ({ callerId, candidate }) => {
      const pc = this.peers.get(callerId);
      if (pc) {
        if (!pc.remoteDescription) {
          if (!this.iceCandidateQueue.has(callerId)) {
            this.iceCandidateQueue.set(callerId, []);
          }
          this.iceCandidateQueue.get(callerId).push(candidate);
        } else {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("Error adding ice candidate:", err);
          }
        }
      }
    });

    socket.on('user-left', ({ userId }) => {
      console.log(`[WEBRTC] User left: ${userId}`);
      const pc = this.peers.get(userId);
      if (pc) {
        pc.close();
        this.peers.delete(userId);
      }
      if (this.onStreamRemoved) {
        this.onStreamRemoved(userId);
      }
    });

    // Finally, tell server we want to join
    socket.emit('join-room', { roomId: this.roomId });
  }

  createPeerConnection(targetId, isInitiator) {
    const pc = new RTCPeerConnection({
      iceServers: getIceServers(),
    });

    this.peers.set(targetId, pc);

    // Add local tracks to the connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { targetId, callerId: socket.id, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      console.log(`[WEBRTC] Track received from ${targetId}`);
      if (this.onStreamAdded && event.streams && event.streams[0]) {
        this.onStreamAdded(targetId, event.streams[0]);
      }
    };

    if (isInitiator) {
      pc.createOffer()
        .then(async (offer) => {
          await pc.setLocalDescription(offer);
          socket.emit('webrtc-offer', { targetId, callerId: socket.id, offer: pc.localDescription });
        })
        .catch(err => console.error("Error creating offer:", err));
    }

    return pc;
  }

  destroy() {
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.iceCandidateQueue.clear();
    socket.emit('leave-room', { roomId: this.roomId });
    socket.off('all-users');
    socket.off('user-joined');
    socket.off('webrtc-offer');
    socket.off('webrtc-answer');
    socket.off('ice-candidate');
    socket.off('user-left');
  }
}
