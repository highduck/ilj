import path from "path";
import {TemplateContextOptions, TemplateGenerator} from "./common/TemplateGenerator";
import {isDir} from "./common/utils";
import {exportAndroid} from "./android";
import {exportIOS} from "./ios";
import {exportPWA} from "./pwa";

export * from './common/app-config';
export * from './common/TemplateGenerator';
export * from './android';

export async function exportAppProject(
    target?: string,
    mode?: 'production' | 'development',
    debug?: boolean,
    basedir?: string,
    deploy?: boolean
) {
    if (target === 'android') {
        await exportAndroid(basedir, target, mode, debug, deploy);
    } else if (target === 'ios') {
        await exportIOS(basedir, target, mode, debug, deploy);
    } else if (target === 'web') {
        await exportPWA(basedir, target, mode, debug, deploy);
    }
}

// export function buildAppProject(target?: string) {
//     if (target === 'android') {
//
//     } else if (target === 'ios') {
//
//     } else if (target === 'web') {
//
//     }
// }
//
// export function deployAppProject(target?: string) {
//     if (target === 'android') {
//
//     } else if (target === 'ios') {
//
//     } else if (target === 'web') {
//
//     }
// }

export function exportWebTemplate(options: TemplateContextOptions, dest: string) {
    const generator = new TemplateGenerator(options);
    if (options.config.sentry) {
        generator.copy(
            path.join(generator.packagerPath, 'templates/_common/sentry.min.js.mustache'),
            path.join(dest, 'sentry.min.js')
        );
    }
    generator.copy(
        path.join(generator.packagerPath, 'templates/_common/index.html.mustache'),
        path.join(dest, 'index.html')
    );
    if (options.flags.indexOf('ILJ_WEBGL_DEBUG') >= 0) {
        generator.copy(
            path.join(generator.packagerPath, 'templates/_common/webgl-debug.js'),
            path.join(dest, 'webgl-debug.js')
        );
    }

    const userDir = 'public_' + options.target;
    if (isDir(userDir)) {
        generator.copyDir(userDir, dest);
    }
}