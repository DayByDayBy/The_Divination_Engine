const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const buildJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/build/**/*.test.ts'],
  testTimeout: 120000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

module.exports = createJestConfig(buildJestConfig);
