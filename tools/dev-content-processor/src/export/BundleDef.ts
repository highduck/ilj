export interface BundleDef {
    id?: string,
    items?: AnyItem[]
}

export type AnyItem = AtlasDef | FlashDef | AudioDef | FontDef | TextureDef | JsonFileDef;

export const enum ImageFormatType {
    PNG = 'png',
    JPEG = 'jpeg'
}

export interface AtlasDef {
    type: 'atlas'
    id: string,
    format?: ImageFormatType,
    alpha?: boolean,
    png?: {
        quant?: boolean // false
    },
    jpeg?: {
        quality?: number // 90
    }
}

export interface FlashDef {
    type: 'flash',
    id: string,
    path?: string,
    atlas?: string,
    sourceScale?: number
}

export interface AudioDef {
    type: 'audio',
    glob: string,
    compress?: boolean
}

export interface FontDef {
    type: 'font'
    id: string,
    path?: string,
    size?: number,
    style?: {
        strokeWidth?: number,
        strokeColor?: { r: number, g: number, b: number, a: number }
    }
}

export interface TextureDef {
    type: 'texture'
    id: string,
    path: string
}

export interface JsonFileDef {
    type: 'json'
    id: string,
    path?: string,
    // resource will processed, and exported to bundle,
    // but not included in bundle meta,
    // and could be loaded only manually if you know the path
    excludeFromBundle?: boolean
}