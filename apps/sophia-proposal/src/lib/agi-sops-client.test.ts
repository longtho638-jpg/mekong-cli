/**
 * Tests for AgiSopsClient API
 * Validates API client methods with mocked fetch
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgiSopsClient } from '../lib/agi-sops-client';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock URL to work in jsdom environment
const OriginalURL = global.URL;
class MockURL extends OriginalURL {
  constructor(url: string, base?: string | URL) {
    // If url starts with /, prepend a base URL
    if (url.startsWith('/')) {
      super(url, 'http://localhost:3000');
    } else {
      super(url, base);
    }
  }
}
global.URL = MockURL as typeof URL;

describe('AgiSopsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('listSops', () => {
    it('should fetch and return SOP list successfully', async () => {
      const mockResponse: { sops: Array<{ name: string; version: string; description: string; steps_count: number }> } = {
        sops: [
          {
            name: 'deploy-sop',
            version: '1.0.0',
            description: 'Deployment SOP',
            steps_count: 5,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await AgiSopsClient.listSops();

      expect(fetch).toHaveBeenCalledWith('/api/agi-sops/sops');
      expect(result.sops).toHaveLength(1);
      expect(result.sops[0].name).toBe('deploy-sop');
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(AgiSopsClient.listSops()).rejects.toThrow('Failed to list SOPs');
    });
  });

  describe('getSop', () => {
    it('should fetch SOP by name successfully', async () => {
      const mockSop = {
        name: 'deploy-sop',
        version: '1.0.0',
        description: 'Deployment SOP',
        steps: [],
        quality_gates: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSop,
      });

      const result = await AgiSopsClient.getSop('deploy-sop');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/agi-sops/sops/deploy-sop');
      expect(result.name).toBe('deploy-sop');
    });

    it('should fetch SOP with version parameter', async () => {
      const mockSop = {
        name: 'deploy-sop',
        version: '2.0.0',
        description: 'Deployment SOP v2',
        steps: [],
        quality_gates: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSop,
      });

      const result = await AgiSopsClient.getSop('deploy-sop', '2.0.0');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/agi-sops/sops/deploy-sop?version=2.0.0');
      expect(result.version).toBe('2.0.0');
    });

    it('should throw error when SOP not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(AgiSopsClient.getSop('non-existent')).rejects.toThrow('Failed to get SOP: non-existent');
    });
  });

  describe('createSop', () => {
    it('should create new SOP successfully', async () => {
      const mockSop = {
        name: 'new-sop',
        version: '1.0.0',
        description: '',
        steps: [],
        quality_gates: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSop,
      });

      const result = await AgiSopsClient.createSop('new-sop');

      expect(fetch).toHaveBeenCalledWith('/api/agi-sops/sops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'new-sop' }),
      });
      expect(result.name).toBe('new-sop');
    });

    it('should throw error when creation fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(AgiSopsClient.createSop('new-sop')).rejects.toThrow('Failed to create SOP: new-sop');
    });
  });

  describe('runSop', () => {
    it('should run SOP successfully', async () => {
      const mockResult = {
        success: true,
        status: 'success' as const,
        sop_name: 'deploy-sop',
        steps_completed: 5,
        steps_failed: 0,
        steps_skipped: 0,
        duration_ms: 2500,
        outputs: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await AgiSopsClient.runSop('deploy-sop');

      expect(fetch).toHaveBeenCalledWith('/api/agi-sops/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'deploy-sop', version: undefined }),
      });
      expect(result.success).toBe(true);
      expect(result.steps_completed).toBe(5);
    });

    it('should run SOP with version', async () => {
      const mockResult = {
        success: true,
        status: 'success' as const,
        sop_name: 'deploy-sop',
        steps_completed: 5,
        steps_failed: 0,
        steps_skipped: 0,
        outputs: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      await AgiSopsClient.runSop('deploy-sop', '1.0.0');

      expect(fetch).toHaveBeenCalledWith('/api/agi-sops/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'deploy-sop', version: '1.0.0' }),
      });
    });

    it('should throw error when run fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(AgiSopsClient.runSop('deploy-sop')).rejects.toThrow('Failed to run SOP: deploy-sop');
    });
  });

  describe('cook', () => {
    it('should cook with goal successfully', async () => {
      const mockResult = {
        success: true,
        status: 'success' as const,
        sop_name: 'cook-goal',
        steps_completed: 3,
        steps_failed: 0,
        steps_skipped: 0,
        outputs: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await AgiSopsClient.cook('Deploy to production');

      expect(fetch).toHaveBeenCalledWith('/api/agi-sops/cook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: 'Deploy to production' }),
      });
      expect(result.success).toBe(true);
    });

    it('should cook with verbose option', async () => {
      const mockResult = {
        success: true,
        status: 'success' as const,
        sop_name: 'cook-goal',
        steps_completed: 3,
        steps_failed: 0,
        steps_skipped: 0,
        outputs: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      await AgiSopsClient.cook('Deploy to production', { verbose: true });

      expect(fetch).toHaveBeenCalledWith('/api/agi-sops/cook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: 'Deploy to production', verbose: true, dryRun: undefined }),
      });
    });

    it('should cook with dryRun option', async () => {
      const mockResult = {
        success: true,
        status: 'success' as const,
        sop_name: 'cook-goal',
        steps_completed: 0,
        steps_failed: 0,
        steps_skipped: 3,
        outputs: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      await AgiSopsClient.cook('Deploy to production', { dryRun: true });

      expect(fetch).toHaveBeenCalledWith('/api/agi-sops/cook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: 'Deploy to production', verbose: undefined, dryRun: true }),
      });
    });

    it('should throw error when cook fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(AgiSopsClient.cook('Deploy')).rejects.toThrow('Failed to cook: Deploy');
    });
  });

  describe('plan', () => {
    it('should generate plan successfully', async () => {
      const mockPlan = {
        plan: 'Deploy using CI/CD',
        steps: [
          { id: '1', description: 'Run tests', command: 'npm test' },
          { id: '2', description: 'Build', command: 'npm run build' },
          { id: '3', description: 'Deploy' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlan,
      });

      const result = await AgiSopsClient.plan('Deploy to production');

      expect(fetch).toHaveBeenCalledWith('/api/agi-sops/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: 'Deploy to production' }),
      });
      expect(result.plan).toBe('Deploy using CI/CD');
      expect(result.steps).toHaveLength(3);
    });

    it('should throw error when plan fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(AgiSopsClient.plan('Deploy')).rejects.toThrow('Failed to plan: Deploy');
    });
  });

  describe('search', () => {
    it('should search SOPs successfully', async () => {
      const mockResults = {
        results: [
          {
            name: 'deploy-sop',
            content: 'Deployment procedure',
            distance: 0.15,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults,
      });

      const result = await AgiSopsClient.search('deploy');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/agi-sops/search?query=deploy&limit=5');
      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('deploy-sop');
    });

    it('should search with custom limit', async () => {
      const mockResults = {
        results: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults,
      });

      await AgiSopsClient.search('deploy', 10);

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/agi-sops/search?query=deploy&limit=10');
    });

    it('should throw error when search fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(AgiSopsClient.search('deploy')).rejects.toThrow('Failed to search: deploy');
    });
  });
});
