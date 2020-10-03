import {existsSync, readFileSync} from "fs";
import * as path from "path";
import {getPackagerPath} from "./getPackagerPath";

export interface AdaptiveIconConfig {
    // adaptive icon foreground: center 66% is visible
    foreground: string;
    backgroundColor: string;
}

export interface AdMobAppIds {
    android?: string;
    ios?: string;
}

export interface WebRedirectConfig {
    android?: {
        url: string;
        id: string;
    };
    ios?: {
        url: string;
        id?: string;
    };
}

export interface IOSConfig {
    teamID: string;
}

export interface IljAppConfig {
    name: string;
    version: string;
    versionCode: number;

    // app bundle name
    // for Android:
    // for iOS: Bundle Identifier
    appId: string;

    appName: string;
    keys: string;
    orientation: 'portrait' | 'landscape';
    backgroundColor: string;
    sentry?: string;
    googlePlayKey?: string;
    projectID?: string;
    capacitorPlugins: string[];

    icon: string;
    adaptiveIcon?: AdaptiveIconConfig;

    splash: string;

    mobileRedirect?: WebRedirectConfig;

    ios?: IOSConfig;
    admobAppIds?:AdMobAppIds;
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

    const packagerPath = getPackagerPath();
    let icon = app.icon ?? 'assets/icon.png';
    if (!existsSync(icon)) {
        icon = path.join(packagerPath, 'templates/_common/icon.png');
    }
    let splash = app.icon ?? 'assets/splash.png';
    if (!existsSync(splash)) {
        splash = path.join(packagerPath, 'templates/_common/splash.png');
    }

    return {
        name, version, versionCode, appName, appId, capacitorPlugins, keys, orientation, backgroundColor,
        sentry: app.sentry,
        googlePlayKey: app.googlePlayKey,
        admobAppIds: app.admobAppIds,
        projectID: app.projectID,
        icon, splash,
        mobileRedirect: app.mobileRedirect,
        adaptiveIcon: app.adaptiveIcon,
        ios: app.ios
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
    const R = /[\\/@._]/g;
    const incorrectSymbols = name.match(R);
    if (incorrectSymbols && incorrectSymbols.length > 0) {
        console.warn("NAME contains strange symbols!", ...incorrectSymbols);
        throw new Error("app-config.json: name field is not valid");
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