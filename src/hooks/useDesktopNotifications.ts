import { useEffect, useState } from 'react';

export function useDesktopNotifications() {
  const [hasPermission, setHasPermission] = useState<boolean>(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    
    if (Notification.permission === 'granted') {
      setHasPermission(true);
      return true;
    }
    
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    setHasPermission(granted);
    return granted;
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (hasPermission && typeof window !== 'undefined' && 'Notification' in window) {
      new Notification(title, options);
    }
  };

  return { hasPermission, requestPermission, sendNotification };
}
