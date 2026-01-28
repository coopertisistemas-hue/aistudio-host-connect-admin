import { safeLogger } from '@/lib/logging/safeLogger';
import { isFeatureEnabled } from '@/lib/featureFlags';

const marks = new Map<string, number>();

const shouldEmit = () => isFeatureEnabled('SAFE_OBSERVABILITY');

export const startMark = (name: string) => {
  marks.set(name, performance.now());
};

export const endMark = (name: string) => {
  const start = marks.get(name);
  if (start === undefined) return null;
  const durationMs = Math.round(performance.now() - start);
  marks.delete(name);
  return durationMs;
};

export const emitAppBoot = (durationMs: number) => {
  // Safety: do not add identifiers (user/org/email/token) to observability events.
  if (!shouldEmit()) return;
  safeLogger.info('perf.app_boot', { durationMs, mode: import.meta.env.MODE });
};

export const emitRouteLoad = (routeKey: string, durationMs: number) => {
  if (!shouldEmit()) return;
  safeLogger.info('perf.route_load', { routeKey, durationMs });
};

startMark('app_boot');
