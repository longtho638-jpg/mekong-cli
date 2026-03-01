import { describe, it, expect } from 'vitest';
import type { MediaAnalysis, MediaFlag } from './media-facade';

describe('MediaFlag shape', () => {
  it('should accept all valid flag types', () => {
    const types: MediaFlag['type'][] = [
      'deepfake',
      'manipulation',
      'misinformation',
      'copyright',
      'nsfw',
    ];
    expect(types).toHaveLength(5);
    for (const type of types) {
      expect(typeof type).toBe('string');
    }
  });

  it('should construct a flag with optional timestamp', () => {
    const flag: MediaFlag = {
      type: 'deepfake',
      confidence: 0.92,
      details: 'Face swap detected at frame 120',
      timestamp: 4.0,
    };
    expect(flag.timestamp).toBe(4.0);
    expect(flag.confidence).toBeGreaterThan(0.5);
  });

  it('should construct a flag without timestamp', () => {
    const flag: MediaFlag = {
      type: 'copyright',
      confidence: 0.75,
      details: 'Music fingerprint matched',
    };
    expect(flag.timestamp).toBeUndefined();
  });

  it('confidence should be between 0 and 1', () => {
    const confidences = [0, 0.5, 1];
    for (const confidence of confidences) {
      const flag: MediaFlag = { type: 'nsfw', confidence, details: 'test' };
      expect(flag.confidence).toBeGreaterThanOrEqual(0);
      expect(flag.confidence).toBeLessThanOrEqual(1);
    }
  });
});

describe('MediaAnalysis shape', () => {
  it('should construct a clean analysis with no flags', () => {
    const analysis: MediaAnalysis = {
      id: 'media-001',
      type: 'image',
      trustScore: 0.98,
      flags: [],
      metadata: { width: 1920, height: 1080 },
    };
    expect(analysis.flags).toHaveLength(0);
    expect(analysis.trustScore).toBeCloseTo(0.98);
  });

  it('should accept all media types', () => {
    const types: MediaAnalysis['type'][] = ['video', 'image', 'audio', 'text'];
    for (const type of types) {
      const analysis: MediaAnalysis = {
        id: `id-${type}`,
        type,
        trustScore: 1,
        flags: [],
        metadata: {},
      };
      expect(analysis.type).toBe(type);
    }
  });

  it('should construct analysis with multiple flags', () => {
    const analysis: MediaAnalysis = {
      id: 'media-002',
      type: 'video',
      trustScore: 0.3,
      flags: [
        { type: 'deepfake', confidence: 0.88, details: 'Face swap', timestamp: 2.5 },
        { type: 'manipulation', confidence: 0.61, details: 'Color grading altered' },
      ],
      metadata: { duration: 30, fps: 24 },
    };
    expect(analysis.flags).toHaveLength(2);
    expect(analysis.trustScore).toBeLessThan(0.5);
  });

  it('should accept arbitrary metadata key-value pairs', () => {
    const analysis: MediaAnalysis = {
      id: 'meta-test',
      type: 'audio',
      trustScore: 0.9,
      flags: [],
      metadata: {
        bitrate: 320,
        codec: 'mp3',
        duration: 240,
        tags: ['music', 'vocals'],
      },
    };
    expect(analysis.metadata['codec']).toBe('mp3');
    expect(analysis.metadata['bitrate']).toBe(320);
  });
});
