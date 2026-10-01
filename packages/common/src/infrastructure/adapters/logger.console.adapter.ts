import type { LogContext, LoggerPort } from '../../application/ports';
import type { LogLevel } from '../../domain/models';

function createLogEntry(
  level: LogLevel,
  message: string,
  component?: string,
  context?: LogContext
): string {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(component && { component })
  };

  if (context) {
    const seen = new WeakSet<object>();
    for (const [key, value] of Object.entries(context)) {
      if (key in entry) continue;
      entry[key] = normalizeLogValue(value, seen);
    }
  }

  try {
    return JSON.stringify(entry);
  } catch {
    return JSON.stringify({
      timestamp: entry['timestamp'],
      level: entry['level'],
      message: entry['message'],
      component: entry['component'],
      _serializationError: 'Failed to serialize full log entry'
    });
  }
}

const RESERVED_ERROR_KEYS = new Set([
  'name',
  'message',
  'stack',
  'cause',
  'logLevel'
]);

function normalizeErrorForLog(
  error: Error,
  seen = new WeakSet<object>()
): Record<string, unknown> {
  if (seen.has(error)) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      _circular: true
    };
  }

  seen.add(error);

  const normalized: Record<string, unknown> = {
    name: error.name,
    message: error.message,
    stack: error.stack
  };

  for (const [key, value] of Object.entries(error)) {
    if (RESERVED_ERROR_KEYS.has(key)) {
      continue;
    }

    normalized[key] = normalizeLogValue(value, seen);
  }

  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause instanceof Error) {
    normalized['cause'] = normalizeErrorForLog(cause, seen);
  }

  return normalized;
}

function normalizeLogValue(value: unknown, seen: WeakSet<object>): unknown {
  if (value instanceof Error) {
    return normalizeErrorForLog(value, seen);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return '[Circular]';
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => normalizeLogValue(item, seen));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const normalized: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    normalized[key] = normalizeLogValue(nestedValue, seen);
  }

  return normalized;
}

function isPlainObject(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export const createConsoleLogger = (component?: string): LoggerPort => ({
  info: (message, context) =>
    console.info(createLogEntry('info', message, component, context)),
  warn: (message, context) =>
    console.warn(createLogEntry('warn', message, component, context)),
  error: (message, context) =>
    console.error(createLogEntry('error', message, component, context))
});
