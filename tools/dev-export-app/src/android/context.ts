import path from "path";
import {BaseProjectConfiguration, BaseProjectContext} from "../common/BaseProjectContext";
import {execSync} from "child_process";

export interface AndroidSigningConfig {
    storeFilePath: string;
    storePassword: string;
    keyAlias: string;
    keyPassword: string;
}

export interface AndroidSigningConfigurations {
    debug?: AndroidSigningConfig;
    release?: AndroidSigningConfig;
}

function gradle(cwd: string, ...args: string[]) {
    execSync('./gradlew ' + args.join(' '), {
        stdio: 'inherit',
        encoding: 'utf-8',
        cwd
    });
}

export class AndroidProjectContext extends BaseProjectContext {

    genProjectResPath: string;
    appIdPath: string; // package

    constructor(config: Partial<BaseProjectConfiguration>) {
        super(config, 'android');

        //this.genProjectPublicDir = path.join(this.genProjDir, 'app/src/main/assets/public');
        this.genProjectResPath = path.join(this.genProjDir, 'app/src/main/res');

        this.appIdPath = this.config.appId.replace(/\./g, '/');
    }

    bundle() {
        gradle(this.genProjDir, 'bundleRelease')
    }
}