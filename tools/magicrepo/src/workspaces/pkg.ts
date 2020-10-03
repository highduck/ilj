export interface Pkg {
    name?: string;
    version?: string;
    private?: boolean;
    workspaces?: string[];
    dependencies?: {[name:string]:string};
    devDependencies?: {[name:string]:string};
    peerDependencies?: {[name:string]:string};
}
