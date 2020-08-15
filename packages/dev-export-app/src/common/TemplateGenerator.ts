import {IljAppConfig} from "./app-config";
import {copyFileSync, mkdirSync, readFileSync, writeFileSync} from "fs";
import path from "path";
import glob from "glob";
import Mustache from "mustache";
import {fileURLToPath} from "url";
import {isDir} from "./utils";

export interface TemplateContextOptions {
    config: IljAppConfig;
    flags: string[];
    buildMode: string;
    target: string;
    platform: string;
}

export interface CopyPublicOptions extends TemplateContextOptions {
    src: string;
    dest: string;
}

export function copyPublic(options: CopyPublicOptions) {
    try {
        const generator = new TemplateGenerator(options);
        generator.copyDir(options.src, options.dest);
    } catch {
    }
}

interface TemplateVariables {
    NAME: string;
    VERSION_NAME: string;
    ANDROID_APP_ID: string;
    ANDROID_PROJECT_ID?: string;
    IOS_APP_ID: string;
    APP_NAME: string;
    BUILD_MODE: string;
    DEVELOPMENT: boolean;
    PRODUCTION: boolean;
    TARGET: string;
    PLATFORM: string;
    PWA: boolean;
    BACKGROUND_COLOR: string;
    GOOGLE_PLAY_KEY?: string;
    ADMOB_APP_ID?: string;
    SENTRY_API_URL?: string;
}

export class TemplateGenerator {
    view: TemplateVariables;
    readonly packagerPath = path.resolve(fileURLToPath(import.meta.url), '../../..');

    constructor(readonly options: TemplateContextOptions) {
        const config = options.config;
        this.view = {
            NAME: config.name,
            VERSION_NAME: config.version,
            // TODO: ios / android options for app id
            ANDROID_APP_ID: config.appId,
            ANDROID_PROJECT_ID: config.projectID,
            IOS_APP_ID: config.appId,
            APP_NAME: config.appName,
            BUILD_MODE: options.buildMode,
            DEVELOPMENT: options.buildMode === 'development',
            PRODUCTION: options.buildMode === 'production',
            TARGET: options.target,
            PLATFORM: options.platform,
            PWA: options.platform === 'web',
            BACKGROUND_COLOR: config.backgroundColor,
            GOOGLE_PLAY_KEY: config.googlePlayKey,
            ADMOB_APP_ID: config.admobAppId
        };

        if (config.sentry) {
            this.view.SENTRY_API_URL = config.sentry;
        }

        for (const flag of options.flags) {
            (this.view as any)[flag] = true;
        }
    }

    copy(src: string, dest: string) {

        if (src.endsWith('.mustache')) {
            const tpl = readFileSync(src, 'utf8');
            const content = Mustache.render(tpl, this.view);
            writeFileSync(dest, content);
        } else {
            copyFileSync(src, dest);
        }
    }

    copyDir(src: string, dest: string) {
        const files = glob.sync(path.join(src, '**/*'));
        for (const file of files) {
            const relPath = path.relative(src, file);
            if (isDir(file)) {
                const dirName = path.join(dest, relPath);
                mkdirSync(dirName, {recursive: true});
                continue;
            }
            if (file.endsWith('.mustache')) {
                const name = relPath.substr(0, relPath.length - '.mustache'.length);
                this.copy(file, path.join(dest, name));
            } else {
                this.copy(file, path.join(dest, relPath));
            }
        }
    }
}