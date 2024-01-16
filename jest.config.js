/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  testMatch: ['**/src/**/?(*.)test.{js,jsx,ts,tsx}'],
  setupFilesAfterEnv: ['./src/test/jest.setup.ts'],

  globals: {
    "ts-jest": {
      tsconfig: "./tsconfig.jest.json"
    }
  }
};
