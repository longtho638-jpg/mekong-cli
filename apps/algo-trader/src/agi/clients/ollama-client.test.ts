import { OllamaClient } from './ollama-client';
import { ChatRequest, ChatMessage } from '../types/ollama.types';

// Mock fetch globally
global.fetch = jest.fn();

const createMockResponse = (data: any, ok = true) => {
  return {
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? 'OK' : 'Error',
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as unknown as Response;
};

describe('OllamaClient', () => {
  let client: OllamaClient;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    mockFetch = global.fetch as jest.Mock;
    client = new OllamaClient({
      baseURL: 'http://localhost:11434',
      model: 'test-model',
      timeout: 5000,
      maxRetries: 3,
    });
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
    const mockResponse = {
      model: 'llama3.1:8b',
      response: 'Market analysis: overbought',
      done: true,
    };

    it('should call generate endpoint with correct payload', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await client.generate({
        prompt: 'Analyze market',
        model: 'llama3.1:8b',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should use default model when not specified', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

      await client.generate({ prompt: 'Test' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            model: 'test-model',
            prompt: 'Test',
            stream: false,
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      // Mock all retry attempts (default maxRetries=3)
      mockFetch
        .mockResolvedValueOnce(createMockResponse({}, false))
        .mockResolvedValueOnce(createMockResponse({}, false))
        .mockResolvedValueOnce(createMockResponse({}, false));

      await expect(client.generate({ prompt: 'Test' })).rejects.toThrow('Ollama API error: 500 Error');
    });
  });

  describe('chat()', () => {
    const mockMessages: ChatMessage[] = [
      { role: 'system', content: 'You are a trading assistant' },
      { role: 'user', content: 'Should I buy BTC?' },
    ];

    const mockResponse = {
      model: 'llama3.1:8b',
      message: { role: 'assistant', content: 'Analysis...' },
      done: true,
    };

    it('should call chat endpoint with messages', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

      const request: ChatRequest = { messages: mockMessages };
      const result = await client.chat(request);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.message.content).toBe('Analysis...');
    });

    it('should handle chat API errors', async () => {
      // Mock all retry attempts (default maxRetries=3)
      mockFetch
        .mockResolvedValueOnce(createMockResponse({}, false))
        .mockResolvedValueOnce(createMockResponse({}, false))
        .mockResolvedValueOnce(createMockResponse({}, false));

      await expect(client.chat({ messages: mockMessages })).rejects.toThrow('Ollama API error: 500 Error');
    });
  });

  describe('health()', () => {
    it('should return true when Ollama is healthy', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}, true));

      const result = await client.health();
      expect(result).toBe(true);
    });

    it('should return false when Ollama is down', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await client.health();
      expect(result).toBe(false);
    });

    it('should return false on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}, false));

      const result = await client.health();
      expect(result).toBe(false);
    });
  });

  describe('retry logic', () => {
    const mockResponse = { response: 'success', done: true, model: 'test' };

    it('should succeed on first attempt', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await client.generate({ prompt: 'test' });
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.done).toBe(true);
    });

    it('should retry after failure', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await client.generate({ prompt: 'test' });
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.done).toBe(true);
    }, 10000);

    it('should throw after max retries', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Persistent error'))
        .mockRejectedValueOnce(new Error('Persistent error'))
        .mockRejectedValueOnce(new Error('Persistent error'));

      await expect(client.generate({ prompt: 'test' })).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(3); // maxRetries=3 means 3 total attempts
    }, 15000);
  });
});
