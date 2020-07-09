import {Pkg, readPkg} from "./pkg";
import {copyFileSync, readFileSync, writeFileSync} from "fs";
import path from "path";
import glob from "glob";
import Mustache from "mustache";

export interface CopyPublicOptions {
    src: string,
    dest: string,
    pkg: Pkg,
    buildMode: string,
    target: string,
    platform: string
}

export function copyPublic(options: CopyPublicOptions) {
    try {
        const pkg = readPkg(process.cwd());
        const view = {
            VERSION_NAME: pkg.version,
            APP_NAME: pkg.appName,
            BUILD_MODE: pkg.appName,
            PRODUCTION: options.buildMode === 'production',
            TARGET: options.target,
            PLATFORM: options.platform
        };

        const files = glob.sync(path.join(options.src, '**/*'));
        for (const file of files) {
            const relPath = path.relative(options.src, file);
            if (file.endsWith('.mustache')) {
                const tpl = readFileSync(file, 'utf8');
                const content = Mustache.render(tpl, view);
                const name = relPath.substr(0, relPath.length - '.mustache'.length);
                writeFileSync(path.join(options.dest, name), content);
            } else {
                copyFileSync(file, path.join(options.dest, relPath));
            }
        }
    } catch {
    }
}