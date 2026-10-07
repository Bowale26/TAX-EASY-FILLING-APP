import { useState, useEffect, useCallback, useRef } from 'react';

// Default 15 minutes inactivity timeout
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

export function useSessionTimeout(
  onTimeout?: () => void,
  customTimeoutMs: number = INACTIVITY_TIMEOUT_MS
) {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const isWarningOpenRef = useRef<boolean>(false);
  const onTimeoutRef = useRef(onTimeout);

  // Keep ref synchronized
  useEffect(() => {
    isWarningOpenRef.current = isWarningOpen;
  }, [isWarningOpen]);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // Reset timer on user activity
  const handleUserActivity = useCallback(() => {
    // If warning is already showing, don't silently dismiss on ambient mousemove;
    // let user deliberately click "Extend Session"
    if (!isWarningOpenRef.current) {
      lastActivityRef.current = Date.now();
    }
  }, []);

  // Explicitly extend or reset session
  const extendSession = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsWarningOpen(false);
  }, []);

  // For testing / demo purposes: trigger warning immediately
  const triggerTestWarning = useCallback(() => {
    setIsWarningOpen(true);
  }, []);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    // Throttled event handler to avoid overhead
    let lastHandled = 0;
    const throttledActivity = () => {
      const now = Date.now();
      if (now - lastHandled > 2000) {
        lastHandled = now;
        handleUserActivity();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, throttledActivity, { passive: true });
    });

    // Check every 3 seconds for inactivity
    const interval = setInterval(() => {
      if (!isWarningOpenRef.current) {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= customTimeoutMs) {
          setIsWarningOpen(true);
          onTimeoutRef.current?.();
        }
      }
    }, 3000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, throttledActivity);
      });
      clearInterval(interval);
    };
  }, [customTimeoutMs, handleUserActivity]);

  return {
    isWarningOpen,
    extendSession,
    triggerTestWarning,
  };
}
