import {spawn} from "child_process";
import resolve from 'resolve';
import * as path from 'path';
import {TSCompileOptions} from "./TSCompileOptions";
import {fillDefaultOptionsTypeScript} from "./fillDefaultOptionsTypeScript";

async function tscAsync(args: string[]) {
    const bin = path.join(path.dirname(resolve.sync('typescript/package.json')), 'bin', 'tsc');
    return new Promise((resolve, reject) => {
        const child = spawn(bin, args, {
            //detached: true,
            stdio: "inherit"
        });
        child.on('close', (code) => {
            if (code === 0) {
                resolve(code);
            } else {
                reject('tsc exit code: ' + code);
            }
        });
    });
}


// --verbose: Prints out verbose logging to explain what’s going on (may be combined with any other flag)
// --dry: Shows what would be done but doesn’t actually build anything
// --clean: Deletes the outputs of the specified projects (may be combined with --dry)
// --force: Act as if all projects are out of date
// --watch: Watch mode (may not be combined with any flag except --verbose
export function buildTypeScript(options?: Partial<TSCompileOptions>) {
    const opts = fillDefaultOptionsTypeScript(options);
    const args: string[] = [];
    if (opts.buildReferences) {
        args.push('--build');
    }
    if (opts.verbose) {
        args.push('--verbose');
    }
    if (opts.force) {
        args.push('--force');
    }
    if (opts.watch) {
        args.push('--watch');
    }
    args.push(opts.tsconfig);
    return tscAsync(args);
}