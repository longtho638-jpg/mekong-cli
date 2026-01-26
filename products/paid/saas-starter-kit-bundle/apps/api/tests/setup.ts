import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import prisma from '../src/config/database';
import redisClient from '../src/config/redis';

jest.mock('../src/config/database', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

jest.mock('../src/config/redis', () => ({
    __esModule: true,
    default: {
        connect: jest.fn(),
        on: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        flushAll: jest.fn(),
        isOpen: false
    }
}));

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeAll(async () => {
    // Setup logic
});

afterAll(async () => {
    // Teardown logic
});
