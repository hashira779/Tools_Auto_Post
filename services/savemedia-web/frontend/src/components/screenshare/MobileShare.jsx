import { useState, useEffect, useRef } from 'react';
import { socket, connectSocket } from '../../services/socket';
import { createPeerConnection } from '../../services/webrtc';
import { MonitorUp, XCircle, AlertCircle, Info } from 'lucide-react';

const STATE = {
  INITIAL: 'INITIAL',
  SUPPORTED: 'SUPPORTED',
  UNSUPPORTED: 'UNSUPPORTED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  BLOCKED_BY_SECURITY: 'BLOCKED_BY_SECURITY',
  NOT_READY: 'NOT_READY',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  LIVE: 'LIVE'
};

export default function MobileShare({ roomId }) {
  const [supportState, setSupportState] = useState(STATE.INITIAL);
  const [sharing, setSharing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pcState, setPcState] = useState('new');
  const [showDebug, setShowDebug] = useState(false);
  
  const [diagnostics, setDiagnostics] = useState({});

  const streamRef = useRef(null);
  const pcRef = useRef(null);

  useEffect(() => {
    // Check URL for debug flag
    if (window.location.search.includes('debug=1')) {
      setShowDebug(true);
    }

    // 1. Strict Feature Detection
    const isSecureContext = window.isSecureContext;
    const hasMediaDevices = !!navigator.mediaDevices;
    const hasGetUserMedia = typeof navigator.mediaDevices?.getUserMedia === 'function';
    
    setDiagnostics({
      href: location.href,
      secure: isSecureContext,
      mediaDevices: hasMediaDevices,
      getUserMedia: hasGetUserMedia ? 'AVAILABLE' : 'UNAVAILABLE',
      userAgent: navigator.userAgent
    });

    if (!isSecureContext) {
      setSupportState(STATE.BLOCKED_BY_SECURITY);
      setErrorMsg('Live Camera requires HTTPS.');
    } else if (!hasMediaDevices) {
      setSupportState(STATE.UNSUPPORTED);
      setErrorMsg('Camera API is unavailable (navigator.mediaDevices is undefined).');
    } else if (!hasGetUserMedia) {
      setSupportState(STATE.UNSUPPORTED);
      setErrorMsg('Camera API is unavailable (getUserMedia is not a function).');
    } else {
      setSupportState(STATE.SUPPORTED);
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
      setErrorMsg(err.message);
    });

    return () => {
      socket.off('webrtc-answer');
      socket.off('ice-candidate');
      socket.off('error');
      stopSharing();
    };
  }, [roomId]);

  const startSharing = async () => {
    setErrorMsg('');
    try {
      if (!window.isSecureContext) {
          throw new Error("HTTPS_REQUIRED");
      }
      if (!navigator.mediaDevices) {
          throw new Error("MEDIA_DEVICES_UNAVAILABLE");
      }
      if (typeof navigator.mediaDevices.getUserMedia !== "function") {
          throw new Error("GET_USER_MEDIA_UNAVAILABLE");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user"
        },
        audio: true
      });

      streamRef.current = stream;
      setSharing(true);
      setSupportState(STATE.LIVE);

      // Listen for user stopping stream via browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopSharing();
      };

      // Create WebRTC Connection
      pcRef.current = createPeerConnection(roomId, null, (state) => {
        setPcState(state);
        if (state === 'failed' || state === 'disconnected') {
           setSupportState(STATE.CONNECTION_FAILED);
        }
      });

      // Add tracks
      stream.getTracks().forEach((track) => {
        pcRef.current.addTrack(track, stream);
      });

      // Create Offer
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);

      socket.emit('webrtc-offer', { roomId, offer });

    } catch (error) {
      console.error("Camera access failed:", {
          name: error?.name,
          message: error?.message,
          stack: error?.stack
      });
      setDiagnostics(prev => ({ ...prev, lastErrorName: error?.name, lastErrorMessage: error?.message }));

      if (error.name === 'NotAllowedError') {
        setSupportState(STATE.PERMISSION_DENIED);
        setErrorMsg('Camera/Microphone permission was denied.\n\nPlease allow access to talk.');
      } else if (error.name === 'NotFoundError') {
        setErrorMsg('No camera or microphone found on this device.');
      } else if (error.name === 'InvalidStateError') {
        setErrorMsg('Please tap the Start button again.');
      } else if (error.name === 'SecurityError' || error.message === 'HTTPS_REQUIRED') {
        setSupportState(STATE.BLOCKED_BY_SECURITY);
        setErrorMsg('Camera access is blocked by the current security configuration.');
      } else if (error.message === 'GET_USER_MEDIA_UNAVAILABLE' || error.message === 'MEDIA_DEVICES_UNAVAILABLE') {
        setSupportState(STATE.UNSUPPORTED);
        setErrorMsg('Live camera is unavailable in this browser environment.\nPlease use a supported browser with the latest updates.');
      } else {
        setErrorMsg(`Unable to start camera.\n\nTechnical error: ${error?.name || error?.message || 'Unknown'}`);
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
    if (supportState === STATE.LIVE || supportState === STATE.CONNECTION_FAILED) {
      setSupportState(STATE.SUPPORTED);
    }
    socket.emit('stop-sharing', { roomId });
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto min-h-[60vh] gap-6 animate-fade-in w-full">
      
      {showDebug && (
        <div className="w-full bg-black/90 text-green-400 font-mono text-[11px] text-left p-5 rounded-xl overflow-x-auto shadow-2xl border border-green-500/20">
          <h3 className="text-green-500 font-bold mb-3 uppercase tracking-widest text-xs flex items-center gap-2 border-b border-green-500/20 pb-2">
            <Info className="w-4 h-4"/> Talk Mode Diagnostics
          </h3>
          <div className="space-y-1">
            <div className="flex justify-between"><span>HTTPS:</span> <span className="text-white">{diagnostics.secure ? 'YES' : 'NO'}</span></div>
            <div className="flex justify-between"><span>Secure Context:</span> <span className="text-white">{diagnostics.secure ? 'YES' : 'NO'}</span></div>
            <div className="flex justify-between"><span>MediaDevices:</span> <span className="text-white">{diagnostics.mediaDevices ? 'YES' : 'NO'}</span></div>
            <div className="flex justify-between"><span>getUserMedia:</span> <span className="text-white">{diagnostics.getUserMedia}</span></div>
            
            <div className="mt-3 pt-3 border-t border-green-500/20 text-gray-400 truncate max-w-full block">
              <span className="block text-green-500/70 mb-1">User Agent:</span> 
              {diagnostics.userAgent}
            </div>
            
            {diagnostics.lastErrorName && (
              <div className="mt-3 pt-3 border-t border-red-500/20 text-red-400 whitespace-pre-wrap">
                <span className="block text-red-500/70 mb-1">Last Error:</span>
                {diagnostics.lastErrorName}: {diagnostics.lastErrorMessage}
              </div>
            )}
            
            <div className="mt-3 pt-3 border-t border-blue-500/20 text-blue-400">
              <span className="text-blue-500/70">WebRTC State:</span> {pcState}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[var(--color-text)]">Live Camera & Audio</h1>
        <p className="text-base text-gray-400">Room: <span className="font-mono text-[var(--color-primary)] font-bold">{roomId}</span></p>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-5 rounded-xl text-sm w-full font-medium shadow-lg whitespace-pre-wrap text-left">
          {errorMsg}
        </div>
      )}



      <div className="w-full flex flex-col items-center gap-4 mt-4">
        {!sharing ? (
          <>
            <button
              onClick={startSharing}
              disabled={supportState === STATE.BLOCKED_BY_SECURITY || supportState === STATE.UNSUPPORTED}
              className={`w-full py-5 px-6 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl text-lg ${
                supportState === STATE.BLOCKED_BY_SECURITY || supportState === STATE.UNSUPPORTED 
                  ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                  : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-600)] hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <MonitorUp className="w-6 h-6" />
              Start Camera / Talk
            </button>
            <p className="text-sm text-gray-500 font-medium">
              No app required where supported.
            </p>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-3 py-8 bg-[var(--color-surface-2)] w-full rounded-2xl border border-[var(--color-surface-3)] shadow-inner">
              {pcState === 'connected' ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-green-500 animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.7)]" />
                  <p className="text-green-500 font-bold text-xl tracking-wide mt-2">● LIVE</p>
                  <p className="text-sm text-gray-400 font-medium">Connected to PC</p>
                </>
              ) : pcState === 'failed' || pcState === 'disconnected' ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-red-500" />
                  <p className="text-red-500 font-bold text-xl mt-2">Connection lost</p>
                  <p className="text-sm text-gray-400 font-medium">Reconnecting...</p>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                  <p className="text-[var(--color-primary)] font-bold text-xl mt-2">Connecting...</p>
                </>
              )}
            </div>
            
            <button
              onClick={stopSharing}
              className="w-full py-4 px-6 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors mt-2"
            >
              <XCircle className="w-6 h-6" />
              Stop Camera
            </button>
          </>
        )}
      </div>
    </div>
  );
}
