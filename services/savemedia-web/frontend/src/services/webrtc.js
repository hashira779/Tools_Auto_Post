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

export const createPeerConnection = (roomId, onTrack, onConnectionStateChange) => {
  const pc = new RTCPeerConnection({
    iceServers: getIceServers(),
    iceTransportPolicy: 'all', // can be 'relay' to force TURN for testing
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', { roomId, candidate: event.candidate });
    }
  };

  if (onTrack) {
    pc.ontrack = (event) => {
      onTrack(event.streams[0]);
    };
  }

  if (onConnectionStateChange) {
    pc.onconnectionstatechange = () => {
      onConnectionStateChange(pc.connectionState);
      
      // Auto-recover disconnected states
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.log("WebRTC Connection failed. Attempting ICE Restart...");
        // Re-negotiate with iceRestart
        pc.createOffer({ iceRestart: true })
          .then(offer => {
            return pc.setLocalDescription(offer).then(() => offer);
          })
          .then(offer => {
            socket.emit('webrtc-offer', { roomId, offer });
          })
          .catch(e => console.error("ICE restart failed", e));
      }
    };
  }

  return pc;
};
