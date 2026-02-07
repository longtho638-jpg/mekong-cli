import { describe, it, expect } from 'vitest';
import { siteConfig } from './site';

describe('siteConfig', () => {
  it('has required brand fields', () => {
    expect(siteConfig.name).toBe('AgencyOS');
    expect(siteConfig.url).toContain('agencyos.dev');
  });

  it('has valid OG image dimensions', () => {
    expect(siteConfig.ogImageDimensions.width).toBe(1200);
    expect(siteConfig.ogImageDimensions.height).toBe(630);
  });

  it('has social links defined', () => {
    expect(siteConfig.social.twitter).toBeTruthy();
    expect(siteConfig.social.github).toBeTruthy();
  });

  it('has sitemap routes starting with empty string for root', () => {
    expect(siteConfig.sitemapRoutes[0]).toBe('');
    expect(siteConfig.sitemapRoutes.length).toBeGreaterThan(0);
  });

  it('has structured data defaults', () => {
    expect(siteConfig.structuredData.applicationCategory).toBe('DeveloperApplication');
    expect(siteConfig.structuredData.priceCurrency).toBe('USD');
  });
});
