import { helloWorld } from '../src/test-exec';
import { describe, it, expect } from 'vitest';

describe('helloWorld', () => {
  it('should return a greeting with the provided name', () => {
    const result = helloWorld('World');
    expect(result).toBe('Hello, World!');
  });

  it('should throw an error if name is empty', () => {
    expect(() => helloWorld('')).toThrow('Name is required');
  });
});
