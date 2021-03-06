export default {
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.jest.json'
        }
    },
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
};
