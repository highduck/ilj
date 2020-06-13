import {spawn} from "child_process";
import resolve from 'resolve';
import * as path from 'path';

async function tscAsync(args: string[]) {
    const bin = path.join(path.dirname(resolve.sync('typescript/package.json')), 'bin', 'tsc');
    return new Promise((resolve, reject) => {
        const child = spawn(bin, args, {
            //detached: true,
            stdio: "inherit"
        });
        child.on('close', () => {
            resolve();
        });
    });
}

export interface TypeScriptCompileOptions {
    configPath: string;
    verbose?: boolean;
    force?: boolean;
    watch?: boolean;
}

// --verbose: Prints out verbose logging to explain what’s going on (may be combined with any other flag)
// --dry: Shows what would be done but doesn’t actually build anything
// --clean: Deletes the outputs of the specified projects (may be combined with --dry)
// --force: Act as if all projects are out of date
// --watch: Watch mode (may not be combined with any flag except --verbose
export async function buildTypeScript(options: TypeScriptCompileOptions) {
    const args = ['--build'];
    if (options.verbose) {
        args.push('--verbose');
    }
    if (options.force) {
        args.push('--force');
    }
    if (options.watch) {
        args.push('--watch');
    }
    args.push(options.configPath);
    return tscAsync(args);
}