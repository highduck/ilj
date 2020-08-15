import {BaseProjectConfiguration, BaseProjectContext} from "../common/BaseProjectContext";
import {execSync} from 'child_process';

export class PWAProjectContext extends BaseProjectContext {

    constructor(config: Partial<BaseProjectConfiguration>) {
        super(config, 'web');

    }

    deploy() {
        execSync('firebase deploy', {
            stdio: 'inherit',
            encoding: 'utf-8',
            cwd: this.basedir
        });
    }
}