type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const REDACT_KEYS = [
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'email',
  'phone',
  'password',
  'secret',
  'id',
  'uuid',
  'org_id',
  'property_id',
  'user_id',
  'document',
];

const EMAIL_REGEX = /([A-Z0-9._%+-])([A-Z0-9._%+-]*)(@[A-Z0-9.-]+\.[A-Z]{2,})/gi;
const PHONE_REGEX = /(\+?\d{1,3})?\s?\(?\d{2,3}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}/g;

const shouldLogDebug = () => import.meta.env.MODE !== 'production';

const maskEmail = (value: string) =>
  value.replace(EMAIL_REGEX, (_match, first, middle, domain) => `${first}***${domain}`);

const maskPhone = (value: string) =>
  value.replace(PHONE_REGEX, (match) => `${match.slice(0, 2)}***${match.slice(-2)}`);

const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return maskPhone(maskEmail(value));
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, val]) => {
      const normalizedKey = key.toLowerCase();
      if (REDACT_KEYS.some((redactKey) => normalizedKey.includes(redactKey))) {
        return [key, '[REDACTED]'];
      }
      return [key, sanitizeValue(val)];
    });
    return Object.fromEntries(entries);
  }

  return value;
};

const log = (level: LogLevel, event: string, context?: Record<string, unknown>) => {
  if (level === 'debug' && !shouldLogDebug()) return;

  const payload = context ? sanitizeValue(context) : undefined;
  const message = payload ? `${event} ${JSON.stringify(payload)}` : event;

  switch (level) {
    case 'debug':
      console.debug(message);
      break;
    case 'info':
      console.info(message);
      break;
    case 'warn':
      console.warn(message);
      break;
    case 'error':
      console.error(message);
      break;
  }
};

export const safeLogger = {
  debug: (event: string, context?: Record<string, unknown>) => log('debug', event, context),
  info: (event: string, context?: Record<string, unknown>) => log('info', event, context),
  warn: (event: string, context?: Record<string, unknown>) => log('warn', event, context),
  error: (event: string, context?: Record<string, unknown>) => log('error', event, context),
};
