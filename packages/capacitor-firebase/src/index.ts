export * from './definitions';

if (process.env.PLATFORM === 'web') {
    require('./web');
}

export * from './plugin';