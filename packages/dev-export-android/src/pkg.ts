import {readFileSync} from "fs";
import path from "path";

export interface Pkg {
    name: string;
    version: string;
    versionCode: number;
    appId: string;
    appName: string;
    capacitorPlugins: string[];
    androidSigningConfig?: string;
    orientation: 'portrait' | 'landscape';
    backgroundColor: string;
}

export function readPkg(basedir: string): Pkg {
    const pkg: Partial<Pkg> & Partial<PkgDeps> = JSON.parse(readFileSync(path.join(basedir, 'package.json'), 'utf8'));
    const name = pkg.name ?? path.basename(basedir);
    validateName(name);
    const version = pkg.version ?? "1.0.0";
    const versionCode = pkg.versionCode ?? 1;
    const appId = pkg.appId ?? `ilj.app.${name}`;
    const appName = pkg.appName ?? name;
    const capacitorPlugins = getCapacitorPlugins(pkg);
    const androidSigningConfig = pkg.androidSigningConfig;
    const orientation = pkg.orientation ?? 'portrait';
    const backgroundColor = pkg.backgroundColor ?? '#FF000000';
    if (['portrait', 'landscape'].indexOf(orientation) < 0) {
        throw `orientation ${orientation} not allowed: only portrait / landscape`;
    }
    if (backgroundColor.length < 9) {
        throw `backgroundColor format #AARRGGBB: ${backgroundColor}`;
    }
    return {
        name, version, versionCode, appName, appId, capacitorPlugins, androidSigningConfig, orientation, backgroundColor
    };
}


interface PkgDeps {
    dependencies: { [id: string]: string };
    peerDependencies: { [id: string]: string };
    devDependencies: { [id: string]: string };
}

function mergeObjectKeys(...objects: ({ [key: string]: string } | undefined)[]) {
    const keys: string[] = [];
    for (const obj of objects) {
        if (obj !== undefined) {
            for (const key of Object.keys(obj)) {
                keys.push(key);
            }
        }
    }
    return keys;
}

function validateName(name: string) {
    if (name.search(/[\\/@\-_]/g) >= 0) {
        throw "NAME contains strange symbols!";
    }
}

function getCapacitorPlugins(deps: Partial<PkgDeps>) {
    const plugins: string[] = [];
    const ids = mergeObjectKeys(deps.dependencies, deps.devDependencies, deps.peerDependencies);
    for (const id of ids) {
        if (id.indexOf('@capacitor/') === 0) {
            continue;
        }
        if (id.indexOf('capacitor') >= 0) {
            // mark as plugin
            plugins.push(id);
        }
    }
    return plugins;
}