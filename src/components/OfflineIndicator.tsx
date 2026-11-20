import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-lg border border-[#E6CDBE] bg-[#FBF4EE] px-3.5 py-2 text-sm font-medium text-[#8C4722] shadow-sm md:bottom-4"
    >
      <WifiOff className="h-4 w-4 shrink-0 text-[#B26337]" />
      <span>Sin conexión — mostrando última base local</span>
    </div>
  );
};
