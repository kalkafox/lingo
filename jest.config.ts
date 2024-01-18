import type { Config } from 'jest'

export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  testMatch: ['**/{convex,src}/**/?(*.)test.{js,jsx,ts,tsx}'],
  setupFilesAfterEnv: ['./src/test/jest.setup.ts'],

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['ts-jest', { tsconfig: './tsconfig.test.json' }],
  },

  transformIgnorePatterns: ['node_modules/(?!ky/.*)'],

  collectCoverageFrom: [
    'convex/*.{ts,tsx}',
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/test/**',
    '!**/node_modules/**',
  ],
  setupFiles: ['<rootDir>/.jest/setEnvVars.js'],
} satisfies Config
