import {WorkTree} from "../workspaces/worktree";
import * as path from 'path';
import * as fs from 'fs';

interface TSConfig {
    compilerOptions?: {
        composite?: boolean;
        baseUrl?: string;
        paths?: { [name: string]: string[] };
    };
    references?: { path?: string }[];
}

function readTypeScriptConfig(url: string): TSConfig {
    const tsconfig = JSON.parse(fs.readFileSync(url, 'utf-8'));
    return tsconfig;
}

export function updateTSConfigPaths(tree: WorkTree) {
    for (const ws of tree.list) {
        try {
            const tsconfigFilename = 'tsconfig.json';
            const tsconfigPath = ws.resolveLocalPath(tsconfigFilename);
            const tsconfig = readTypeScriptConfig(tsconfigPath);
            const paths: { [name: string]: string[] } = {};
            for (const dep of ws.crossDependencies) {
                if (dep.pkg.name && dep.hasFile('src/index.ts')) {
                    paths[dep.pkg.name] = [path.join(ws.relativePathTo(dep), 'src/index.ts')];
                }
            }
            if (!tsconfig.compilerOptions) {
                tsconfig.compilerOptions = {};
            }
            tsconfig.compilerOptions.baseUrl = '.';
            tsconfig.compilerOptions.paths = paths;

            fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, undefined, 2));
        } catch {
        }
    }
}

export function updateTSProjectReferences(tree: WorkTree) {
    for (const ws of tree.list) {
        try {
            const tsconfigFilename = 'tsconfig.project.json';
            const tsconfigPath = ws.resolveLocalPath(tsconfigFilename);
            const tsconfig = readTypeScriptConfig(tsconfigPath);
            const references: { path?: string }[] = [];
            for (const dep of ws.crossDependencies.concat(ws.workspaces)) {
                if (dep.pkg.name && dep.hasFile(tsconfigFilename)) {
                    references.push({
                        path: path.join(ws.relativePathTo(dep), tsconfigFilename)
                    });
                }
            }
            tsconfig.references = references;
            tsconfig.compilerOptions = tsconfig.compilerOptions?? {};
            tsconfig.compilerOptions.composite = true;

            fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, undefined, 2));
        } catch {
        }
    }
}