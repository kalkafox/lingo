const path = require('path');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  testMatch: ['**/src/**/?(*.)test.{js,jsx,ts,tsx}'],
  setupFilesAfterEnv: [path.join(__dirname, 'src/test/jest.setup.ts')],

  globals: {
    "ts-jest": {
      tsconfig: path.join(__dirname, "tsconfig.jest.json")
    }
  }
};
