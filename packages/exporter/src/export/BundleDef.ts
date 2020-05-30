export interface BundleDef {
    id?: string,
    items?: AnyItem[]
}

export type AnyItem = AtlasDef | FlashDef | AudioDef | FontDef;

export const enum ImageFormatType {
    PNG = 'png',
    JPEG = 'jpeg'
}

export interface AtlasDef {
    type: 'atlas'
    id: string,
    format?: ImageFormatType,
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
    atlas?: string
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
    size?: number
}