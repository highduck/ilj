import {spawnSync} from "child_process";
import resolve from 'resolve';
import * as path from 'path';

function tsc(args: string[]): number {
    const bin = path.join(path.dirname(resolve.sync('typescript/package.json')), 'bin', 'tsc');
    const child = spawnSync(bin, args, {stdio: 'pipe', encoding: 'utf-8'});
    console.log("stderr", child.stderr ? child.stderr.toString() : null);
    console.log("stdout", child.stdout ? child.stdout.toString() : null);
    console.log("exit code", child.status);
    if (child.error) {
        console.error(child.error);
        return -1;
    }

    return child.status ?? 0;
}


export interface TypeScriptCompileOptions {
    configPath: string;
    verbose?: boolean;
    force?: boolean;
}

// --verbose: Prints out verbose logging to explain what’s going on (may be combined with any other flag)
// --dry: Shows what would be done but doesn’t actually build anything
// --clean: Deletes the outputs of the specified projects (may be combined with --dry)
// --force: Act as if all projects are out of date
// --watch: Watch mode (may not be combined with any flag except --verbose
export function buildTypeScript(options: TypeScriptCompileOptions) {
    const args = ['--build'];
    if (options.verbose) {
        args.push('--verbose');
    }
    if (options.force) {
        args.push('--force');
    }
    args.push(options.configPath);
    return tsc(args) === 0;
}