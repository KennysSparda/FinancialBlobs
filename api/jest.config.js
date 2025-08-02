// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/env.setup.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**/*.js",
    "models/**/*.js",
    "services/**/*.js"
  ]
}
