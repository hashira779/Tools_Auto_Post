import { useState, useEffect, useRef } from 'react';
import { socket, connectSocket } from '../../services/socket';
import { createPeerConnection } from '../../services/webrtc';
import { MonitorUp, XCircle, AlertCircle } from 'lucide-react';

export default function MobileShare({ roomId }) {
  const [isSupported, setIsSupported] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [pcState, setPcState] = useState('new');
  
  const streamRef = useRef(null);
  const pcRef = useRef(null);

  useEffect(() => {
    // Check support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setIsSupported(false);
    }
    
    connectSocket();
    socket.emit('join-room-presenter', { roomId });

    socket.on('webrtc-answer', async (answer) => {
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (e) {
          console.error("Failed to set remote description:", e);
        }
      }
    });

    socket.on('ice-candidate', async (candidate) => {
      if (pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Failed to add ice candidate:", e);
        }
      }
    });

    socket.on('error', (err) => {
      setError(err.message);
    });

    return () => {
      socket.off('webrtc-answer');
      socket.off('ice-candidate');
      socket.off('error');
      stopSharing();
    };
  }, [roomId]);

  const startSharing = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          displaySurface: "monitor"
        },
        audio: true
      });

      streamRef.current = stream;
      setSharing(true);

      // Listen for user stopping stream via browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopSharing();
      };

      // Create WebRTC Connection
      pcRef.current = createPeerConnection(roomId, null, (state) => {
        setPcState(state);
      });

      // Add tracks
      stream.getTracks().forEach((track) => {
        pcRef.current.addTrack(track, stream);
      });

      // Create Offer
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);

      socket.emit('webrtc-offer', { roomId, offer });

    } catch (err) {
      console.error(err);
      if (err.name === 'NotAllowedError') {
        setError('Screen sharing permission was denied. Please try again.');
      } else {
        setError('Failed to share screen: ' + err.message);
      }
      setSharing(false);
    }
  };

  const stopSharing = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setSharing(false);
    setPcState('closed');
    socket.emit('stop-sharing', { roomId });
  };

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto min-h-[60vh]">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Screen Sharing Not Supported</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Apple does not allow web-based screen sharing on iPhones. 
          <br /><br />
          To present your screen, please scan the QR code using an <strong>Android device</strong>, an <strong>iPad</strong>, or open the link on a desktop PC.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto min-h-[60vh] gap-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Present to PC</h1>
        <p className="text-sm text-gray-400">Room: <span className="font-mono text-[var(--color-primary)]">{roomId}</span></p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm w-full">
          {error}
        </div>
      )}

      <div className="w-full flex flex-col items-center gap-4">
        {!sharing ? (
          <>
            <button
              onClick={startSharing}
              className="w-full py-4 px-6 bg-[var(--color-primary)] hover:bg-[var(--color-primary-600)] text-white rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors shadow-lg shadow-[var(--color-primary-500)]/20"
            >
              <MonitorUp className="w-6 h-6" />
              Share My Screen
            </button>
            <p className="text-xs text-gray-500">
              No app required. You will be prompted to approve screen capture.
            </p>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                <div className="w-8 h-8 rounded-full bg-green-500" />
              </div>
              <p className="text-green-500 font-medium">Sharing is Active</p>
              <p className="text-xs text-gray-400 font-mono">Connection: {pcState}</p>
            </div>
            
            <button
              onClick={stopSharing}
              className="w-full py-4 px-6 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors mt-4"
            >
              <XCircle className="w-6 h-6" />
              Stop Sharing
            </button>
          </>
        )}
      </div>

      <div className="mt-8 p-4 bg-[var(--color-surface-2)] rounded-xl text-left w-full">
        <h3 className="font-medium text-[var(--color-text)] mb-2 text-sm">How it works</h3>
        <ol className="list-decimal list-inside text-xs text-gray-400 space-y-1.5">
          <li>Tap <strong>Share My Screen</strong></li>
          <li>Approve the screen-sharing prompt</li>
          <li>Return to this page to manage your session</li>
          <li>Nothing is recorded or stored by default</li>
        </ol>
      </div>
    </div>
  );
}
