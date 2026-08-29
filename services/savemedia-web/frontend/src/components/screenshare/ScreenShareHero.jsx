import { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { socket, connectSocket } from '../../services/socket';
import { createPeerConnection } from '../../services/webrtc';
import VideoPreview from './VideoPreview';
import { Copy, RefreshCw } from 'lucide-react';

const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export default function ScreenShareHero() {
  const [roomId, setRoomId] = useState('');
  const [status, setStatus] = useState('Waiting for phone...');
  const [stream, setStream] = useState(null);
  const [pcState, setPcState] = useState('new');
  
  const pcRef = useRef(null);

  useEffect(() => {
    initSession();
    return () => cleanupSession();
  }, []);

  const initSession = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    setStatus('Waiting for phone...');
    setStream(null);
    setPcState('new');
    
    connectSocket();
    
    socket.emit('create-room', { roomId: newRoomId });

    socket.on('presenter-status', ({ connected }) => {
      if (connected) {
        setStatus('Phone connected. Waiting for stream...');
      } else {
        setStatus('Phone disconnected.');
        if (pcRef.current) pcRef.current.close();
      }
    });

    socket.on('webrtc-offer', async (offer) => {
      setStatus('Connecting WebRTC...');
      pcRef.current = createPeerConnection(newRoomId, (trackStream) => {
        setStream(trackStream);
        setStatus('LIVE');
      }, (state) => {
        setPcState(state);
        if (state === 'disconnected' || state === 'failed') {
          setStatus('Connection lost');
        } else if (state === 'connected') {
          setStatus('LIVE');
        }
      });

      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit('webrtc-answer', { roomId: newRoomId, answer });
    });

    socket.on('ice-candidate', async (candidate) => {
      if (pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error(e);
        }
      }
    });
    
    socket.on('presenter-stopped', () => {
      setStatus('Screen sharing stopped.');
      setStream(null);
      if (pcRef.current) pcRef.current.close();
    });
  };

  const cleanupSession = () => {
    socket.off('presenter-status');
    socket.off('webrtc-offer');
    socket.off('ice-candidate');
    socket.off('presenter-stopped');
    if (pcRef.current) pcRef.current.close();
  };

  const handleRecreate = () => {
    cleanupSession();
    initSession();
  };

  const copyLink = () => {
    const url = `${window.location.origin}/share/${roomId}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8 animate-fade-in">
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-text)]">
          Live iPhone Screen Share
        </h1>
        <p className="text-lg text-[var(--color-text-3)] max-w-2xl mx-auto">
          Present your iPhone screen directly to your PC browser in real-time. No apps required.
        </p>
      </div>

      {stream ? (
        <div className="w-full flex flex-col items-center gap-4">
          <div className="w-full flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
              <span className="font-semibold text-green-500 tracking-wider">LIVE</span>
            </div>
            <button 
              onClick={handleRecreate}
              className="px-4 py-2 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> End Session
            </button>
          </div>
          <VideoPreview stream={stream} connectionState={pcState} />
        </div>
      ) : (
        <div className="card p-8 md:p-12 w-full max-w-md flex flex-col items-center text-center gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-[var(--color-primary-500)]/10 blur-3xl rounded-full"></div>

          <div className="relative z-10 space-y-2">
            <h2 className="text-xl font-bold">Connect your iPhone</h2>
            <p className="text-sm text-[var(--color-text-3)]">Scan this QR code with your iPhone camera to join Room: <strong>{roomId}</strong></p>
          </div>

          <div className="bg-white p-4 rounded-2xl relative z-10 shadow-lg ring-1 ring-black/5">
            <QRCode 
              value={`${window.location.origin}/share/${roomId}`}
              size={200}
              level="H"
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          <div className="flex flex-col items-center gap-3 w-full relative z-10">
            <div className="flex items-center gap-2 text-[var(--color-primary)] bg-[var(--color-primary-500)]/10 px-4 py-2 rounded-full font-medium text-sm">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-ping"></span>
              {status}
            </div>

            <div className="flex gap-2 mt-2">
              <button onClick={copyLink} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] transition-colors text-sm font-medium text-[var(--color-text-2)]">
                <Copy className="w-4 h-4" /> Copy Link
              </button>
              <button onClick={handleRecreate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] transition-colors text-sm font-medium text-[var(--color-text-2)]">
                <RefreshCw className="w-4 h-4" /> New Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
