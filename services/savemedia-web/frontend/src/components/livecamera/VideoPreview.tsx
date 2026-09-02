import { useRef, useEffect, useState } from 'react';
import { Maximize, Minimize, Activity } from 'lucide-react';

export default function VideoPreview({ stream, connectionState, rtt }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      video.srcObject = stream;
    }
    return () => {
      if (video) {
        video.srcObject = null;
      }
    };
  }, [stream]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'disconnected':
      case 'failed': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative bg-[var(--color-surface-2)] rounded-2xl overflow-hidden flex flex-col justify-center items-center ${
        isFullscreen ? 'w-screen h-screen' : 'w-full h-full min-h-[200px]'
      }`}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={false}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-[var(--color-text-4)] gap-3">
          <Activity className="w-10 h-10 animate-pulse text-indigo-400 opacity-60" />
          <p className="text-xs font-medium">Connecting stream...</p>
        </div>
      )}

      {/* Floating overlay for controls and stats */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="flex flex-col gap-1 text-xs text-white/80 font-mono">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${getStatusColor().replace('text-', 'bg-')}`}></span>
            State: {connectionState}
          </div>
          {rtt && <div>Latency: {rtt}ms</div>}
        </div>
        
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
