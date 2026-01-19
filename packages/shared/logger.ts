/**
 * 🏯 AgencyOS Structured Logger
 *
 * Centralized logging utility for production-ready error handling.
 * Designed to replace raw console.log/error statements.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
  error?: string;
  stack?: string;
}

// Environment detection
const isDevelopment =
  typeof process !== "undefined" && process.env.NODE_ENV === "development";
const isProduction =
  typeof process !== "undefined" && process.env.NODE_ENV === "production";

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  const { level, message, timestamp, data, error, stack } = entry;
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  let output = `${prefix} ${message}`;

  if (data && Object.keys(data).length > 0) {
    output += ` ${JSON.stringify(data)}`;
  }

  if (error) {
    output += ` | Error: ${error}`;
  }

  if (stack && isDevelopment) {
    output += `\n${stack}`;
  }

  return output;
}

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  dataOrError?: Record<string, unknown> | unknown,
): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  if (dataOrError) {
    if (dataOrError instanceof Error) {
      entry.error = dataOrError.message;
      entry.stack = dataOrError.stack;
    } else if (typeof dataOrError === "object" && dataOrError !== null) {
      entry.data = dataOrError as Record<string, unknown>;
    }
  }

  return entry;
}

/**
 * Logger instance
 */
export const logger = {
  /**
   * Debug level - only shown in development
   */
  debug: (message: string, data?: Record<string, unknown>): void => {
    if (!isDevelopment) return;
    const entry = createLogEntry("debug", message, data);
    console.debug(formatLogEntry(entry));
  },

  /**
   * Info level - general information
   */
  info: (message: string, data?: Record<string, unknown>): void => {
    const entry = createLogEntry("info", message, data);
    console.info(formatLogEntry(entry));
  },

  /**
   * Warn level - warnings that don't stop execution
   */
  warn: (message: string, data?: Record<string, unknown>): void => {
    const entry = createLogEntry("warn", message, data);
    console.warn(formatLogEntry(entry));
  },

  /**
   * Error level - errors with optional Error object
   */
  error: (message: string, error?: unknown): void => {
    const entry = createLogEntry("error", message, error);
    console.error(formatLogEntry(entry));
  },

  /**
   * Extract error message safely from unknown error
   */
  getErrorMessage: (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "Unknown error";
  },
};

/**
 * Convenience aliases
 */
export const log = logger;
export default logger;
