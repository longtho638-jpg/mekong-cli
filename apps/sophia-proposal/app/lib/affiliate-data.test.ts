import { describe, it, expect } from 'vitest';
import { affiliatePrograms, type AffiliateProgram } from './affiliate-data';

describe('affiliate-data', () => {
  describe('affiliatePrograms array', () => {
    it('exports an array of affiliate programs', () => {
      expect(Array.isArray(affiliatePrograms)).toBe(true);
      expect(affiliatePrograms.length).toBeGreaterThan(0);
    });

    it('contains programs with required fields', () => {
      affiliatePrograms.forEach((program) => {
        expect(program).toHaveProperty('id');
        expect(program).toHaveProperty('name');
        expect(program).toHaveProperty('category');
        expect(program).toHaveProperty('commission');
        expect(program).toHaveProperty('description');
        expect(program).toHaveProperty('link');
        expect(program).toHaveProperty('color');
      });
    });

    it('has valid color values', () => {
      const validColors = ['cyan', 'purple', 'pink'] as const;
      affiliatePrograms.forEach((program) => {
        expect(validColors).toContain(program.color);
      });
    });

    it('has unique IDs for all programs', () => {
      const ids = affiliatePrograms.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('has programs in all three tiers', () => {
      const highTier = affiliatePrograms.filter(
        (p) => p.commission.startsWith('4') || p.commission.startsWith('5')
      );
      const midTier = affiliatePrograms.filter(
        (p) => p.commission.startsWith('2') || p.commission.startsWith('3')
      );
      const standardTier = affiliatePrograms.filter(
        (p) => p.commission.startsWith('1')
      );

      expect(highTier.length).toBeGreaterThan(0);
      expect(midTier.length).toBeGreaterThan(0);
      expect(standardTier.length).toBeGreaterThan(0);
    });

    it('has programs with non-empty names and descriptions', () => {
      affiliatePrograms.forEach((program) => {
        expect(program.name.trim()).not.toBe('');
        expect(program.description.trim()).not.toBe('');
      });
    });
  });

  describe('AffiliateProgram type', () => {
    it('has correct structure', () => {
      const mockProgram: AffiliateProgram = {
        id: 'test',
        name: 'Test Program',
        category: 'Test Category',
        commission: '20%',
        description: 'Test description',
        link: 'https://example.com',
        color: 'cyan',
      };

      expect(mockProgram.id).toBe('test');
      expect(mockProgram.name).toBe('Test Program');
      expect(mockProgram.color).toBe('cyan');
    });

    it('allows optional icon property', () => {
      const programWithIcon: AffiliateProgram = {
        id: 'test',
        name: 'Test',
        category: 'Test',
        commission: '20%',
        description: 'Test',
        link: '#',
        icon: 'test-icon',
        color: 'purple',
      };

      expect(programWithIcon.icon).toBe('test-icon');
    });
  });
});
