type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, string | number | boolean | null | undefined>;

type ScopedLogger = {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  createScoped: (scope: string, context?: LogContext) => ScopedLogger;
  withRequestId: (requestId: string) => ScopedLogger;
};

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const isProduction = process.env.NODE_ENV === 'production';
const minLevel: LogLevel = isProduction ? 'info' : 'debug';

const shouldLog = (level: LogLevel) => LOG_LEVELS[level] >= LOG_LEVELS[minLevel];

const formatContextText = (ctx: LogContext): string => {
  if (Object.keys(ctx).length === 0) return '';
  const pairs = Object.entries(ctx)
    .map(([key, value]) => `${key}=${value ?? 'null'}`)
    .join(' ');
  return ` [${pairs}]`;
};

const formatContextJson = (ctx: LogContext): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(ctx)) {
    result[key] = value ?? null;
  }
  return result;
};

const mergeContext = (base: LogContext | undefined, override: LogContext | undefined): LogContext | undefined => {
  if (!base && !override) return undefined;
  if (!base) return override;
  if (!override) return base;
  return { ...base, ...override };
};

const log = (
  level: LogLevel,
  message: string,
  context?: LogContext,
  scope?: string,
) => {
  if (!shouldLog(level)) return;

  const timestamp = new Date().toISOString();
  const allContext = scope ? { scope, ...context } : context;

  if (isProduction) {
    const payload = JSON.stringify({
      timestamp,
      level,
      message,
      ...formatContextJson(allContext ?? {}),
    });
    if (level === 'error') console.error(payload);
    else if (level === 'warn') console.warn(payload);
    else if (level === 'info') console.info(payload);
    else console.debug(payload);
  } else {
    const scopeStr = scope ? ` [${scope}]` : '';
    const ctxStr = context ? formatContextText(context) : '';
    const line = `${timestamp} ${level.toUpperCase()}${scopeStr} ${message}${ctxStr}`;
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else if (level === 'info') console.info(line);
    else console.debug(line);
  }
};

const createScopedLogger = (scope: string, baseContext?: LogContext): ScopedLogger => {
  const scopedLog = (level: LogLevel, message: string, context?: LogContext) => {
    log(level, message, mergeContext(baseContext, context), scope);
  };

  return {
    debug: (message: string, context?: LogContext) => scopedLog('debug', message, context),
    info: (message: string, context?: LogContext) => scopedLog('info', message, context),
    warn: (message: string, context?: LogContext) => scopedLog('warn', message, context),
    error: (message: string, context?: LogContext) => scopedLog('error', message, context),
    createScoped: (childScope: string, childContext?: LogContext) =>
      createScopedLogger(`${scope}:${childScope}`, mergeContext(baseContext, childContext)),
    withRequestId: (requestId: string) =>
      createScopedLogger(scope, mergeContext(baseContext, { requestId })),
  };
};

export const logger = createScopedLogger('app');
