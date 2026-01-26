import * as crypto from 'crypto';

export class KeyGenerator {
  private readonly SECRET_KEY: string;

  constructor(secretKey: string) {
    if (!secretKey) throw new Error('Secret key is required');
    this.SECRET_KEY = secretKey;
  }

  /**
   * Generates a license key in format: AGY-{TENANT}-{TIMESTAMP}-{CHECKSUM}
   */
  generate(tenantId: string, timestamp: number = Date.now()): string {
    const cleanTenant = tenantId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 10);
    const checksum = this.createChecksum(cleanTenant, timestamp);
    return `AGY-${cleanTenant}-${timestamp}-${checksum}`;
  }

  /**
   * Validates a license key
   */
  validate(key: string): boolean {
    const parts = key.split('-');
    if (parts.length !== 4 || parts[0] !== 'AGY') return false;

    const [_, tenant, timestampStr, checksum] = parts;
    const timestamp = parseInt(timestampStr, 10);

    // Check if timestamp is valid number
    if (isNaN(timestamp)) return false;

    // Verify checksum
    const expectedChecksum = this.createChecksum(tenant, timestamp);
    return checksum === expectedChecksum;
  }

  private createChecksum(tenant: string, timestamp: number): string {
    const data = `${tenant}|${timestamp}|${this.SECRET_KEY}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8);
  }
}
