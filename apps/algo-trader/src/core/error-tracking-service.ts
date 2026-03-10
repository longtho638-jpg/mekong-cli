import { logger } from '../utils/logger';

export interface ErrorContext {
  userId?: string;
  tenantId?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface TrackedError {
  id: string;
  message: string;
  stack?: string;
  timestamp: string;
  severity: 'critical' | 'error' | 'warning';
  context?: ErrorContext;
  resolved: boolean;
}

interface ErrorBucket {
  errors: TrackedError[];
  windowStart: number;
  windowMs: number;
}

/**
 * Error Tracking Service - Sentry-style error tracking for production
 */
export class ErrorTrackingService {
  private static instance: ErrorTrackingService;
  private errorBuckets = new Map<string, ErrorBucket>();
  private maxErrorsPerWindow = 100;
  private defaultWindowMs = 5 * 60 * 1000; // 5 minutes
  private errorHandlers: ((error: TrackedError) => void)[] = [];

  private constructor() {}

  static getInstance(): ErrorTrackingService {
    if (!ErrorTrackingService.instance) {
      ErrorTrackingService.instance = new ErrorTrackingService();
    }
    return ErrorTrackingService.instance;
  }

  track(
    error: Error | unknown,
    severity: 'critical' | 'error' | 'warning' = 'error',
    context?: ErrorContext
  ): TrackedError | null {
    const trackedError = this.createTrackedError(error, severity, context);
    const bucketKey = this.getBucketKey(trackedError);

    if (this.isDuplicate(bucketKey, trackedError)) {
      logger.debug(`Duplicate error suppressed: ${trackedError.message}`);
      return null;
    }

    this.storeError(bucketKey, trackedError);
    this.notifyHandlers(trackedError);
    this.logError(trackedError);

    return trackedError;
  }

  on_error(handler: (error: TrackedError) => void): void {
    this.errorHandlers.push(handler);
  }

  getRecentErrors(limit = 10): TrackedError[] {
    const allErrors: TrackedError[] = [];
    Array.from(this.errorBuckets.values()).forEach((bucket) => {
      allErrors.push(...bucket.errors);
    });
    return allErrors
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  clear(): void {
    this.errorBuckets.clear();
  }

  private createTrackedError(
    error: Error | unknown,
    severity: 'critical' | 'error' | 'warning',
    context?: ErrorContext
  ): TrackedError {
    const isError = error instanceof Error;
    return {
      id: this.generateId(),
      message: isError ? error.message : String(error),
      stack: isError ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      severity,
      context,
      resolved: false,
    };
  }

  private getBucketKey(error: TrackedError): string {
    return `${error.severity}:${error.message}`;
  }

  private isDuplicate(bucketKey: string, error: TrackedError): boolean {
    const bucket = this.errorBuckets.get(bucketKey);
    if (!bucket) return false;

    const recent = bucket.errors.filter(
      e => Date.now() - new Date(e.timestamp).getTime() < bucket.windowMs
    );
    return recent.length > 0;
  }

  private storeError(bucketKey: string, error: TrackedError): void {
    let bucket = this.errorBuckets.get(bucketKey);

    if (!bucket) {
      bucket = {
        errors: [],
        windowStart: Date.now(),
        windowMs: this.defaultWindowMs,
      };
      this.errorBuckets.set(bucketKey, bucket);
    }

    bucket.errors = bucket.errors.filter(
      e => Date.now() - new Date(e.timestamp).getTime() < bucket.windowMs
    );

    if (bucket.errors.length < this.maxErrorsPerWindow) {
      bucket.errors.push(error);
    }
  }

  private notifyHandlers(error: TrackedError): void {
    for (const handler of this.errorHandlers) {
      try {
        handler(error);
      } catch (e) {
        logger.error(`Error handler threw: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  private logError(error: TrackedError): void {
    const message = `[${error.severity.toUpperCase()}] ${error.message}`;

    switch (error.severity) {
      case 'critical':
        logger.error(`[CRITICAL] ${message} - Context: ${JSON.stringify(error.context)}`);
        break;
      case 'error':
        logger.error(message);
        break;
      case 'warning':
        logger.warn(message);
        break;
    }
  }

  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export function trackError(
  error: Error | unknown,
  severity: 'critical' | 'error' | 'warning' = 'error',
  context?: ErrorContext
): TrackedError | null {
  return ErrorTrackingService.getInstance().track(error, severity, context);
}

export function onCriticalError(handler: (error: TrackedError) => void): void {
  ErrorTrackingService.getInstance().on_error((error) => {
    if (error.severity === 'critical') {
      handler(error);
    }
  });
}

export function getRecentErrors(limit = 10): TrackedError[] {
  return ErrorTrackingService.getInstance().getRecentErrors(limit);
}
