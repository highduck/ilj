import path from "path";
import {fileURLToPath} from 'url';
import {AndroidProjectConfiguration} from "./config";


interface CommonBuildConfiguration {
    target: string;
    mode: string;
}

interface AndroidProjectDirs {
    pub: string;
    res: string;
}

export class AndroidProjectContext {

    inputDirPub: string;

    commonConfig: CommonBuildConfiguration = {
        target: "android",
        mode: "production"
    };

    tempDir: string;

    dir: string;
    basedir: string;

    appName: string = 'I Have To Flap';
    appId: string = 'i.have.to.flap';
    appIdPath: string; // package
    appVersionName: string = '1.0.0';
    appVersionCode: number = 1;

    orientation = 'portrait';
    backgroundColor = '#FF000000';

    signingConfigPath: string = '/Users/ilyak/Dropbox/dev_keys/ihtf/signing.json';

    userCapacitorConfig: string;

    packagerPath: string;

    // capacitorPlugins: { [key: string]: string } = {
    //     "@highduck/capacitor-admob": "^0.0.1",
    //     "@highduck/capacitor-billing": "^0.0.1",
    //     "@highduck/capacitor-firebase": "^0.0.1",
    //     "@highduck/capacitor-play-games": "^0.0.1"
    // };
    capacitorPlugins = [
        "@highduck/capacitor-admob",
        "@highduck/capacitor-billing",
        "@highduck/capacitor-firebase",
        "@highduck/capacitor-play-games"
    ];

    androidProjDir: string;
    androidProjDirs: AndroidProjectDirs;

    constructor(config: AndroidProjectConfiguration) {
        this.basedir = config.basedir ?? process.cwd();
        this.inputDirPub = 'dist/www/' + this.commonConfig.target;
        this.dir = 'dist/projects';
        this.tempDir = 'build/android_cap';

        this.userCapacitorConfig = path.resolve(this.basedir, 'project_android/capacitor.config.json');

        this.packagerPath = path.resolve(fileURLToPath(import.meta.url), '../..');
        this.androidProjDir = path.join(this.dir, 'project-android');
        this.androidProjDirs = {
            pub: path.join(this.androidProjDir, 'app/src/main/assets/public'),
            res: path.join(this.androidProjDir, 'app/src/main/res')
        };

        this.appIdPath = this.appId.replace(/\./g, '/');
    }
}