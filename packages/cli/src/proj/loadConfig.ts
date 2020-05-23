import path from "path";

import getPackagePath from "../common/getPackagePath";

import console from "../common/log";

import fs from "fs";

export type BuildMode = 'development' | 'production';

export interface ProjectConfig {
    name: string;
    platform: 'web' | 'android' | 'ios';
    basedir: string;
    approot: string;
    appdir: string;
    main?: string;
}

export function loadConfig(basedir: string): ProjectConfig | undefined {
    try {
        const config = require(path.resolve(basedir, "ilj.config.js"));
        config.platform = config.platform || 'web';
        config.basedir = basedir;
        if (config.main) {
            config.basedir = fs.realpathSync(getPackagePath(config.main, basedir));
            if (!fs.existsSync(config.basedir)) {
                console.error(`Main Module ${config.main} not found`);
                console.info(`not exists: ${config.basedir}`);
                return undefined;
            }
        }
        config.approot = basedir;
        config.appdir = path.resolve(config.approot, 'www');
        return config;
    } catch {
    }

    return undefined;
}