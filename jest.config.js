const path = require('path');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  testMatch: ['**/src/**/?(*.)test.{js,jsx,ts,tsx}'],
  setupFilesAfterEnv: [path.join(import.meta.dir, 'src/test/jest.setup.ts')],

  globals: {
    "ts-jest": {
      tsconfig: path.join(import.meta.dir, "tsconfig.jest.json")
    }
  }
};
