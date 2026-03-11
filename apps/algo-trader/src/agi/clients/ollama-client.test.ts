import { OllamaClient } from './ollama-client';
import { GenerateRequest, ChatRequest, ChatMessage } from '../types/ollama.types';

// Mock fetch globally
global.fetch = jest.fn();

// Helper to create mock response
const createMockResponse = (data: any, options = { ok: true }) => ({
  ok: options.ok,
  status: options.ok ? 200 : 500,
  statusText: options.ok ? 'OK' : 'Error',
  json: async () => data,
});

describe('OllamaClient', () => {
  let client: OllamaClient;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new OllamaClient({
      baseURL: 'http://localhost:11434',
      model: 'test-model',
      timeout: 5000,
      maxRetries: 2,
    });
    mockFetch = global.fetch as jest.Mock;
  });

  describe('constructor', () => {
    it('should use default config when no config provided', () => {
      const defaultClient = new OllamaClient();
      expect(defaultClient).toBeDefined();
    });

    it('should merge custom config with defaults', () => {
      const customClient = new OllamaClient({
        baseURL: 'http://custom:11434',
        model: 'custom-model',
      });
      expect(customClient).toBeDefined();
    });
  });

  describe('generate()', () => {
    const mockRequest: GenerateRequest = {
      prompt: 'Analyze this market: RSI=72',
      model: 'llama3.1:8b',
    };

    const mockResponse = {
      model: 'llama3.1:8b',
      response: 'Market is overbought based on RSI',
      done: true,
    };

    it('should call generate endpoint with correct payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.generate(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3.1:8b',
            prompt: 'Analyze this market: RSI=72',
            stream: false,
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should use default model when request model not specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.generate({ prompt: 'Test' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            model: 'test-model',
            prompt: 'Test',
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(client.generate(mockRequest)).rejects.toThrow(
        'Ollama API error: 500 Internal Server Error'
      );
    });

    it('should retry on failure with exponential backoff', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      const result = await client.generate(mockRequest);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockResponse);
    }, 15000);

    it('should throw after max retries exceeded', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.generate(mockRequest)).rejects.toThrow('Network error');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    }, 15000);

    it('should respect timeout', async () => {
      mockFetch.mockImplementationOnce(() => {
        return new Promise((resolve) => {
          setTimeout(resolve, 10000);
        });
      });

      await expect(client.generate(mockRequest)).rejects.toThrow();
    }, 10000);
  });

  describe('chat()', () => {
    const mockMessages: ChatMessage[] = [
      { role: 'system', content: 'You are a trading assistant' },
      { role: 'user', content: 'Should I buy BTC?' },
    ];

    const mockResponse = {
      model: 'llama3.1:8b',
      message: { role: 'assistant', content: 'Based on analysis...' },
      done: true,
    };

    it('should call chat endpoint with correct payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request: ChatRequest = {
        messages: mockMessages,
        model: 'llama3.1:8b',
      };

      const result = await client.chat(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/chat',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            model: 'llama3.1:8b',
            messages: mockMessages,
            stream: false,
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle chat API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(
        client.chat({ messages: mockMessages })
      ).rejects.toThrow('Ollama API error: 400 Bad Request');
    });
  });

  describe('health()', () => {
    it('should return true when Ollama is healthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const result = await client.health();
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/tags',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return false when Ollama is down', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await client.health();
      expect(result).toBe(false);
    });

    it('should return false on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const result = await client.health();
      expect(result).toBe(false);
    });
  });

  describe('executeWithRetry()', () => {
    it('should succeed on first attempt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'success', done: true }),
      });

      const result = await client.generate({ prompt: 'test' });
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.done).toBe(true);
    });

    it('should retry with exponential backoff', async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((fn: () => void, delay: number) => {
        delays.push(delay);
        return originalSetTimeout(fn, 0);
      }) as any;

      mockFetch
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ response: 'success', done: true }),
        });

      await client.generate({ prompt: 'test' });

      expect(delays).toEqual([2000, 4000]); // 2^1*1000, 2^2*1000
      global.setTimeout = originalSetTimeout;
    }, 15000);
  });
});
