'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * Listens to online/offline and shows toasts. Optionally renders a status indicator.
 */
export function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initial = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setIsOnline(initial);

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('연결이 복구되었어요.');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('인터넷 연결이 끊어졌어요. 다시 연결될 때까지 기다려 주세요.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!mounted) return null;
  return (
    <span
      className='hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground'
      title={isOnline ? '온라인' : '오프라인'}
      aria-live='polite'
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-amber-500'}`} aria-hidden />
      {isOnline ? '온라인' : '오프라인'}
    </span>
  );
}
