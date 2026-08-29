import { useState, useEffect, useRef } from 'react';
import { socket, connectSocket } from '../../services/socket';
import { MultipartyWebRTC } from '../../services/webrtc';
import VideoPreview from './VideoPreview';
import { 
  Video, VideoOff, Mic, MicOff, 
  RefreshCw, Send, MessageCircle, MessageSquareOff, 
  PhoneOff, Users, Copy, Check, Sparkles, ShieldAlert
} from 'lucide-react';

const STATE = {
  INITIAL: 'INITIAL',
  SUPPORTED: 'SUPPORTED',
  UNSUPPORTED: 'UNSUPPORTED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  BLOCKED_BY_SECURITY: 'BLOCKED_BY_SECURITY',
  LIVE: 'LIVE'
};

const EMOJI_LIST = ['❤️', '🔥', '👏', '😂', '🎉', '🚀'];

export default function MobileCamera({ roomId }) {
  const [supportState, setSupportState] = useState(STATE.INITIAL);
  const [errorMsg, setErrorMsg] = useState('');
  const [streams, setStreams] = useState(new Map()); // userId -> MediaStream
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'
  const [showChat, setShowChat] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const streamRef = useRef(null);
  const webrtcRef = useRef(null);
  const chatEndRef = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    const isSecureContext = window.isSecureContext;
    const hasMediaDevices = !!navigator.mediaDevices;
    const hasGetUserMedia = typeof navigator.mediaDevices?.getUserMedia === 'function';

    if (!isSecureContext) {
      setSupportState(STATE.BLOCKED_BY_SECURITY);
      setErrorMsg('Live Camera requires HTTPS to access camera & microphone.');
    } else if (!hasMediaDevices || !hasGetUserMedia) {
      setSupportState(STATE.UNSUPPORTED);
      setErrorMsg('Camera and Microphone APIs are unavailable in this browser.');
    } else {
      setSupportState(STATE.SUPPORTED);
    }

    return () => {
      stopSharing();
    };
  }, [roomId]);

  useEffect(() => {
    if (showChat) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showChat]);

  // Bind local video element whenever stream changes or component enters live state
  useEffect(() => {
    if (localVideoRef.current && streamRef.current) {
      localVideoRef.current.srcObject = streamRef.current;
    }
  }, [supportState, facingMode]);

  const startSharing = async () => {
    setErrorMsg('');
    setIsConnecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: facingMode
        },
        audio: true
      });

      streamRef.current = stream;
      setSupportState(STATE.LIVE);
      setIsConnecting(false);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

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
      setIsConnecting(false);
      if (error.name === 'NotAllowedError') {
        setSupportState(STATE.PERMISSION_DENIED);
        setErrorMsg('Camera or Microphone access was denied. Please allow camera permissions in your browser settings.');
      } else {
        setErrorMsg(`Camera error: ${error?.message || 'Unknown error'}`);
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

  const flipCamera = async () => {
    if (!streamRef.current) return;
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: nextFacing
        },
        audio: false
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return;

      const oldTrack = streamRef.current?.getVideoTracks()[0];
      if (oldTrack && streamRef.current) {
        try {
          streamRef.current.removeTrack(oldTrack);
        } catch (_) {}
        oldTrack.stop();
      }

      if (streamRef.current) {
        streamRef.current.addTrack(newVideoTrack);
      }
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = streamRef.current;
      }

      // Replace track on all active peer connections seamlessly
      if (webrtcRef.current && webrtcRef.current.peers) {
        webrtcRef.current.peers.forEach((pc) => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video' || (s.track === null && s.dtlsTransport));
          if (sender) {
            sender.replaceTrack(newVideoTrack).catch(err => {
              console.debug("Error replacing track on peer:", err?.message);
            });
          }
        });
      }

      setFacingMode(nextFacing);
      setIsVideoOff(false);
    } catch (err) {
      console.error("Failed to flip camera:", err);
    }
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

  const copyRoomCode = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Pre-join Lobby View
  if (supportState !== STATE.LIVE) {
    return (
      <div className="min-h-[100dvh] w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-6 text-center select-none">
        
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-sm flex flex-col items-center gap-6 relative z-10">
          
          {/* Header Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>CamTech Live Studio</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Ready to Join?
            </h1>
            <p className="text-sm text-slate-400">
              You are about to connect to room <span className="font-mono text-indigo-400 font-bold px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30">{roomId}</span>
            </p>
          </div>

          {/* Camera Preview Card / Graphic */}
          <div className="w-full aspect-[4/3] rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 animate-pulse">
              <Video className="w-10 h-10" />
            </div>
            <p className="mt-4 text-xs font-medium text-slate-400">
              HD 1080p WebRTC Streaming
            </p>
          </div>

          {errorMsg && (
            <div className="w-full bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl text-xs font-medium flex items-start gap-3 text-left">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Join Action Button */}
          <button
            onClick={startSharing}
            disabled={isConnecting || supportState === STATE.BLOCKED_BY_SECURITY || supportState === STATE.UNSUPPORTED}
            className={`w-full py-4 px-6 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl text-base ${
              supportState === STATE.BLOCKED_BY_SECURITY || supportState === STATE.UNSUPPORTED 
                ? 'bg-slate-800 opacity-50 cursor-not-allowed text-slate-500' 
                : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] shadow-indigo-500/25'
            }`}
          >
            {isConnecting ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Video className="w-5 h-5" />
            )}
            <span>{isConnecting ? 'Accessing Camera...' : 'Join Room with Camera'}</span>
          </button>

          <p className="text-[11px] text-slate-500">
            Encrypted Peer-to-Peer • Instant Connect
          </p>
        </div>
      </div>
    );
  }

  // Active Multi-User Live Room View
  const totalStreamsCount = streams.size + 1; // local stream + remote peers

  return (
    <div className="h-[100dvh] w-full bg-black overflow-hidden flex flex-col relative select-none">
      
      {/* ── Top Header Floating Bar ── */}
      <div className="absolute top-0 left-0 right-0 z-40 p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between pointer-events-none">
        
        {/* Left: Live indicator & Room Tag */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/90 backdrop-blur-md text-white text-xs font-bold shadow-lg shadow-red-600/20">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span>LIVE</span>
          </div>

          <button 
            onClick={copyRoomCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white/90 text-xs font-mono hover:bg-black/70 transition-colors shadow-lg"
          >
            <span>{roomId}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          </button>
        </div>

        {/* Right: Participant Count & Flip Camera */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white text-xs font-semibold shadow-lg">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>{totalStreamsCount}</span>
          </div>

          <button
            onClick={flipCamera}
            className="p-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white hover:bg-white/20 active:rotate-180 transition-all shadow-lg"
            title="Flip Camera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Main Video Grid (Full Viewport Immersion) ── */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-950">
        <div className={`w-full h-full grid gap-1.5 p-1.5 ${
          totalStreamsCount === 1 ? 'grid-cols-1 grid-rows-1' :
          totalStreamsCount === 2 ? 'grid-cols-1 grid-rows-2 sm:grid-cols-2 sm:grid-rows-1' :
          totalStreamsCount === 3 ? 'grid-cols-2 grid-rows-2' :
          'grid-cols-2 grid-rows-2'
        }`}>
          
          {/* Local User Stream */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-lg flex items-center justify-center">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`}
            />

            {/* Local User Avatar Placeholder if Video is Off */}
            {isVideoOff && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-2 text-slate-400 z-10">
                <div className="w-16 h-16 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-white text-xl font-bold">
                  You
                </div>
                <span className="text-xs font-medium">Camera is Off</span>
              </div>
            )}

            {/* Badge overlay */}
            <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium">
              <span>You</span>
              {isAudioMuted && <MicOff className="w-3 h-3 text-rose-400" />}
            </div>
          </div>

          {/* Remote Peer Streams */}
          {Array.from(streams.entries()).map(([id, stream]) => (
            <div key={id} className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-lg flex items-center justify-center">
              <VideoPreview stream={stream} connectionState="connected" />
              <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium">
                <span>Guest</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Floating Reaction Stream (Instagram style right side) ── */}
      <div className="pointer-events-none absolute bottom-28 right-4 w-16 h-80 z-40 flex flex-col justify-end items-center overflow-visible">
        {reactions.map(r => (
          <div 
            key={r.id} 
            className="absolute bottom-0 text-3xl sm:text-4xl animate-float-up drop-shadow-md"
            style={{ left: `${Math.random() * 30 - 15}px` }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* ── Floating Instagram/TikTok Style Live Chat Overlay ── */}
      {showChat && (
        <div className="absolute bottom-24 left-3 right-20 sm:left-4 sm:right-auto sm:w-80 max-h-56 z-30 flex flex-col justify-end pointer-events-none">
          <div className="overflow-y-auto space-y-2 p-1 pointer-events-auto max-h-48 scrollbar-none mask-gradient">
            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`flex items-start gap-2 max-w-[95%] animate-fade-in ${
                  msg.senderId === socket.id ? 'opacity-95' : 'opacity-90'
                }`}
              >
                <div className="px-3 py-1.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs shadow-lg">
                  <span className="font-bold text-indigo-300 mr-1.5">{msg.senderName}:</span>
                  <span className="text-white/95 break-words">{msg.message}</span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      )}

      {/* ── Bottom Control Bar & Floating Dock ── */}
      <div className="absolute bottom-0 left-0 right-0 z-40 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2.5">
        
        {/* Quick Reaction Bar & Chat Input */}
        <div className="flex items-center gap-2">
          
          {/* Reaction Tray */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 shadow-xl">
            {EMOJI_LIST.map(emoji => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 active:scale-95 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Quick Chat Input */}
          <form onSubmit={sendMessage} className="flex-1 flex items-center relative">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Send a comment..."
              className="w-full bg-black/60 backdrop-blur-xl border border-white/15 text-white text-xs placeholder:text-white/40 rounded-full pl-4 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xl"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="absolute right-1.5 p-1.5 rounded-full bg-indigo-600 text-white disabled:opacity-30 transition-opacity"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Action Controls Dock (Mic, Video, Chat Toggle, Leave) */}
        <div className="flex items-center justify-center gap-3">
          
          {/* Mic Button */}
          <button
            onClick={toggleAudio}
            className={`p-3.5 rounded-full backdrop-blur-xl border transition-all shadow-xl ${
              isAudioMuted 
                ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30' 
                : 'bg-black/60 text-white border-white/15 hover:bg-white/20'
            }`}
            title={isAudioMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle Button */}
          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-full backdrop-blur-xl border transition-all shadow-xl ${
              isVideoOff 
                ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30' 
                : 'bg-black/60 text-white border-white/15 hover:bg-white/20'
            }`}
            title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* Toggle Chat Visibility */}
          <button
            onClick={() => setShowChat(prev => !prev)}
            className={`p-3.5 rounded-full backdrop-blur-xl border transition-all shadow-xl ${
              !showChat 
                ? 'bg-slate-800 text-slate-400 border-white/10' 
                : 'bg-black/60 text-white border-white/15 hover:bg-white/20'
            }`}
            title={showChat ? "Hide Chat" : "Show Chat"}
          >
            {showChat ? <MessageCircle className="w-5 h-5 text-indigo-400" /> : <MessageSquareOff className="w-5 h-5" />}
          </button>

          {/* End Call / Leave */}
          <button
            onClick={stopSharing}
            className="p-3.5 rounded-full bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-xl shadow-red-600/30 border border-red-500 hover:scale-105 active:scale-95 transition-all"
            title="Leave Room"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
