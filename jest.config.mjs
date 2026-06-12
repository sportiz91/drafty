import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  clearMocks: true,
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  setupFiles: ['<rootDir>/jest.env.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Unit tests are colocated with their source (`foo.ts` → `foo.spec.ts`).
  testMatch: ['**/*.spec.ts', '**/*.spec.tsx'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/e2e/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.spec.{ts,tsx}',
  ],
};

export default createJestConfig(config);
