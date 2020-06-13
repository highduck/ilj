process.env.NODE_ENV = 'test';
process.env.TS_NODE_COMPILER_OPTIONS = '{"module":"commonjs"}';

module.exports = {
    require: 'ts-node/register',
    extension: ['ts'],
    watchExtensions: ['ts'],
    spec: ['src/**/*.spec.ts'],
}