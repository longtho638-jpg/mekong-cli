module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@agencyos/trading-core/(.*)$': '<rootDir>/../../packages/trading-core/$1',
    '^@agencyos/trading-core$': '<rootDir>/../../packages/trading-core/index.ts',
    '^@agencyos/vibe-billing-trading/(.*)$': '<rootDir>/../../packages/vibe-billing-trading/$1',
    '^@agencyos/vibe-billing-trading$': '<rootDir>/../../packages/vibe-billing-trading/index.ts',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      diagnostics: false,
    }],
  },
};
