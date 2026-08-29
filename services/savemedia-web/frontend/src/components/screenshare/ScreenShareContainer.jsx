import { useEffect, useState } from 'react';
import ScreenShareHero from './ScreenShareHero';
import MobileShare from './MobileShare';

export default function ScreenShareContainer() {
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

  // If there's a roomId in the URL, this is the mobile presentation view
  if (roomId) {
    return <MobileShare roomId={roomId} />;
  }

  // Otherwise, it's the PC creation view
  return <ScreenShareHero />;
}
