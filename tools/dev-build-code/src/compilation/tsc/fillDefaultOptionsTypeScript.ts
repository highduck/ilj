import {TSCompileOptions} from "./TSCompileOptions";

export function fillDefaultOptionsTypeScript(options?: Partial<TSCompileOptions>): TSCompileOptions {
    const tsconfig = options?.tsconfig ?? './tsconfig.project.json';
    const verbose = options?.verbose ?? false;
    const force = options?.force ?? false;
    const watch = options?.watch ?? false;
    const buildReferences = options?.buildReferences ?? true;
    return {tsconfig, verbose, force, watch, buildReferences};
}