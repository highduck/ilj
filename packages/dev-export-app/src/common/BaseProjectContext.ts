import {TemplateGenerator} from "./TemplateGenerator";
import {IljAppConfig, readAppConfig} from './app-config';
import path from "path";
import {fileURLToPath} from "url";
import {existsSync, mkdirSync, writeFileSync} from "fs";
import {cap, isDir} from "./utils";
import rimraf from "rimraf";

export interface BaseProjectConfiguration {
    basedir: string;
    target: string;
    mode: 'development' | 'production';
    debug: boolean;
}

export class BaseProjectContext {
    generator: TemplateGenerator;
    config: IljAppConfig;

    inputDirPub: string;

    buildTarget: string;
    buildPlatform: string;
    buildMode: 'production' | 'development';

    basedir: string;
    packagerPath: string;

    genDir: string;
    genProjDir: string;

    debug: boolean;

    constructor(config: Partial<BaseProjectConfiguration>, platform: string, baseTarget?: string) {
        this.basedir = config.basedir ?? process.cwd();
        this.buildPlatform = platform;
        this.buildTarget = config.target ?? baseTarget ?? platform;
        this.buildMode = config.mode ?? 'development';
        this.debug = config.debug ?? this.buildMode === 'development';

        this.config = readAppConfig(this.basedir);

        this.generator = new TemplateGenerator({
            config: this.config,
            flags: [],
            buildMode: this.buildMode,
            target: this.buildTarget,
            platform: 'android'
        });

        // build dir structure
        this.genDir = `dist/${this.buildTarget}`;

        this.inputDirPub = path.join(this.genDir, 'www');

        this.genProjDir = path.join(this.genDir, this.buildPlatform);

        // different paths
        this.packagerPath = path.resolve(fileURLToPath(import.meta.url), '../../..');
    }

    writePackageJson() {
        console.info('write package.json');

        const pkgPath = path.join(this.genDir, 'package.json');

        const dependencies: { [key: string]: string } = {};
        for (const id of this.config.capacitorPlugins) {
            dependencies[id] = "*";
        }

        writeFileSync(pkgPath, JSON.stringify({
            name: this.config.name + '-' + this.buildTarget,
            private: true,
            dependencies
        }));
    }

    writeCapacitorConfig() {
        const config = this.config;

        const capPlugins: { [key: string]: any } = {
            SplashScreen: {
                launchAutoHide: false,
                showSpinner: true,
                splashFullScreen: true,
                splashImmersive: true,
                androidScaleType: "CENTER_CROP"
            }
        };

        if (config.googlePlayKey) {
            capPlugins.Billing = {
                play_store_key: config.googlePlayKey
            };
        }

        if (config.admobAppId) {
            capPlugins.AdMob = {
                appId: config.admobAppId,
                testDevices: [
                    //   "B7BE56791F5F730DB99AB704264FA98C"
                ]
            };
        }

        const capConfig = {
            appId: config.appId,
            appName: config.appName,
            backgroundColor: config.backgroundColor,
            bundledWebRuntime: false,
            npmClient: "yarn",
            webDir: "www",
            hideLogs: this.buildMode === 'production',
            android: {
                webContentsDebuggingEnabled: this.debug
            },
            plugins: capPlugins
        }
        // try {
        // TODO: pre-generate plugins part????!
        // const plugins = JSON.parse(readFileSync(ctx.userCapacitorConfig, 'utf8')).plugins;
        // if (plugins) {
        //     capConfig.plugins = plugins;
        // }
        // } catch {
        // }
        writeFileSync(path.join(this.genDir, 'capacitor.config.json'), JSON.stringify(capConfig));
    }

    checkPublicDir() {
        const indexFilepath = path.join(this.inputDirPub, 'index.html');
        if (!isDir(this.inputDirPub) || !existsSync(indexFilepath)) {
            console.warn('"www/index.html" is missing, generating empty stub..');
            mkdirSync(this.inputDirPub);
            writeFileSync(indexFilepath, '<html lang="en"></html>');
        }
    }

    cleanProjectFiles() {
        console.info(`Clean project folder: ${this.genDir}`);
        if (isDir(this.genProjDir)) {
            console.info(` - Remove directory for project generation: ${this.genProjDir}`);
            rimraf.sync(this.genProjDir);
        }
        const files = ['package.json', 'capacitor.config.json'];
        for (const file of files) {
            const filepath = path.join(this.genDir, file);
            if (existsSync(filepath)) {
                console.info(` - Remove config file: ${file}`);
                rimraf.sync(filepath);
            }
        }
    }

    initializeCapacitorProject() {
        this.cleanProjectFiles();
        this.writePackageJson();
        this.writeCapacitorConfig();
        this.checkPublicDir();

        console.log(`cap add ${this.buildPlatform}`);
        cap(['add', this.buildPlatform], this.genDir);
    }

    bundle() {

    }

    deploy() {

    }
}