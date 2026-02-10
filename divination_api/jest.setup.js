// Jest setup file
import 'jest-extended';

// Set up test environment variables
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-chars-long';

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};
