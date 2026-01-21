/* eslint-env node */
require('@testing-library/jest-dom')

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
process.env.POLAR_ACCESS_TOKEN = 'test-polar-token'

// Polyfill Fetch API globals for Node.js environment in Jest
// Node.js 18+ has these globals, but JSDOM might not expose them
if (typeof Request === 'undefined' && typeof globalThis.Request !== 'undefined') {
  global.Request = globalThis.Request;
}
if (typeof Response === 'undefined' && typeof globalThis.Response !== 'undefined') {
  global.Response = globalThis.Response;
}
if (typeof Headers === 'undefined' && typeof globalThis.Headers !== 'undefined') {
  global.Headers = globalThis.Headers;
}

// If they are still undefined (older Node), use a basic mock
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
    }
  };
}

if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init) {
      this._map = new Map();
      if (init) {
        if (init instanceof Headers) {
          init.forEach((v, k) => this._map.set(k, v));
        } else if (Array.isArray(init)) {
          init.forEach(([k, v]) => this._map.set(k, v));
        } else {
          Object.entries(init).forEach(([k, v]) => this._map.set(k, v));
        }
      }
    }
    get(name) { return this._map.get(name.toLowerCase()) || null; }
    set(name, value) { this._map.set(name.toLowerCase(), value); }
    forEach(cb) { this._map.forEach(cb); }
    getSetCookie() { return []; } // Polyfill for Next.js 15+ requirements
  };
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new Headers(init?.headers);
    }
    static json(data, init) {
      const body = JSON.stringify(data);
      const headers = new Headers(init?.headers);
      headers.set('content-type', 'application/json');
      return new Response(body, { ...init, headers });
    }
  };
}
