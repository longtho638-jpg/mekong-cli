import { describe, it, expect } from 'vitest';
import { MediaFacade } from './media-facade';
import type { MediaFlag } from './media-facade';

describe('MediaFacade', () => {
  const facade = new MediaFacade();

  it('should be instantiable', () => {
    expect(facade).toBeDefined();
    expect(facade).toBeInstanceOf(MediaFacade);
  });

  it('analyzeMedia should throw not-implemented error', async () => {
    await expect(facade.analyzeMedia('https://example.com/video.mp4', 'video')).rejects.toThrow(
      'Implement with vibe-video-intel provider',
    );
  });

  it('verifyAuthenticity should throw not-implemented error', async () => {
    await expect(facade.verifyAuthenticity('media-123')).rejects.toThrow(
      'Implement with vibe-media-trust provider',
    );
  });

  it('MediaFlag should support all flag types', () => {
    const flagTypes: MediaFlag['type'][] = ['deepfake', 'manipulation', 'misinformation', 'copyright', 'nsfw'];
    expect(flagTypes).toHaveLength(5);
  });
});
