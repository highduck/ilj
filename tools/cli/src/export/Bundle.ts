export interface BundleDef {
    name: string,
    assets?: AnyItem[]
}

export type AnyItem = AtlasDef | FlashDef | SoundDef | FontDef;

export interface AtlasDef {
    type: 'atlas'
    name: string
}

export interface FlashDef {
    type: 'flash',
    name: string,
    file?: string,
    atlas?: string
}

export interface SoundDef {
    type: 'sound',
    glob: string
}

export interface FontDef {
    type: 'font'
    name: string,
    path?: string,
    size?: number
}