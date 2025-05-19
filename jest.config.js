export const preset = 'ts-jest';
export const testEnvironment = 'node';
export const roots = ['<rootDir>'];
export const testMatch = ['**/tests/**/*.ts', '**/?(*.)+(spec|test).ts'];
export const transform = { '^.+\\.ts$': 'ts-jest', };
export const moduleFileExtensions = ['ts', 'js', 'json'];
export const extensionsToTreatAsEsm = ['.ts'];
export const modulePaths = ['<rootDir>/src/', '<rootDir>/node_modules/']