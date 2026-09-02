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
      className="w-full card p-5 sm:p-6 mb-8 flex flex-col relative select-none min-h-[70vh] lg:min-h-[600px] overflow-hidden gap-5 animate-fade-in"
    >
      {/* ── Studio Header Bar ── */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[var(--color-border)] pb-4 gap-4">
        
        {/* Left: Studio Identity & Room Info */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-500)] flex items-center justify-center shadow-sm">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h2 className="text-sm font-bold text-[var(--color-text)] leading-tight">Live Studio</h2>
              <p className="text-[11px] text-[var(--color-text-3)]">CamTech Multiparty Mesh</p>
            </div>
          </div>

          <div className="h-6 w-px bg-[var(--color-border)] hidden sm:block"></div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--color-error-dim)] border border-[var(--color-error)]/20 text-[var(--color-error)] text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[var(--color-error)] animate-pulse"></span>
              <span>LIVE</span>
            </div>

            {/* Room Code Badge */}
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border-2)] text-xs font-mono text-[var(--color-text-2)] transition-colors"
              title="Click to copy invite link"
            >
              <span>Room: <strong className="text-[var(--color-text)]">{roomId}</strong></span>
              {copied ? <Check className="w-3.5 h-3.5 text-[var(--color-success)]" /> : <Copy className="w-3.5 h-3.5 text-[var(--color-text-3)]" />}
            </button>
          </div>
        </div>

        {/* Right: Participants Counter & Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-2)]">
            <Users className="w-4 h-4 text-[var(--color-primary-500)]" />
            <span>{totalParticipants} {totalParticipants === 1 ? 'Participant' : 'Participants'}</span>
          </div>

          <button
            onClick={() => setShowQrModal(true)}
            className="btn-secondary p-2"
            title="Show QR Code / Invite"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="btn-secondary p-2 hidden sm:block"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ── Main Workspace ── */}
      <div className="flex-1 flex flex-col lg:flex-row relative gap-5 overflow-hidden">
        
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

        {/* Main Stage */}
        <main className="flex-1 flex flex-col justify-center items-center relative overflow-y-auto overflow-x-hidden rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border-2)] p-4 z-10">
          
          {hasActiveSession ? (
            <div className="w-full h-full flex flex-wrap content-center justify-center gap-4 overflow-y-auto pb-4 scrollbar-none">
              
              {/* Local Host Video Tile */}
              {localStream && (
                <div className={`relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 flex items-center justify-center group transition-colors duration-300 ${totalParticipants === 1 ? 'w-full max-w-5xl' : 'w-full max-w-[calc(50%-1rem)] min-w-[300px]'}`}>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  {isVideoOff && (
                    <div className="absolute inset-0 bg-[var(--color-surface-2)] flex flex-col items-center justify-center gap-3 text-[var(--color-text-4)] z-10">
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
                <div key={id} className={`relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 flex items-center justify-center group transition-colors duration-300 ${totalParticipants === 1 ? 'w-full max-w-5xl' : 'w-full max-w-[calc(50%-1rem)] min-w-[300px]'}`}>
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
            <div className="w-full max-w-xl p-8 rounded-2xl bg-[var(--color-surface-1)] border border-[var(--color-border)] shadow-md flex flex-col items-center text-center gap-8 relative z-10">
              
              {/* Studio Icon/Logo */}
              <div className="w-20 h-20 rounded-full bg-[var(--color-primary-100)] dark:bg-[var(--color-primary-900)] flex items-center justify-center border border-[var(--color-primary-200)] dark:border-[var(--color-primary-800)]">
                <Video className="w-8 h-8 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
              </div>

              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)] border border-[var(--color-primary-200)] dark:border-[var(--color-primary-800)] text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] text-xs font-bold ">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Studio Ready</span>
                </div>
                <h3 className="text-3xl font-bold text-[var(--color-text)]">
                  Start Your Broadcast
                </h3>
                <p className="text-[var(--color-text-3)] text-sm max-w-sm mx-auto leading-relaxed">
                  Turn on your camera to begin streaming. You can invite participants using the Room Code or QR button in the top right.
                </p>
              </div>

              <div className="w-full flex gap-4 pt-4 border-t border-[var(--color-border-2)]">
                <button
                  onClick={startCamera}
                  className="btn-primary flex-1 py-3 px-6 flex items-center justify-center gap-3"
                >
                  <Video className="w-5 h-5" />
                  <span>Start Camera</span>
                </button>

                <button
                  onClick={handleRecreate}
                  className="btn-secondary py-3 px-6 flex items-center justify-center gap-3"
                  title="Generate New Room"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>New Room</span>
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Collapsible Live Chat Sidebar */}
        {showChat && (
          <aside className="w-full lg:w-80 h-72 lg:h-auto rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border-2)] flex flex-col overflow-hidden shadow-sm flex-shrink-0 animate-fade-in z-20">
            
            {/* Chat Header */}
            <div className="p-4 border-b border-[var(--color-border-2)] flex items-center justify-between bg-[var(--color-surface-2)]">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[var(--color-primary-500)]" />
                <h4 className="text-xs font-bold text-[var(--color-text)]">Live Chat</h4>
              </div>
              <span className="text-[10px] text-[var(--color-text-3)] font-mono">{messages.length} messages</span>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[var(--color-text-4)] gap-2">
                  <MessageCircle className="w-8 h-8 opacity-30" />
                  <p className="text-xs">No messages yet.<br/>Be the first to say hi!</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${msg.senderId === socket.id ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-[var(--color-text-4)] mb-1 px-1">{msg.senderName}</span>
                    <div className={`px-3.5 py-2 rounded-2xl max-w-[85%] text-xs shadow-sm ${
                      msg.senderId === socket.id 
                        ? 'bg-[var(--color-primary-600)] text-white rounded-br-none' 
                        : 'bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)] rounded-bl-none'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Reactions Bar & Message Form */}
            <div className="p-3 bg-[var(--color-surface-2)] border-t border-[var(--color-border-2)] space-y-2.5">
              
              {/* Quick Emojis */}
              <div className="flex justify-between px-1">
                {EMOJI_LIST.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => sendReaction(emoji)}
                    className="w-8 h-8 flex items-center justify-center text-lg active:scale-95 transition-transform"
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
                  className="input-field flex-1 px-3.5 py-2.5 text-xs"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="btn-primary p-2.5 disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </aside>
        )}
      </div>

      {/* ── Bottom Control Dock (Zoom / Teams Style) ── */}
      <footer className="pt-4 border-t border-[var(--color-border)] flex items-center justify-center flex-shrink-0 mt-auto">
        <div className="flex items-center gap-3 sm:gap-4 p-1.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border-2)] shadow-sm">
          
          {/* Host Camera Start / Toggle */}
          {localStream ? (
            <>
              {/* Mic Toggle */}
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-lg border transition-colors ${
                  isAudioMuted 
                    ? 'bg-[var(--color-error)] text-white border-[var(--color-error)] shadow-md shadow-[var(--color-error-dim)]' 
                    : 'btn-secondary'
                }`}
                title={isAudioMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Video Toggle */}
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-lg border transition-colors ${
                  isVideoOff 
                    ? 'bg-[var(--color-error)] text-white border-[var(--color-error)] shadow-md shadow-[var(--color-error-dim)]' 
                    : 'btn-secondary'
                }`}
                title={isVideoOff ? "Turn On Video" : "Turn Off Video"}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              {/* Stop Camera button */}
              <button
                onClick={stopCamera}
                className="btn-secondary p-3"
                title="Disconnect Webcam"
              >
                <MonitorUp className="w-5 h-5 text-[var(--color-primary-500)]" />
              </button>
            </>
          ) : (
            <button
              onClick={startCamera}
              className="btn-primary px-4 py-2 flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              <span>Turn On My Camera</span>
            </button>
          )}

          {/* Chat Toggle */}
          <button
            onClick={() => setShowChat(prev => !prev)}
            className={`p-3 rounded-lg border transition-colors ${
              showChat 
                ? 'bg-[var(--color-primary-500)] text-white border-[var(--color-primary-500)] shadow-md shadow-[var(--color-primary-200)]' 
                : 'btn-secondary'
            }`}
            title={showChat ? "Hide Chat" : "Open Chat"}
          >
            {showChat ? <MessageCircle className="w-5 h-5" /> : <MessageSquareOff className="w-5 h-5" />}
          </button>

          {/* End Session Button */}
          <button
            onClick={handleRecreate}
            className="p-3 rounded-lg bg-[var(--color-error-dim)] hover:bg-[var(--color-error)] text-[var(--color-error)] hover:text-white border border-[var(--color-error)]/30 transition-colors flex items-center gap-2"
            title="End Call & Reset Room"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-xs font-bold hidden sm:inline">End Session</span>
          </button>
        </div>
      </footer>

      {/* ── QR Code Popup Modal ── */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col items-center text-center gap-5 shadow-2xl relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--color-surface-2)] text-[var(--color-text-3)] hover:text-[var(--color-text)] transition-colors"
            >
              ✕
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[var(--color-text)]">Invite Participants</h3>
              <p className="text-xs text-[var(--color-text-3)]">Scan or share this link to join Room: <strong className="text-[var(--color-text)]">{roomId}</strong></p>
            </div>

            <div className="p-4 bg-[var(--color-surface-1)] rounded-xl shadow-sm ring-1 ring-black/5">
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
              className="btn-primary w-full py-3 px-4 flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Share Link'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
