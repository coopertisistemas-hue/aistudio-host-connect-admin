import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { normalizeRouteKey } from '@/lib/navigation/routeLoaders';
import { emitRouteLoad, endMark, startMark } from '@/lib/observability/metrics';

const RoutePerformanceTracker = () => {
  const location = useLocation();
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const routeKey = normalizeRouteKey(location.pathname);
    if (lastKeyRef.current === routeKey) return;
    lastKeyRef.current = routeKey;

    startMark(`route:${routeKey}`);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const durationMs = endMark(`route:${routeKey}`);
        if (durationMs !== null) {
          emitRouteLoad(routeKey, durationMs);
        }
      });
    });
  }, [location.pathname]);

  return null;
};

export default RoutePerformanceTracker;
