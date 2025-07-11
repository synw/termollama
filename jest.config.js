export const preset = 'ts-jest';
export const testEnvironment = 'node';
export const roots = ['<rootDir>'];
export const testMatch = ['**/tests/**/*.ts', '**/?(*.)+(spec|test).ts'];
export const transform = {
    '^.+\\.ts$': 'ts-jest',
    // Handle ES modules in JS files
    '^.+\\.js$': ['ts-jest', {
        useESM: true,
        isolatedModules: true,
    }]
};
export const moduleFileExtensions = ['ts', 'js', 'json'];
export const extensionsToTreatAsEsm = ['.ts'];
export const modulePaths = ['<rootDir>/src/', '<rootDir>/node_modules/']
export const moduleNameMapper = {
    '\\.(css|less)$': 'identity-obj-proxy',
    '\\.svg$': '<rootDir>/__mocks__/svgMock.js',
    '\\.(jpg|jpeg|png|gif|webp)$': '<rootDir>/__mocks__/fileMock.js',
    // Mock user_msgs.ts
    '^../lib/user_msgs\\.(js|ts)$': '<rootDir>/tests/__mocks__/user_msgs.js',
    // Mock gpu.ts
    '^../src/lib/gpu\\.(js|ts)$': '<rootDir>/tests/__mocks__/gpu.js'
};
