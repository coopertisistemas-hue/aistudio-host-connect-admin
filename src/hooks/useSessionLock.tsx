import { useState, useEffect, useCallback, useRef } from 'react';

// Configuration (initial pilot values)
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const BACKGROUND_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const WARNING_BUFFER = 2 * 60 * 1000; // 2 minutes warning before idle lock

const STORAGE_KEY_LAST_ACTIVE = 'hc_last_active';
const STORAGE_KEY_LOCKED = 'hc_session_locked';

export const useSessionLock = () => {
    const [isLocked, setIsLocked] = useState(() => localStorage.getItem(STORAGE_KEY_LOCKED) === 'true');
    const [isWarning, setIsWarning] = useState(false);
    const lastActivityRef = useRef<number>(Date.now());
    const backgroundStartRef = useRef<number | null>(null);

    const lock = useCallback(() => {
        setIsLocked(true);
        setIsWarning(false);
        localStorage.setItem(STORAGE_KEY_LOCKED, 'true');
    }, []);

    const unlock = useCallback(() => {
        setIsLocked(false);
        setIsWarning(false);
        localStorage.removeItem(STORAGE_KEY_LOCKED);
        lastActivityRef.current = Date.now();
        localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, lastActivityRef.current.toString());
    }, []);

    const resetIdleTimer = useCallback(() => {
        if (isLocked) return;
        lastActivityRef.current = Date.now();
        localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, lastActivityRef.current.toString());
        if (isWarning) setIsWarning(false);
    }, [isLocked, isWarning]);

    useEffect(() => {
        // Event listeners for activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        const throttledReset = () => {
            // Throttling to avoid excessive localStorage writes
            if (Date.now() - lastActivityRef.current > 5000) {
                resetIdleTimer();
            }
        };

        events.forEach(name => document.addEventListener(name, throttledReset));

        // Background tracking
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                backgroundStartRef.current = Date.now();
            } else {
                if (backgroundStartRef.current) {
                    const diff = Date.now() - backgroundStartRef.current;
                    if (diff > BACKGROUND_TIMEOUT) {
                        lock();
                    }
                    backgroundStartRef.current = null;
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Core timer to check idle state
        const interval = setInterval(() => {
            if (isLocked) return;

            const now = Date.now();
            const lastActive = parseInt(localStorage.getItem(STORAGE_KEY_LAST_ACTIVE) || now.toString());
            const idleTime = now - lastActive;

            // Check for Lock
            if (idleTime >= IDLE_TIMEOUT) {
                lock();
            }
            // Check for Warning
            else if (idleTime >= (IDLE_TIMEOUT - WARNING_BUFFER)) {
                if (!isWarning) setIsWarning(true);
            }
        }, 5000); // Check every 5 seconds

        return () => {
            events.forEach(name => document.removeEventListener(name, throttledReset));
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(interval);
        };
    }, [isLocked, isWarning, resetIdleTimer, lock]);

    return {
        isLocked,
        isWarning,
        lock,
        unlock,
        resetIdleTimer
    };
};
