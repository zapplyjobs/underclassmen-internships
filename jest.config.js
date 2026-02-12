module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/*.test.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    '.github/scripts/shared/lib/**/*.js',
    '!.github/scripts/shared/lib/**/*.test.js',
    '!**/node_modules/**'
  ],

  // Coverage thresholds (Phase 2 target: 80%)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Coverage reporters
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Max workers (optimize for CI)
  maxWorkers: '50%'
};
