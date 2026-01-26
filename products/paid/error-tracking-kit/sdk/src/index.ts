interface Config {
  dsn: string;
  environment?: string;
  release?: string;
  debug?: boolean;
}

interface Context {
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
  tags?: Record<string, string>;
}

class ErrorTracker {
  private config: Config;
  private context: Context = {};
  private breadcrumbs: any[] = [];

  constructor(config: Config) {
    this.config = config;
    this.setupGlobalHandlers();
    if (this.config.debug) {
      console.log('ErrorTracker initialized with config:', config);
    }
  }

  private setupGlobalHandlers() {
    if (typeof window !== 'undefined') {
      window.onerror = (message, source, lineno, colno, error) => {
        this.captureException(error || new Error(message as string), {
          source,
          lineno,
          colno,
        });
      };

      window.onunhandledrejection = (event) => {
        this.captureException(event.reason);
      };
    }
  }

  public setUser(user: Context['user']) {
    this.context.user = user;
  }

  public setTag(key: string, value: string) {
    if (!this.context.tags) {
      this.context.tags = {};
    }
    this.context.tags[key] = value;
  }

  public addBreadcrumb(message: string, category: string = 'log') {
    this.breadcrumbs.push({
      message,
      category,
      timestamp: Date.now() / 1000,
    });
    // Keep last 50
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs.shift();
    }
  }

  public captureException(error: any, extra?: any) {
    if (this.config.debug) {
      console.error('ErrorTracker captured:', error);
    }

    const payload = this.buildPayload(error, extra);
    this.send(payload);
  }

  private buildPayload(error: any, extra?: any) {
    // Parse stack trace (simple version)
    // In a real SDK, we'd use a stack trace parser library
    const stacktrace = this.parseStack(error.stack);

    return {
      exception: {
        type: error.name || 'Error',
        value: error.message || String(error),
        stacktrace,
      },
      breadcrumbs: this.breadcrumbs,
      context: this.context,
      environment: this.config.environment || 'production',
      release: this.config.release,
      extra,
      // User info
      user: this.context.user,
      tags: this.context.tags || {},
      request: typeof window !== 'undefined' ? {
        url: window.location.href,
        user_agent: window.navigator.userAgent,
      } : undefined
    };
  }

  private parseStack(stackString?: string) {
    if (!stackString) return [];

    return stackString
      .split('\n')
      .slice(1) // Skip first line (Error message)
      .map(line => {
        // Very basic parsing: "    at funcName (filename:lineno:colno)"
        const match = line.match(/^\s*at (?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+))\)?$/);
        if (match) {
          return {
            function: match[1] || '<anonymous>',
            filename: match[2],
            lineno: parseInt(match[3]),
            colno: parseInt(match[4]),
            in_app: true // simplified
          };
        }
        // Fallback for lines like "    at filename:lineno:colno"
        const fallback = line.match(/^\s*at (?:(.+?):(\d+):(\d+))$/);
         if (fallback) {
          return {
            function: '<anonymous>',
            filename: fallback[1],
            lineno: parseInt(fallback[2]),
            colno: parseInt(fallback[3]),
            in_app: true
          };
        }
        return { filename: line.trim(), lineno: 0, function: '?' };
      })
      .filter(f => f.filename !== 'ErrorTracker.ts'); // Exclude self if possible (naive)
  }

  private async send(payload: any) {
    try {
      const url = `${this.extractBaseUrl(this.config.dsn)}/api/v1/envelope?dsn=${this.config.dsn}`;

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error('ErrorTracker failed to send report:', e);
    }
  }

  private extractBaseUrl(dsn: string): string {
    // Naive implementation assuming DSN is just the API Key for now
    // In Sentry, DSN is a URL. Here we might just treat it as a key or a URL.
    // If the DSN is just a key, we need a separate endpoint config or assume same origin if relative?
    // Let's assume for this kit the DSN IS the API Key, and the endpoint needs to be configured
    // OR we assume a default endpoint if not provided.

    // Correction: For this kit to be standalone, let's make the DSN include the host.
    // Format: http://host:port/api_key
    // OR we just pass `endpoint` in config.

    // Let's rely on config.dsn being the API Key, and assume the user calls init with an endpoint too?
    // Or we hardcode to the backend URL for this kit.
    // To make it flexible, let's add `endpoint` to Config.

    // Wait, the previous plan said "POST /api/v1/envelope".
    // Let's change Config to require `endpoint` or derive it.
    // Let's assume `dsn` is just the API Key string for simplicity in this MVP.
    // And add `baseUrl` to config.
    return 'http://localhost:8000'; // Default for local dev
  }
}

// Global instance
let tracker: ErrorTracker | null = null;

export function init(config: Config & { baseUrl?: string }) {
  // Allow overriding baseUrl
  const instance = new ErrorTracker(config);
  // Monkey patch extractBaseUrl if baseUrl is provided
  if (config.baseUrl) {
    (instance as any).extractBaseUrl = () => config.baseUrl;
  }
  tracker = instance;
  return tracker;
}

export function captureException(error: any) {
  if (tracker) {
    tracker.captureException(error);
  } else {
    console.warn('ErrorTracker not initialized. Call init() first.');
  }
}
