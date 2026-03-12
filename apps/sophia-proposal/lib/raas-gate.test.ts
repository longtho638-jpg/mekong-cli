import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  checkLicense,
  isFreeTier,
  isPremiumTier,
  canAccessTemplate,
  getAvailableTemplates,
  getPremiumTemplates,
  PREMIUM_TEMPLATES,
  FREE_TEMPLATES,
} from '../lib/raas-gate'

describe('RAAS License Gate', () => {
  const originalEnv = process.env.RAAS_LICENSE_KEY

  beforeEach(() => {
    // Clear env before each test
    delete process.env.RAAS_LICENSE_KEY
  })

  afterEach(() => {
    // Restore original env
    if (originalEnv !== undefined) {
      process.env.RAAS_LICENSE_KEY = originalEnv
    } else {
      delete process.env.RAAS_LICENSE_KEY
    }
  })

  describe('checkLicense', () => {
    it('returns premium tier with valid license key', () => {
      process.env.RAAS_LICENSE_KEY = 'raas-live-abc123'
      const result = checkLicense()
      expect(result.valid).toBe(true)
      expect(result.tier).toBe('premium')
    })

    it('returns free tier without license key', () => {
      const result = checkLicense()
      expect(result.valid).toBe(false)
      expect(result.tier).toBe('free')
    })

    it('returns free tier with empty license key', () => {
      process.env.RAAS_LICENSE_KEY = ''
      const result = checkLicense()
      expect(result.valid).toBe(false)
      expect(result.tier).toBe('free')
    })

    it('returns free tier with whitespace-only license key', () => {
      process.env.RAAS_LICENSE_KEY = '   '
      const result = checkLicense()
      expect(result.valid).toBe(false)
      expect(result.tier).toBe('free')
    })

    it('accepts custom key parameter', () => {
      const result = checkLicense('custom-key-123')
      expect(result.valid).toBe(true)
      expect(result.tier).toBe('premium')
    })

    it('custom key takes precedence over env', () => {
      process.env.RAAS_LICENSE_KEY = 'env-key'
      const result = checkLicense('custom-key')
      expect(result.valid).toBe(true)
    })
  })

  describe('isFreeTier', () => {
    it('returns true without license', () => {
      expect(isFreeTier()).toBe(true)
    })

    it('returns false with valid license', () => {
      process.env.RAAS_LICENSE_KEY = 'raas-live-abc123'
      expect(isFreeTier()).toBe(false)
    })
  })

  describe('isPremiumTier', () => {
    it('returns false without license', () => {
      expect(isPremiumTier()).toBe(false)
    })

    it('returns true with valid license', () => {
      process.env.RAAS_LICENSE_KEY = 'raas-live-abc123'
      expect(isPremiumTier()).toBe(true)
    })
  })

  describe('canAccessTemplate', () => {
    it('allows free templates for free tier', () => {
      FREE_TEMPLATES.forEach((template) => {
        expect(canAccessTemplate(template)).toBe(true)
      })
    })

    it('blocks premium templates for free tier', () => {
      PREMIUM_TEMPLATES.forEach((template) => {
        expect(canAccessTemplate(template)).toBe(false)
      })
    })

    it('allows all templates for premium tier', () => {
      process.env.RAAS_LICENSE_KEY = 'raas-live-abc123'

      FREE_TEMPLATES.forEach((template) => {
        expect(canAccessTemplate(template)).toBe(true)
      })
      PREMIUM_TEMPLATES.forEach((template) => {
        expect(canAccessTemplate(template)).toBe(true)
      })
    })
  })

  describe('getAvailableTemplates', () => {
    it('returns only free templates for free tier', () => {
      const templates = getAvailableTemplates()
      expect(templates).toEqual(FREE_TEMPLATES)
      expect(templates).not.toContain(expect.arrayContaining([...PREMIUM_TEMPLATES]))
    })

    it('returns all templates for premium tier', () => {
      process.env.RAAS_LICENSE_KEY = 'raas-live-abc123'
      const templates = getAvailableTemplates()
      expect(templates).toEqual([...FREE_TEMPLATES, ...PREMIUM_TEMPLATES])
    })
  })

  describe('getPremiumTemplates', () => {
    it('always returns premium templates list', () => {
      expect(getPremiumTemplates()).toEqual(PREMIUM_TEMPLATES)
    })
  })

  describe('Template constants', () => {
    it('PREMIUM_TEMPLATES includes video-factory', () => {
      expect(PREMIUM_TEMPLATES).toContain('video-factory')
    })

    it('PREMIUM_TEMPLATES includes campaign-export', () => {
      expect(PREMIUM_TEMPLATES).toContain('campaign-export')
    })

    it('FREE_TEMPLATES is not empty', () => {
      expect(FREE_TEMPLATES.length).toBeGreaterThan(0)
    })
  })
})
