declare module 'pngquant-bin' {
    const path: string;
    export = path;
}

declare module 'jpegtran-bin' {
    const path: string;
    export = path;
}

declare module 'folder-hash' {
    export function hashElement(p: string, options: any): Promise<{ name: string, hash: string }>;
}