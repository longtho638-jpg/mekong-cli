import { JwtVerifyOptions } from 'hono/jwt';

/**
 * Service for validating API keys and JWT tokens
 */
export class AuthService {
  private static readonly VALID_MK_PREFIX = 'mk_';

  /**
   * Validate mk_ API key format
   */
  static isValidApiKey(apiKey: string): boolean {
    return apiKey.startsWith(this.VALID_MK_PREFIX) && apiKey.length > 10;
  }

  /**
   * Validate JWT token
   */
  static async validateJwt(jwt: string, options?: JwtVerifyOptions): Promise<boolean> {
    // In a real implementation, we would validate the JWT
    // For now, we'll just check if it has the basic JWT format (header.payload.signature)
    const jwtParts = jwt.split('.');
    return jwtParts.length === 3;
  }

  /**
   * Validate the combination of API key and JWT
   */
  static async authenticateRequest(apiKey: string, jwt?: string): Promise<boolean> {
    // First validate API key
    if (!this.isValidApiKey(apiKey)) {
      return false;
    }

    // If JWT is provided, validate it as well
    if (jwt) {
      return await this.validateJwt(jwt);
    }

    // If no JWT provided, just return true if API key is valid
    return true;
  }
}