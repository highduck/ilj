import {readFileSync} from "fs";
import * as path from "path";

export interface IljAppConfig {
    name: string;
    version: string;
    versionCode: number;

    // app bundle name:
    appId: string;

    appName: string;
    keys: string;
    orientation: 'portrait' | 'landscape';
    backgroundColor: string;
    sentry?: string;
    googlePlayKey?: string;
    admobAppId?: string;
    projectID?: string;
    capacitorPlugins: string[];

    icon: string;
    splash: string;
}

interface PackageJson {
    name: string;
    version: string;
    dependencies: { [key: string]: string };
    peerDependencies: { [key: string]: string };
    devDependencies: { [key: string]: string };
}

export function readAppConfig(basedir: string): IljAppConfig {
    const pkg: Partial<PackageJson> = JSON.parse(readFileSync(path.join(basedir, 'package.json'), 'utf8'));
    const app: Partial<IljAppConfig> = JSON.parse(readFileSync(path.join(basedir, 'app-config.json'), 'utf8'));
    const name = app.name ?? pkg.name ?? path.basename(basedir);
    validateName(name);
    const version = app.version ?? pkg.version ?? "1.0.0";
    const versionCode = app.versionCode ?? 1;
    const appId = app.appId ?? `ilj.app.${name}`;
    const appName = app.appName ?? name;
    const capacitorPlugins = app.capacitorPlugins ?? getCapacitorPlugins(pkg);
    const keys = app.keys ?? path.join(process.cwd(), '.keys');
    const orientation = app.orientation ?? 'portrait';
    const backgroundColor = app.backgroundColor ?? '#FF000000';
    if (['portrait', 'landscape'].indexOf(orientation) < 0) {
        throw `orientation ${orientation} not allowed: only portrait / landscape`;
    }
    if (backgroundColor.length < 9) {
        throw `backgroundColor format #AARRGGBB: ${backgroundColor}`;
    }
    return {
        name, version, versionCode, appName, appId, capacitorPlugins, keys, orientation, backgroundColor,
        sentry: app.sentry,
        googlePlayKey: app.googlePlayKey,
        admobAppId: app.admobAppId,
        projectID: app.projectID,

        icon: app.icon ?? 'assets/icon.png',
        splash: app.splash ?? 'assets/splash.png',
    };
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

function getCapacitorPlugins(deps: Partial<PackageJson>) {
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