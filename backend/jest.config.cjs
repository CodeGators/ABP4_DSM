const { createDefaultEsmPreset } = require('ts-jest');

const presetConfig = createDefaultEsmPreset();

module.exports = {
  ...presetConfig,
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
