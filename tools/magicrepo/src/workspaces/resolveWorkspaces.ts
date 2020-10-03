import path from "path";
import {Workspace} from "./workspace";
import _glob from 'glob';

const {glob} = _glob;

export function resolveWorkspaces(workspace: Workspace) {
    if (workspace.pkg.private && workspace.pkg.workspaces) {
        for (const workspacePattern of workspace.pkg.workspaces) {
            const packages = glob.sync(path.join(path.dirname(workspace.url), workspacePattern, 'package.json'));
            for (const packagePath of packages) {
                try {
                    const packageWorkspace = Workspace.load(packagePath);
                    workspace.workspaces.push(packageWorkspace);
                    resolveWorkspaces(packageWorkspace);
                } catch {
                }
            }
        }
    }
}
