import {Pkg} from "./pkg";
import fs from "fs";
import path from "path";

export class Workspace {

    readonly workspaces: Workspace[] = [];
    readonly crossDependencies: Workspace[] = [];

    constructor(readonly url: string,
                readonly pkg: Pkg) {

    }

    static load(url: string): Workspace {
        const txt = fs.readFileSync(url, 'utf-8');
        const pkg: Pkg = JSON.parse(txt);
        return new Workspace(url, pkg);
    }

    relativePathTo(workspace: Workspace) {
        return path.relative(path.dirname(this.url), path.dirname(workspace.url));
    }

    resolveLocalPath(...parts:string[]):string {
        return path.resolve(path.dirname(this.url), ...parts);
    }

    hasFile(...parts:string[]):boolean {
        return fs.existsSync(path.resolve(path.dirname(this.url), ...parts));
    }
}
