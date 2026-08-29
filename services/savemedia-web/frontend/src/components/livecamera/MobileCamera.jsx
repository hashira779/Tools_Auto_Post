import { useState, useEffect, useRef } from 'react';
import { socket, connectSocket } from '../../services/socket';
import { MultipartyWebRTC } from '../../services/webrtc';
import VideoPreview from './VideoPreview';
import { MonitorUp, XCircle, Send, MessageCircle, Mic, MicOff, Video, VideoOff } from 'lucide-react';

const STATE = {
  INITIAL: 'INITIAL',
  SUPPORTED: 'SUPPORTED',
  UNSUPPORTED: 'UNSUPPORTED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  BLOCKED_BY_SECURITY: 'BLOCKED_BY_SECURITY',
  LIVE: 'LIVE'
};

export default function MobileCamera({ roomId }) {
  const [supportState, setSupportState] = useState(STATE.INITIAL);
  const [errorMsg, setErrorMsg] = useState('');
  const [streams, setStreams] = useState(new Map()); // userId -> MediaStream
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const streamRef = useRef(null);
  const webrtcRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const isSecureContext = window.isSecureContext;
    const hasMediaDevices = !!navigator.mediaDevices;
    const hasGetUserMedia = typeof navigator.mediaDevices?.getUserMedia === 'function';

    if (!isSecureContext) {
      setSupportState(STATE.BLOCKED_BY_SECURITY);
      setErrorMsg('Live Camera requires HTTPS.');
    } else if (!hasMediaDevices || !hasGetUserMedia) {
      setSupportState(STATE.UNSUPPORTED);
      setErrorMsg('Camera API is unavailable.');
    } else {
      setSupportState(STATE.SUPPORTED);
    }

    return () => {
      stopSharing();
    };
  }, [roomId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSharing = async () => {
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: "user"
        },
        audio: true
      });

      streamRef.current = stream;
      setSupportState(STATE.LIVE);

      stream.getVideoTracks()[0].onended = () => {
        stopSharing();
      };

      connectSocket();

      webrtcRef.current = new MultipartyWebRTC(
        roomId,
        stream,
        (userId, remoteStream) => {
          setStreams(prev => {
            const newMap = new Map(prev);
            newMap.set(userId, remoteStream);
            return newMap;
          });
        },
        (userId) => {
          setStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(userId);
            return newMap;
          });
        }
      );

      socket.on('chat-message', (msg) => {
        setMessages(prev => [...prev, msg]);
      });

      socket.on('room-reaction', (reaction) => {
        setReactions(prev => [...prev, reaction]);
        setTimeout(() => {
          setReactions(prev => prev.filter(r => r.id !== reaction.id));
        }, 3000);
      });

    } catch (error) {
      console.error(error);
      if (error.name === 'NotAllowedError') {
        setSupportState(STATE.PERMISSION_DENIED);
        setErrorMsg('Camera permission denied.');
      } else {
        setErrorMsg(`Error: ${error?.message}`);
      }
    }
  };

  const stopSharing = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (webrtcRef.current) {
      webrtcRef.current.destroy();
      webrtcRef.current = null;
    }
    setStreams(new Map());
    setSupportState(STATE.SUPPORTED);
    socket.off('chat-message');
    socket.off('room-reaction');
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.emit('chat-message', {
      roomId,
      message: chatInput,
      senderId: socket.id,
      senderName: 'Mobile User'
    });
    setChatInput('');
  };

  const sendReaction = (emoji) => {
    socket.emit('room-reaction', { roomId, emoji, senderId: socket.id });
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const track = streamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsAudioMuted(!track.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoOff(!track.enabled);
      }
    }
  };

  if (supportState !== STATE.LIVE) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto min-h-[60vh] gap-6 animate-fade-in w-full">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">Live Room</h1>
          <p className="text-base text-gray-400">Join Room: <span className="font-mono text-[var(--color-primary)] font-bold">{roomId}</span></p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-5 rounded-xl text-sm w-full font-medium shadow-lg whitespace-pre-wrap text-left">
            {errorMsg}
          </div>
        )}

        <button
          onClick={startSharing}
          disabled={supportState === STATE.BLOCKED_BY_SECURITY || supportState === STATE.UNSUPPORTED}
          className={`w-full py-5 px-6 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl text-lg mt-8 ${
            supportState === STATE.BLOCKED_BY_SECURITY || supportState === STATE.UNSUPPORTED 
              ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
              : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-600)] hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          <MonitorUp className="w-6 h-6" />
          Join with Camera
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-[calc(100vh-80px)] overflow-hidden bg-black animate-fade-in relative">
      
      {/* Floating Reactions Overlay */}
      <div className="pointer-events-none fixed bottom-40 right-4 w-20 h-64 z-50 flex flex-col justify-end items-center overflow-visible">
        {reactions.map(r => (
          <div 
            key={r.id} 
            className="absolute bottom-0 text-3xl animate-float-up opacity-0"
            style={{ left: `${Math.random() * 40 - 20}px` }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Main Video Grid */}
      <div className="flex-1 w-full overflow-hidden relative">
        <div className={`w-full h-full grid gap-1 ${streams.size > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {/* Local Stream */}
          <div className="relative w-full h-full bg-gray-900 border border-gray-800 flex items-center justify-center">
            <video
              ref={el => {
                if (el && streamRef.current) el.srcObject = streamRef.current;
              }}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">You</span>
          </div>
          
          {/* Remote Streams */}
          {Array.from(streams.entries()).map(([id, stream]) => (
            <div key={id} className="relative w-full h-full bg-gray-900 border border-gray-800 flex items-center justify-center">
               <VideoPreview stream={stream} connectionState="connected" />
            </div>
          ))}
        </div>
        
        {/* Top Controls Overlay */}
        <div className="absolute top-4 right-4 flex gap-3 z-20 backdrop-blur-sm">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-colors shadow-lg ${isAudioMuted ? 'bg-red-500 text-white' : 'bg-gray-800/80 text-white hover:bg-gray-700'}`}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors shadow-lg ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-800/80 text-white hover:bg-gray-700'}`}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          <button
            onClick={stopSharing}
            className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Overlay (Bottom) */}
      <div className="h-64 bg-[var(--color-surface-2)] flex flex-col border-t border-[var(--color-surface-3)] z-30">
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.map(msg => (
            <div key={msg.id} className={`flex flex-col ${msg.senderId === socket.id ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] text-gray-400 px-1">{msg.senderName}</span>
              <div className={`px-3 py-1.5 rounded-2xl max-w-[85%] text-sm ${msg.senderId === socket.id ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-700 text-white'}`}>
                {msg.message}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-3 bg-black/20 space-y-2">
          <div className="flex justify-around pb-2 border-b border-gray-700/50">
            <button onClick={() => sendReaction('❤️')} className="text-xl hover:scale-125 transition-transform">❤️</button>
            <button onClick={() => sendReaction('😂')} className="text-xl hover:scale-125 transition-transform">😂</button>
            <button onClick={() => sendReaction('👏')} className="text-xl hover:scale-125 transition-transform">👏</button>
            <button onClick={() => sendReaction('🔥')} className="text-xl hover:scale-125 transition-transform">🔥</button>
          </div>
          <form onSubmit={sendMessage} className="flex gap-2">
            <input 
              type="text" 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Chat..." 
              className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
            <button type="submit" className="p-2 bg-[var(--color-primary)] text-white rounded-full">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
