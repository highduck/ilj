export interface TSCompileOptions {
    tsconfig: string;
    verbose: boolean;
    force: boolean;
    watch: boolean;
    buildReferences: boolean;
}