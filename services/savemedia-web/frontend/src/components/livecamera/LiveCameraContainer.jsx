import { useEffect, useState } from 'react';
import LiveCameraHero from './LiveCameraHero';
import MobileCamera from './MobileCamera';

export default function LiveCameraContainer() {
  const [roomId, setRoomId] = useState(null);
  
  useEffect(() => {
    // Basic routing logic since we don't have react-router
    const path = window.location.pathname;
    if (path.startsWith('/share/')) {
      const id = path.split('/share/')[1];
      if (id) {
        setRoomId(id);
      }
    }
  }, []);

  if (roomId) {
    return <MobileCamera roomId={roomId} />;
  }

  // Otherwise, it's the PC creation view
  return <LiveCameraHero />;
}
