import { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { socket, connectSocket } from '../../services/socket';
import { MultipartyWebRTC } from '../../services/webrtc';
import VideoPreview from './VideoPreview';
import { 
  Copy, RefreshCw, Send, Users, 
  MonitorUp, Mic, MicOff, Video, VideoOff, 
  MessageCircle, MessageSquareOff, QrCode, Maximize, Minimize,
  Check, Sparkles, Radio, PhoneOff
} from 'lucide-react';

const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();
const EMOJI_LIST = ['❤️', '🔥', '👏', '😂', '🎉', '🚀'];

export default function LiveCameraHero() {
  const [roomId, setRoomId] = useState('');
  const [streams, setStreams] = useState(new Map()); // userId -> MediaStream
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState([]); // Floating reactions
  
  const [localStream, setLocalStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const webrtcRef = useRef(null);
  const chatEndRef = useRef(null);
  const containerRef = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    initSession();
    return () => {
      cleanupSession();
    };
  }, []);

  useEffect(() => {
    if (showChat) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showChat]);

  // Bind local video element whenever localStream changes
  useEffect(() => {
    const video = localVideoRef.current;
    if (video && localStream) {
      video.srcObject = localStream;
    }
    return () => {
      if (video) {
        video.srcObject = null;
      }
    };
  }, [localStream]);

  const initSession = (stream = null, existingRoomId = null) => {
    const newRoomId = existingRoomId || generateRoomId();
    setRoomId(newRoomId);
    setStreams(new Map());
    setMessages([]);
    setReactions([]);
    
    connectSocket();

    webrtcRef.current = new MultipartyWebRTC(
      newRoomId,
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
  };

  const cleanupSession = () => {
    if (webrtcRef.current) {
      webrtcRef.current.destroy();
      webrtcRef.current = null;
    }
    socket.off('chat-message');
    socket.off('room-reaction');
  };

  const handleRecreate = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    cleanupSession();
    initSession();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });
      setLocalStream(stream);
      setIsAudioMuted(false);
      setIsVideoOff(false);
      cleanupSession();
      initSession(stream, roomId); // Re-join with the same room ID
    } catch (err) {
      console.error(err);
      alert("Could not access camera or microphone. Please check your browser permissions.");
    }
  };

  const stopCamera = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    cleanupSession();
    initSession(null, roomId);
  };

  const toggleAudio = () => {
    if (localStream) {
      const track = localStream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsAudioMuted(!track.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const track = localStream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoOff(!track.enabled);
      }
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/share/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.emit('chat-message', {
      roomId,
      message: chatInput,
      senderId: socket.id,
      senderName: 'Host (PC)'
    });
    setChatInput('');
  };

  const sendReaction = (emoji) => {
    socket.emit('room-reaction', { roomId, emoji, senderId: socket.id });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => console.error(err));
      setIsFullscreen(false);
    }
  };

  const hasActiveSession = streams.size > 0 || localStream !== null;
  const totalParticipants = streams.size + (localStream ? 1 : 0);

  return (
    <div 
      ref={containerRef}
      className="w-full h-[calc(100vh-64px)] flex flex-col relative select-none bg-[#09090b] overflow-hidden"
    >
      {/* Background glowing mesh (hardware accelerated) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40 will-change-transform">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[100px] mix-blend-screen transform translate-z-0"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/30 rounded-full blur-[100px] mix-blend-screen transform translate-z-0"></div>
        <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-blue-500/20 rounded-full blur-[80px] mix-blend-screen transform translate-z-0"></div>
      </div>
      
      {/* ── Studio Header Bar ── */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between z-30 flex-shrink-0">
        
        {/* Left: Studio Identity & Room Info */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h2 className="text-sm font-bold text-white leading-tight">Live Studio</h2>
              <p className="text-[11px] text-slate-400">CamTech Multiparty Mesh</p>
            </div>
          </div>

          <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span>LIVE</span>
            </div>

            {/* Room Code Badge */}
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-xs font-mono text-slate-300 transition-colors"
              title="Click to copy invite link"
            >
              <span>Room: <strong>{roomId}</strong></span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Right: Participants Counter & Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-white/10 text-xs font-medium text-slate-300">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>{totalParticipants} {totalParticipants === 1 ? 'Participant' : 'Participants'}</span>
          </div>

          <button
            onClick={() => setShowQrModal(true)}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white transition-colors"
            title="Show QR Code / Invite"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white transition-colors hidden sm:block"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ── Main Workspace ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative p-3 sm:p-4 gap-4">
        
        {/* Floating Reactions Stream (Overlay on right side of stage) */}
        <div className="pointer-events-none absolute bottom-24 right-6 sm:right-80 w-20 h-96 z-40 flex flex-col justify-end items-center overflow-visible">
          {reactions.map(r => (
            <div 
              key={r.id} 
              className="absolute bottom-0 text-4xl animate-float-up drop-shadow-lg"
              style={{ left: `${Math.random() * 40 - 20}px` }}
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* Main Stage Grid */}
        <main className="flex-1 flex flex-col justify-center items-center relative overflow-hidden rounded-3xl bg-slate-900/50 border border-white/10 p-2 sm:p-4">
          
          {hasActiveSession ? (
            <div className={`w-full h-full grid gap-3 ${
              totalParticipants === 1 ? 'grid-cols-1 grid-rows-1' :
              totalParticipants === 2 ? 'grid-cols-1 md:grid-cols-2' :
              totalParticipants === 3 ? 'grid-cols-1 md:grid-cols-3' :
              'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              
              {/* Local Host Video Tile */}
              {localStream && (
                <div className="relative w-full h-full min-h-[220px] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl flex items-center justify-center group">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain transform -scale-x-100"
                  />

                  {isVideoOff && (
                    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-3 text-slate-400 z-10">
                      <div className="w-16 h-16 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-white text-xl font-bold">
                        Host
                      </div>
                      <span className="text-xs font-medium">Camera is Off</span>
                    </div>
                  )}

                  {/* Nameplate & Status Badge */}
                  <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>You (Host)</span>
                    {isAudioMuted && <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                  </div>
                </div>
              )}

              {/* Remote Participant Tiles */}
              {Array.from(streams.entries()).map(([id, stream]) => (
                <div key={id} className="relative w-full h-full min-h-[220px] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl flex items-center justify-center">
                  <VideoPreview stream={stream} connectionState="connected" />
                  
                  <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Guest</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Lobby State (When nobody has joined yet and host hasn't started camera) */
            <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center gap-6 relative z-10">
              
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ready to Stream</span>
                </div>
                <h3 className="text-2xl font-bold text-white">Join the Live Room</h3>
                <p className="text-sm text-slate-400">
                  Scan this QR code with your phone camera or share the link to invite participants.
                </p>
              </div>

              {/* Crisp QR Code */}
              <div className="p-4 bg-white rounded-2xl shadow-xl ring-1 ring-black/5">
                <QRCode 
                  value={`${window.location.origin}/share/${roomId}`}
                  size={190}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={startCamera}
                  className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:opacity-95 text-white font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Video className="w-5 h-5" />
                  <span>Start My Camera (Host)</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={copyLink}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    onClick={handleRecreate}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                    title="Generate New Room"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                    <span>New Code</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Collapsible Live Chat Sidebar */}
        {showChat && (
          <aside className="w-full lg:w-80 h-72 lg:h-auto rounded-3xl bg-slate-900/90 border border-white/10 backdrop-blur-xl flex flex-col overflow-hidden shadow-2xl flex-shrink-0 animate-fade-in">
            
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Chat</h4>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{messages.length} messages</span>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 gap-2">
                  <MessageCircle className="w-8 h-8 opacity-30" />
                  <p className="text-xs">No messages yet.<br/>Be the first to say hi!</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${msg.senderId === socket.id ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-slate-400 mb-1 px-1">{msg.senderName}</span>
                    <div className={`px-3.5 py-2 rounded-2xl max-w-[85%] text-xs shadow-md ${
                      msg.senderId === socket.id 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-slate-800 text-slate-200 border border-white/10 rounded-bl-none'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Reactions Bar & Message Form */}
            <div className="p-3 bg-black/40 border-t border-white/10 space-y-2.5">
              
              {/* Quick Emojis */}
              <div className="flex justify-between px-1">
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

              {/* Chat Input */}
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-800/90 border border-white/10 text-white text-xs placeholder:text-slate-500 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-40 transition-colors shadow-md shadow-indigo-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </aside>
        )}
      </div>

      {/* ── Bottom Control Dock (Zoom / Teams Style) ── */}
      <footer className="h-20 px-4 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-center z-30 flex-shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 p-2 rounded-2xl bg-black/40 border border-white/10 shadow-2xl">
          
          {/* Host Camera Start / Toggle */}
          {localStream ? (
            <>
              {/* Mic Toggle */}
              <button
                onClick={toggleAudio}
                className={`p-3.5 rounded-xl border transition-all ${
                  isAudioMuted 
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30' 
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-white/10'
                }`}
                title={isAudioMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Video Toggle */}
              <button
                onClick={toggleVideo}
                className={`p-3.5 rounded-xl border transition-all ${
                  isVideoOff 
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30' 
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-white/10'
                }`}
                title={isVideoOff ? "Turn On Video" : "Turn Off Video"}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              {/* Stop Camera button */}
              <button
                onClick={stopCamera}
                className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 transition-colors"
                title="Disconnect Webcam"
              >
                <MonitorUp className="w-5 h-5 text-indigo-400" />
              </button>
            </>
          ) : (
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Video className="w-4 h-4" />
              <span>Turn On My Camera</span>
            </button>
          )}

          {/* Chat Toggle */}
          <button
            onClick={() => setShowChat(prev => !prev)}
            className={`p-3.5 rounded-xl border transition-all ${
              showChat 
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' 
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-white/10'
            }`}
            title={showChat ? "Hide Chat" : "Open Chat"}
          >
            {showChat ? <MessageCircle className="w-5 h-5" /> : <MessageSquareOff className="w-5 h-5" />}
          </button>

          {/* End Session Button */}
          <button
            onClick={handleRecreate}
            className="p-3.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all flex items-center gap-2"
            title="End Call & Reset Room"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-xs font-bold hidden sm:inline">End Session</span>
          </button>
        </div>
      </footer>

      {/* ── QR Code Popup Modal ── */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-white/15 rounded-3xl p-6 flex flex-col items-center text-center gap-5 shadow-2xl relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Invite Participants</h3>
              <p className="text-xs text-slate-400">Scan or share this link to join Room: <strong>{roomId}</strong></p>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-lg ring-1 ring-black/5">
              <QRCode 
                value={`${window.location.origin}/share/${roomId}`}
                size={180}
                level="H"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>

            <button
              onClick={copyLink}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Share Link'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
