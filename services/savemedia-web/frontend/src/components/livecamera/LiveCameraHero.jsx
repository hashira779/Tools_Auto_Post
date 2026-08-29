import { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { socket, connectSocket } from '../../services/socket';
import { MultipartyWebRTC } from '../../services/webrtc';
import VideoPreview from './VideoPreview';
import { Copy, RefreshCw, Send, Heart, Flame, ThumbsUp, MessageCircle } from 'lucide-react';

const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export default function LiveCameraHero() {
  const [roomId, setRoomId] = useState('');
  const [streams, setStreams] = useState(new Map()); // userId -> MediaStream
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState([]); // Array of floating emojis
  
  const webrtcRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    initSession();
    return () => cleanupSession();
  }, []);

  useEffect(() => {
    // Scroll to bottom of chat
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initSession = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    setStreams(new Map());
    setMessages([]);
    setReactions([]);
    
    connectSocket();

    webrtcRef.current = new MultipartyWebRTC(
      newRoomId,
      null, // No local stream for the PC host by default
      (userId, stream) => {
        setStreams(prev => {
          const newMap = new Map(prev);
          newMap.set(userId, stream);
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
      }, 3000); // Remove after 3s animation
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
    cleanupSession();
    initSession();
  };

  const copyLink = () => {
    const url = `${window.location.origin}/share/${roomId}`;
    navigator.clipboard.writeText(url);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.emit('chat-message', {
      roomId,
      message: chatInput,
      senderId: socket.id,
      senderName: 'PC Host'
    });
    setChatInput('');
  };

  const sendReaction = (emoji) => {
    socket.emit('room-reaction', { roomId, emoji, senderId: socket.id });
  };

  const hasStreams = streams.size > 0;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-6 animate-fade-in relative">
      
      {!hasStreams && (
        <div className="text-center space-y-4 mb-4">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-text)]">
            Live Camera & Audio
          </h1>
          <p className="text-lg text-[var(--color-text-3)] max-w-2xl mx-auto">
            Scan the code to join the live room. Multiple people can join, chat, and react!
          </p>
        </div>
      )}

      {/* Floating Reactions Overlay */}
      <div className="pointer-events-none fixed bottom-24 right-10 md:right-32 w-20 h-96 z-50 flex flex-col justify-end items-center overflow-visible">
        {reactions.map(r => (
          <div 
            key={r.id} 
            className="absolute bottom-0 text-4xl animate-float-up opacity-0"
            style={{ left: `${Math.random() * 40 - 20}px` }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {hasStreams ? (
        <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Video Grid */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="w-full flex items-center justify-between px-4 bg-[var(--color-surface-2)] p-4 rounded-xl border border-[var(--color-surface-3)]">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                <span className="font-bold text-red-500 tracking-widest text-lg">LIVE</span>
                <span className="ml-4 text-[var(--color-text-3)] font-mono text-sm bg-black/20 px-3 py-1 rounded-full">Room: {roomId}</span>
              </div>
              <button 
                onClick={handleRecreate}
                className="px-4 py-2 bg-[var(--color-surface-1)] hover:bg-[var(--color-primary)] hover:text-white rounded-lg text-sm transition-all font-medium flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> End Session
              </button>
            </div>
            
            <div className={`grid gap-4 w-full ${streams.size > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {Array.from(streams.entries()).map(([id, stream]) => (
                <VideoPreview key={id} stream={stream} connectionState="connected" />
              ))}
            </div>
          </div>

          {/* Chat Sidebar */}
          <div className="lg:col-span-1 bg-[var(--color-surface-2)] border border-[var(--color-surface-3)] rounded-2xl flex flex-col h-[600px] shadow-xl overflow-hidden">
            <div className="p-4 border-b border-[var(--color-surface-3)] bg-black/20 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="font-bold text-[var(--color-text)]">Live Chat</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-[var(--color-text-3)] text-sm mt-10">
                  Welcome to the live room! Say hi! 👋
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === socket.id ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-[var(--color-text-3)] mb-1 px-1">{msg.senderName}</span>
                    <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${msg.senderId === socket.id ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface-3)] text-[var(--color-text)]'}`}>
                      {msg.message}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-black/20 border-t border-[var(--color-surface-3)] space-y-3">
              <div className="flex justify-around pb-3 border-b border-[var(--color-surface-3)]">
                <button onClick={() => sendReaction('❤️')} className="p-2 hover:bg-white/10 rounded-full transition-transform hover:scale-125">❤️</button>
                <button onClick={() => sendReaction('😂')} className="p-2 hover:bg-white/10 rounded-full transition-transform hover:scale-125">😂</button>
                <button onClick={() => sendReaction('👏')} className="p-2 hover:bg-white/10 rounded-full transition-transform hover:scale-125">👏</button>
                <button onClick={() => sendReaction('🔥')} className="p-2 hover:bg-white/10 rounded-full transition-transform hover:scale-125">🔥</button>
              </div>
              <form onSubmit={sendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Send a message..." 
                  className="flex-1 bg-[var(--color-surface-3)] text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <button type="submit" className="p-2 bg-[var(--color-primary)] text-white rounded-xl hover:bg-[var(--color-primary-600)] transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-8 md:p-12 w-full max-w-md flex flex-col items-center text-center gap-6 shadow-2xl relative overflow-hidden mt-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-[var(--color-primary-500)]/10 blur-3xl rounded-full"></div>

          <div className="relative z-10 space-y-2">
            <h2 className="text-xl font-bold">Connect to Room</h2>
            <p className="text-sm text-[var(--color-text-3)]">Scan this QR code with your phone to join Room: <strong>{roomId}</strong></p>
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
              Waiting for participants...
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
