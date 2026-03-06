/**
 * RAAS License Validator — Unit Tests
 *
 * Tests for startup license validation:
 * - Valid UUIDv4 format
 * - Invalid format
 * - Missing key
 * - Legacy format support
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
  isValidUUIDv4,
  detectKeyFormat,
  validateLicenseKeyAtStartup,
} from './license-validator';

describe('License Validator', () => {
  beforeEach(() => {
    delete process.env.RAAS_LICENSE_KEY;
  });

  afterEach(() => {
    delete process.env.RAAS_LICENSE_KEY;
  });

  describe('isValidUUIDv4', () => {
    test('should return true for valid UUIDv4', () => {
      expect(isValidUUIDv4('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUIDv4('123e4567-e89b-42d3-a456-426614174000')).toBe(true); // fixed: version must be 4
      expect(isValidUUIDv4('A1B2C3D4-E5F6-4A7B-8C9D-0E1F2A3B4C5D')).toBe(true);
    });

    test('should return false for invalid UUIDv4', () => {
      expect(isValidUUIDv4('not-a-uuid')).toBe(false);
      expect(isValidUUIDv4('550e8400-e29b-31d4-a716-446655440000')).toBe(false); // wrong version (3 instead of 4)
      expect(isValidUUIDv4('550e8400-e29b-41d4-a716-44665544000')).toBe(false); // too short
      expect(isValidUUIDv4('550e8400-e29b-41d4-a716-446655440000-extra')).toBe(false); // too long
      expect(isValidUUIDv4('')).toBe(false);
      expect(isValidUUIDv4('raas-pro-abc123')).toBe(false);
    });

    test('should return false for UUIDv4 with wrong variant', () => {
      // Variant must be 8, 9, a, or b in 4th group
      expect(isValidUUIDv4('550e8400-e29b-41d4-0716-446655440000')).toBe(false); // 0 instead of 8/9/a/b
      expect(isValidUUIDv4('550e8400-e29b-41d4-1716-446655440000')).toBe(false); // 1 instead of 8/9/a/b
      expect(isValidUUIDv4('550e8400-e29b-41d4-7716-446655440000')).toBe(false); // 7 instead of 8/9/a/b
      expect(isValidUUIDv4('550e8400-e29b-41d4-c716-446655440000')).toBe(false); // c instead of 8/9/a/b
    });
  });

  describe('detectKeyFormat', () => {
    test('should detect UUIDv4 format', () => {
      expect(detectKeyFormat('550e8400-e29b-41d4-a716-446655440000')).toBe('uuid-v4');
      expect(detectKeyFormat('123e4567-e89b-42d3-a456-426614174000')).toBe('uuid-v4'); // fixed: version must be 4
    });

    test('should detect legacy raas-pro- format', () => {
      expect(detectKeyFormat('raas-pro-abc123')).toBe('legacy');
      expect(detectKeyFormat('raas-pro-xyz789')).toBe('legacy');
      expect(detectKeyFormat('RAAS-PRO-ABC123')).toBe('legacy'); // case-insensitive
    });

    test('should detect legacy raas-ent- format', () => {
      expect(detectKeyFormat('raas-ent-premium')).toBe('legacy');
      expect(detectKeyFormat('raas-ent-enterprise')).toBe('legacy');
    });

    test('should detect legacy RPP- format', () => {
      expect(detectKeyFormat('RPP-12345678')).toBe('legacy');
      expect(detectKeyFormat('RPP-abcdefgh')).toBe('legacy');
      expect(detectKeyFormat('rpp-12345678')).toBe('legacy'); // case-insensitive
    });

    test('should detect legacy REP- format', () => {
      expect(detectKeyFormat('REP-87654321')).toBe('legacy');
      expect(detectKeyFormat('REP-hgfedcba')).toBe('legacy');
      expect(detectKeyFormat('rep-87654321')).toBe('legacy'); // case-insensitive
    });

    test('should return unknown for invalid format', () => {
      expect(detectKeyFormat('invalid-key')).toBe('unknown');
      expect(detectKeyFormat('')).toBe('unknown');
      expect(detectKeyFormat('not-a-license')).toBe('unknown');
      expect(detectKeyFormat('12345')).toBe('unknown');
    });
  });

  describe('validateLicenseKeyAtStartup', () => {
    describe('when key is missing', () => {
      test('should exit with code 1 when required=true (default)', () => {
        delete process.env.RAAS_LICENSE_KEY;

        // Mock process.exit to catch the call
        const exitMock = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
          throw new Error(`process.exit: ${code}`);
        });

        expect(() => {
          validateLicenseKeyAtStartup();
        }).toThrow('process.exit: 1');

        expect(exitMock).toHaveBeenCalledWith(1);
        exitMock.mockRestore();
      });

      test('should return without exit when required=false', () => {
        delete process.env.RAAS_LICENSE_KEY;

        const result = validateLicenseKeyAtStartup({ required: false });

        expect(result.valid).toBe(false);
        expect(result.error).toBe('missing');
        expect(result.keyFormat).toBe('unknown');
      });
    });

    describe('when key is empty', () => {
      test('should exit with code 1 for empty string', () => {
        process.env.RAAS_LICENSE_KEY = '';

        const exitMock = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
          throw new Error(`process.exit: ${code}`);
        });

        expect(() => {
          validateLicenseKeyAtStartup();
        }).toThrow('process.exit: 1');

        expect(exitMock).toHaveBeenCalledWith(1);
        exitMock.mockRestore();
      });

      test('should exit with code 1 for whitespace-only string', () => {
        process.env.RAAS_LICENSE_KEY = '   ';

        const exitMock = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
          throw new Error(`process.exit: ${code}`);
        });

        expect(() => {
          validateLicenseKeyAtStartup();
        }).toThrow('process.exit: 1');

        expect(exitMock).toHaveBeenCalledWith(1);
        exitMock.mockRestore();
      });
    });

    describe('when key has invalid format', () => {
      test('should exit with code 1 for unknown format', () => {
        process.env.RAAS_LICENSE_KEY = 'invalid-license-format';

        const exitMock = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
          throw new Error(`process.exit: ${code}`);
        });

        expect(() => {
          validateLicenseKeyAtStartup();
        }).toThrow('process.exit: 1');

        expect(exitMock).toHaveBeenCalledWith(1);
        exitMock.mockRestore();
      });
    });

    describe('when key has valid UUIDv4 format', () => {
      test('should return valid result with uuid-v4 format', () => {
        process.env.RAAS_LICENSE_KEY = '550e8400-e29b-41d4-a716-446655440000';

        const result = validateLicenseKeyAtStartup();

        expect(result.valid).toBe(true);
        expect(result.keyFormat).toBe('uuid-v4');
        expect(result.error).toBeUndefined();
      });

      test('should accept uppercase UUIDv4', () => {
        process.env.RAAS_LICENSE_KEY = 'A1B2C3D4-E5F6-4A7B-8C9D-0E1F2A3B4C5D';

        const result = validateLicenseKeyAtStartup();

        expect(result.valid).toBe(true);
        expect(result.keyFormat).toBe('uuid-v4');
      });
    });

    describe('when key has legacy format', () => {
      test('should return valid result with legacy format (allowLegacy=true)', () => {
        process.env.RAAS_LICENSE_KEY = 'raas-pro-abc123';

        const result = validateLicenseKeyAtStartup({ allowLegacy: true });

        expect(result.valid).toBe(true);
        expect(result.keyFormat).toBe('legacy');
      });

      test('should accept RPP- legacy format', () => {
        process.env.RAAS_LICENSE_KEY = 'RPP-12345678';

        const result = validateLicenseKeyAtStartup({ allowLegacy: true });

        expect(result.valid).toBe(true);
        expect(result.keyFormat).toBe('legacy');
      });

      test('should accept REP- legacy format', () => {
        process.env.RAAS_LICENSE_KEY = 'REP-abcdefgh';

        const result = validateLicenseKeyAtStartup({ allowLegacy: true });

        expect(result.valid).toBe(true);
        expect(result.keyFormat).toBe('legacy');
      });

      test('should exit with code 1 when allowLegacy=false', () => {
        process.env.RAAS_LICENSE_KEY = 'raas-pro-abc123';

        const exitMock = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
          throw new Error(`process.exit: ${code}`);
        });

        expect(() => {
          validateLicenseKeyAtStartup({ allowLegacy: false });
        }).toThrow('process.exit: 1');

        expect(exitMock).toHaveBeenCalledWith(1);
        exitMock.mockRestore();
      });
    });
  });
});
