declare module 'xcode' {

    export interface PBXGroup {
        path?: string;
    }

    export class XCProject {
        parse(onError: (err: any) => void): void;

        addPbxGroup(filePathsArray: string[], name:string, path:string, sourceTree?:string):any;

        addCopyfile(filepath: string, opts?:{}):any;

        addResourceFile(filepath: string, opt?: {}, group?: string): any;

        addHeaderFile(filepath: string): any;

        addSourceFile(filepath: string): any;

        addFramework(filepath: string): any;

        writeSync(): string;

        pbxGroupByName(id: string): PBXGroup;
    }

    export function project(projectPath: string): XCProject;
}
