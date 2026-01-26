import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { LoginInput, RegisterInput } from '../utils/validators';

class AuthService {
  async register(input: RegisterInput) {
    const { email, password, name, role } = input;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestError('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'USER',
        apiKey: this.generateApiKey(),
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        apiKey: user.apiKey,
      },
      ...tokens,
    };
  }

  async login(input: LoginInput) {
    const { email, password } = input;

    // Check user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        apiKey: user.apiKey,
      },
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || 'refresh-secret'
      ) as { id: string };

      // Check if token exists in db and is valid
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token },
      });

      if (!storedToken || storedToken.revoked) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Check user
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Revoke old token (Rotation)
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });

      // Generate new tokens
      const newTokens = await this.generateTokens(user.id, user.role);

      return newTokens;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
             throw new UnauthorizedError('Refresh token expired');
        }
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string, role: string) {
    const accessToken = jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { id: userId },
      process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Calculate expiry date
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    // Simple parsing for days or minutes - production should use a library like 'ms'
    const days = parseInt(refreshExpiresIn.replace('d', '')) || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private generateApiKey(): string {
      return crypto.randomBytes(32).toString('hex');
  }
}

export default new AuthService();
