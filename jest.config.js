/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  testMatch: ['**/src/**/?(*.)test.{js,jsx,ts,tsx}'],
  setupFilesAfterEnv: ['./src/test/jest.setup.ts'],

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['ts-jest', { tsconfig: './tsconfig.test.json' }],
  },

  collectCoverageFrom: [
    'convex/**/*.{ts,tsx}',
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/test/**',
    '!**/node_modules/**',
  ],
};
