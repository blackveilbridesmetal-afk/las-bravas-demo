import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type InstallPlatform = 'windows' | 'android' | 'apple';

const INSTALLED_STORAGE_KEY = 'las_bravas_app_installed';

function detectPlatform(): InstallPlatform {
  if (typeof window === 'undefined') return 'windows';
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod|macintosh/.test(ua) && !/windows/.test(ua)) {
    return 'apple';
  }
  if (/android/.test(ua)) {
    return 'android';
  }
  return 'windows';
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const stored = window.localStorage.getItem(INSTALLED_STORAGE_KEY) === 'true';
    return isStandalone || stored;
  });
  const [isIOS, setIsIOS] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<InstallPlatform>('windows');

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const stored = window.localStorage.getItem(INSTALLED_STORAGE_KEY) === 'true';

    if (isStandalone || stored) {
      setIsInstalled(true);
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setDetectedPlatform(detectPlatform());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      window.localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const markAsInstalled = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
    }
    setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      markAsInstalled();
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    detectedPlatform,
    install,
    markAsInstalled,
  };
}
