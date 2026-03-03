type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

type RateLimitBucket = {
  count: number;
  windowStartMs: number;
};

const API_VERSION = "v1.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-version, x-api-scope, x-api-scopes, x-client-id, x-public-api-key",
};

function getRateLimitStore(): Map<string, RateLimitBucket> {
  const g = globalThis as typeof globalThis & {
    __publicApiRateLimitStore?: Map<string, RateLimitBucket>;
  };

  if (!g.__publicApiRateLimitStore) {
    g.__publicApiRateLimitStore = new Map<string, RateLimitBucket>();
  }

  return g.__publicApiRateLimitStore;
}

export function buildTraceId(): string {
  return crypto.randomUUID();
}

export function getCorsHeaders(): Record<string, string> {
  return CORS_HEADERS;
}

export function getApiVersion(): string {
  return API_VERSION;
}

export function jsonResponse(
  status: number,
  payload: Record<string, unknown>,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      ...(extraHeaders ?? {}),
    },
  });
}

export function enforceMethod(req: Request, allowedMethod: string): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== allowedMethod) {
    return jsonResponse(405, {
      contract_version: API_VERSION,
      code: "METHOD_NOT_ALLOWED",
      error: `Method ${req.method} not allowed.`,
    });
  }
  return null;
}

export function parseScopes(req: Request): Set<string> {
  const raw = req.headers.get("x-api-scopes") ?? req.headers.get("x-api-scope") ?? "";
  return new Set(
    raw
      .split(",")
      .map((scope) => scope.trim())
      .filter((scope) => scope.length > 0),
  );
}

export function enforceScope(req: Request, requiredScope: string): Response | null {
  const scopes = parseScopes(req);
  if (!scopes.has(requiredScope)) {
    return jsonResponse(403, {
      contract_version: API_VERSION,
      code: "SCOPE_REQUIRED",
      error: `Missing required scope: ${requiredScope}`,
      required_scope: requiredScope,
    });
  }
  return null;
}

export function rateLimitKey(req: Request, endpoint: string): string {
  const clientId = req.headers.get("x-client-id")?.trim();
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  const identity = clientId || forwardedFor || cfIp || "anonymous";
  return `${endpoint}:${identity}`;
}

export function enforceRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const store = getRateLimitStore();
  const now = Date.now();
  const current = store.get(key);

  if (!current || now - current.windowStartMs >= windowMs) {
    store.set(key, { count: 1, windowStartMs: now });
    return { allowed: true, retryAfterSeconds: 0, remaining: Math.max(0, limit - 1) };
  }

  if (current.count >= limit) {
    const retryAfterSeconds = Math.ceil((windowMs - (now - current.windowStartMs)) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfterSeconds), remaining: 0 };
  }

  current.count += 1;
  store.set(key, current);
  return {
    allowed: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, limit - current.count),
  };
}

export function auditLog(event: string, payload: Record<string, unknown>): void {
  console.log(JSON.stringify({ event, ...payload }));
}

