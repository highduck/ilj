import path from "path";
import {Workspace} from "./workspace";
import {resolveWorkspaces} from "./resolveWorkspaces";

export class WorkTree {

    readonly list: Workspace[] = [];
    readonly map = new Map<string, Workspace>();

    constructor(readonly basedir: string,
                readonly root: Workspace) {
        this.collectInfo(root);
        this.resolveDependencies(root);
    }

    private collectInfo(ws: Workspace) {
        this.list.push(ws);
        if (ws.pkg.name) {
            this.map.set(ws.pkg.name, ws);
        }
        for (const n of ws.workspaces) {
            this.collectInfo(n);
        }
    }

    private resolveDependencies(ws: Workspace) {
        mapDependencies(this.map, ws.pkg.dependencies, ws.crossDependencies);
        // mapDependencies(this.map, ws.pkg.devDependencies, ws.crossDependencies);
        // mapDependencies(this.map, ws.pkg.peerDependencies, ws.crossDependencies);
        for (const n of ws.workspaces) {
            this.resolveDependencies(n);
        }
    }

    static load(basedir: string): WorkTree {
        const root = Workspace.load(path.join(basedir, 'package.json'));
        resolveWorkspaces(root);
        return new WorkTree(basedir, root);
    }
}

function mapDependencies(workspacesMap: Map<string, Workspace>,
                         dependencies: { [name: string]: string } | undefined,
                         outDependencies: Workspace[]) {
    if (dependencies) {
        for (const depName of Object.keys(dependencies)) {
            const depWS = workspacesMap.get(depName);
            if (depWS) {
                outDependencies.push(depWS);
            }
        }
    }
}