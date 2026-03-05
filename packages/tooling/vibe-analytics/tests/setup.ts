/**
 * Vitest Test Setup
 */
import { beforeAll, afterAll, vi } from 'vitest';

// Mock global window object for jsdom
beforeAll(() => {
  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  });

  // Mock fetch
  Object.defineProperty(globalThis, 'fetch', {
    value: vi.fn(),
    writable: true,
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});
