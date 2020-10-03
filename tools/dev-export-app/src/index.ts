import path from "path";
import {TemplateGenerator} from "./common/TemplateGenerator";
import {isDir} from "./common/utils";
import {exportAndroid} from "./android";
import {exportIOS} from "./ios";
import {exportPWA} from "./pwa";
import {PackagerContext, PackagerContextOptions} from "./common/PackagerContext";
import {generateStartupScript} from "./common/generateStartupScript";
import * as fs from 'fs';

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

export function exportWebTemplate(options: PackagerContextOptions, dest: string) {
    const packager = new PackagerContext(options);
    const generator = new TemplateGenerator(packager);
    generator.copy(
        path.join(packager.packagerPath, 'templates/_common/index.html.mustache'),
        path.join(dest, 'index.html')
    );

    const startupScript = generateStartupScript(packager);
    fs.writeFileSync(path.join(dest, 'startup.js'), startupScript);

    const userDir = 'public_' + options.target;
    if (isDir(userDir)) {
        generator.copyDir(userDir, dest);
    }
}