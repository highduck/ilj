import {ChildProcess, spawn} from "child_process";
import resolve from 'resolve';
import * as path from 'path';
import {TSCompileOptions} from "./TSCompileOptions";
import {fillDefaultOptionsTypeScript} from "./fillDefaultOptionsTypeScript";

function createTSCProcess(args: string[]): ChildProcess {
    const bin = path.join(path.dirname(resolve.sync('typescript/package.json')), 'bin', 'tsc');
    return spawn(bin, args, {
        //detached: true,
        stdio: "inherit"
    });
}

async function tscAsync(args: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
        const child = createTSCProcess(args);
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
function generateTSCArguments(options: TSCompileOptions): string[] {
    const args: string[] = [];
    if (options.buildReferences) {
        args.push('--build');
    }
    if (options.verbose) {
        args.push('--verbose');
    }
    if (options.force) {
        args.push('--force');
    }
    if (options.watch) {
        args.push('--watch');
    }
    args.push(options.tsconfig);
    return args;
}

export function buildTypeScript(options?: Partial<TSCompileOptions>): Promise<number> {
    const opts = fillDefaultOptionsTypeScript(options);
    opts.watch = false;
    const args = generateTSCArguments(opts);
    return tscAsync(args);
}

export function watchTypeScript(options?: Partial<TSCompileOptions>): ChildProcess {
    const opts = fillDefaultOptionsTypeScript(options);
    opts.watch = false;
    opts.force = false;
    const args = generateTSCArguments(opts);
    return createTSCProcess(args);
}