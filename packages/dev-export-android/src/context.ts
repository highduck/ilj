import path from "path";
import {fileURLToPath} from 'url';
import {AndroidProjectConfiguration} from "./config";
import {Pkg, readPkg} from "./pkg";


interface CommonBuildConfiguration {
    target: string;
    mode: string;
}

interface AndroidProjectDirs {
    pub: string;
    res: string;
}

export class AndroidProjectContext {
    pkg: Pkg;

    inputDirPub: string;

    buildTarget: string;
    buildMode: 'production' | 'development';

    basedir: string;
    packagerPath: string;

    genDir: string;
    genProjDir: string;
    genProjDirs: AndroidProjectDirs;

    dir: string;
    outputProjDir: string;

    appIdPath: string; // package

    userCapacitorConfig: string;

    debug: boolean;

    constructor(config: Partial<AndroidProjectConfiguration>) {
        this.basedir = config.basedir ?? process.cwd();
        this.buildTarget = config.target ?? 'android';
        this.buildMode = config.mode ?? 'development';
        this.debug = config.debug ?? this.buildMode === 'development';

        this.pkg = readPkg(this.basedir);

        this.inputDirPub = 'dist/www/' + this.buildTarget;

        // build dir structure
        this.genDir = `build/${this.buildTarget}`;
        this.genProjDir = path.join(this.genDir, 'android');
        this.genProjDirs = {
            pub: path.join(this.genProjDir, 'app/src/main/assets/public'),
            res: path.join(this.genProjDir, 'app/src/main/res')
        };

        // output dir structure
        this.dir = 'dist/projects';
        this.outputProjDir = path.join(this.dir, this.pkg.name + '-' + this.buildTarget);

        // different paths
        this.userCapacitorConfig = path.resolve(this.basedir, 'project_android/capacitor.config.json');
        this.packagerPath = path.resolve(fileURLToPath(import.meta.url), '../..');
        this.appIdPath = this.pkg.appId.replace(/\./g, '/');
    }
}