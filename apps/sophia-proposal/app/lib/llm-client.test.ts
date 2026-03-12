import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generate, generateStream } from './llm-client';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('llm-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generate', () => {
    it('calls API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'Test response', model: 'llama3.2:3b', done: true }),
      });

      await generate('Test prompt');

      expect(mockFetch).toHaveBeenCalledWith('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Test prompt',
          model: 'llama3.2:3b',
          maxTokens: undefined,
          temperature: 0.7,
        }),
      });
    });

    it('uses custom options when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'Response', model: 'custom-model', done: true }),
      });

      await generate('Test', { model: 'custom-model', maxTokens: 1024, temperature: 0.5 });

      expect(mockFetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({
        body: JSON.stringify({
          prompt: 'Test',
          model: 'custom-model',
          maxTokens: 1024,
          temperature: 0.5,
        }),
      }));
    });

    it('throws error when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'API Error', message: 'Custom error message' }),
      });

      await expect(generate('Test')).rejects.toThrow('Custom error message');
    });

    it('throws generic error when message is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'API Error' }),
      });

      await expect(generate('Test')).rejects.toThrow('LLM request failed');
    });
  });

  describe('generateStream', () => {
    it('yields responses from stream', async () => {
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"response": "chunk1"}\n'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"response": "chunk2"}\n'),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader },
      });

      const results: string[] = [];
      for await (const chunk of generateStream('Test prompt')) {
        results.push(chunk);
      }

      expect(results).toEqual(['chunk1', 'chunk2']);
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('throws error when response body is null', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: null,
      });

      const stream = generateStream('Test');
      await expect(stream.next()).rejects.toThrow('No response body');
    });

    it('throws error when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        body: { getReader: vi.fn() },
      });

      const stream = generateStream('Test');
      await expect(stream.next()).rejects.toThrow('Stream request failed');
    });

    it('ignores malformed JSON in stream', async () => {
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: invalid json\n'),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader },
      });

      const results: string[] = [];
      for await (const chunk of generateStream('Test')) {
        results.push(chunk);
      }

      expect(results).toEqual([]);
    });
  });
});
