import {IljAppConfig} from "./app-config";
import {copyFileSync, mkdirSync, readFileSync, writeFileSync} from "fs";
import path from "path";
import glob from "glob";
import Mustache from "mustache";
import {isDir} from "./utils";
import {PackagerContext} from "./PackagerContext";

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
}

export class TemplateGenerator {
    view: TemplateVariables;

    constructor(readonly packager: PackagerContext) {
        const options = packager.options;
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
            GOOGLE_PLAY_KEY: config.googlePlayKey
        };

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