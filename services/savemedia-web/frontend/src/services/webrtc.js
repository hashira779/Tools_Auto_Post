import { socket } from './socket';

const getIceServers = () => {
  const servers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
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
    };
  }

  return pc;
};
