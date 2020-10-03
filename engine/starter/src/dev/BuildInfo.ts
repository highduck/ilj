export const BuildInfo = {
    version: {
        name: process.env.APP_VERSION!,
        code: +process.env.APP_VERSION_CODE!
    },
    env: {
        platform: process.env.PLATFORM,
        target: process.env.TARGET,
        mode: process.env.NODE_ENV,
        production: process.env.PRODUCTION
    },
    ilj: {
        profile: process.env.ILJ_PROFILE,
        webgl_debug: process.env.ILJ_WEBGL_DEBUG
    }
};

console.trace('BuildInfo', JSON.stringify(BuildInfo));