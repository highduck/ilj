import path from "path";
import {BaseProjectConfiguration, BaseProjectContext} from "../common/BaseProjectContext";

export class IOSProjectContext extends BaseProjectContext {

    constructor(config: Partial<BaseProjectConfiguration>) {
        super(config, 'ios');

        //this.genProjectPublicDir = path.join(this.genProjDir, 'public');
    }
}