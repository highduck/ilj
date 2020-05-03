export interface BundleDef {
    name: string,
    items?: AnyItem[]
}

export type AnyItem = AtlasDef | FlashDef | AudioDef | FontDef;

export interface AtlasDef {
    type: 'atlas'
    id: string,
    pngquant?: boolean
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