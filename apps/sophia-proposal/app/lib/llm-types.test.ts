import { describe, it, expect } from 'vitest';
import type { LLMRequest, LLMResponse, LLMStreamChunk, LLMError } from './llm-types';

describe('LLM Types', () => {
  describe('LLMRequest', () => {
    it('has required prompt field', () => {
      const request: LLMRequest = { prompt: 'Test prompt' };
      expect(request.prompt).toBe('Test prompt');
    });

    it('has optional model field', () => {
      const request: LLMRequest = { prompt: 'Test', model: 'llama3.2:3b' };
      expect(request.model).toBe('llama3.2:3b');
    });

    it('has optional maxTokens field', () => {
      const request: LLMRequest = { prompt: 'Test', maxTokens: 512 };
      expect(request.maxTokens).toBe(512);
    });

    it('has optional temperature field', () => {
      const request: LLMRequest = { prompt: 'Test', temperature: 0.7 };
      expect(request.temperature).toBe(0.7);
    });

    it('has optional stream field', () => {
      const request: LLMRequest = { prompt: 'Test', stream: true };
      expect(request.stream).toBe(true);
    });

    it('has all fields combined', () => {
      const request: LLMRequest = {
        prompt: 'Full test',
        model: 'llama3.2:3b',
        maxTokens: 1024,
        temperature: 0.5,
        stream: false,
      };
      expect(request.prompt).toBe('Full test');
      expect(request.model).toBe('llama3.2:3b');
      expect(request.maxTokens).toBe(1024);
      expect(request.temperature).toBe(0.5);
      expect(request.stream).toBe(false);
    });
  });

  describe('LLMResponse', () => {
    it('has required response field', () => {
      const response: LLMResponse = { response: 'Generated text', model: 'llama3.2:3b', done: true };
      expect(response.response).toBe('Generated text');
    });

    it('has required model field', () => {
      const response: LLMResponse = { response: 'Text', model: 'llama3.2:3b', done: true };
      expect(response.model).toBe('llama3.2:3b');
    });

    it('has required done field', () => {
      const response: LLMResponse = { response: 'Text', model: 'llama3.2:3b', done: false };
      expect(response.done).toBe(false);
    });
  });

  describe('LLMStreamChunk', () => {
    it('has response and done fields', () => {
      const chunk: LLMStreamChunk = { response: 'chunk', done: false };
      expect(chunk.response).toBe('chunk');
      expect(chunk.done).toBe(false);
    });
  });

  describe('LLMError', () => {
    it('has error and message fields', () => {
      const error: LLMError = { error: 'API Error', message: 'Failed to connect' };
      expect(error.error).toBe('API Error');
      expect(error.message).toBe('Failed to connect');
    });
  });
});
