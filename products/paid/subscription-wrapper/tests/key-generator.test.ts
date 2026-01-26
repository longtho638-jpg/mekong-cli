import { KeyGenerator } from '../licensing/key-generator';

describe('KeyGenerator', () => {
  const SECRET = 'test_secret_key_123';
  let generator: KeyGenerator;

  beforeEach(() => {
    generator = new KeyGenerator(SECRET);
  });

  it('should generate a valid key with correct format', () => {
    const tenantId = 'tenant_123';
    const key = generator.generate(tenantId);

    expect(key).toMatch(/^AGY-[a-z0-9]{1,10}-\d{13}-[a-f0-9]{8}$/);
  });

  it('should validate a correctly generated key', () => {
    const tenantId = 'client_abc';
    const key = generator.generate(tenantId);

    expect(generator.validate(key)).toBe(true);
  });

  it('should reject a key with invalid checksum', () => {
    const tenantId = 'client_abc';
    const key = generator.generate(tenantId);
    const parts = key.split('-');
    parts[3] = 'deadbeef'; // Tamper checksum
    const tamperedKey = parts.join('-');

    expect(generator.validate(tamperedKey)).toBe(false);
  });

  it('should reject a key with invalid prefix', () => {
    const key = 'XYZ-tenant-1234567890123-checksum';
    expect(generator.validate(key)).toBe(false);
  });

  it('should reject a key with invalid timestamp', () => {
    const key = 'AGY-tenant-invalidtime-checksum';
    expect(generator.validate(key)).toBe(false);
  });
});
