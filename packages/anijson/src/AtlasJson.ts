export const enum SpriteFlag {
    None = 0,
    Rotated = 1,
    Packed = 2,
}

export interface SpriteJson {
    name: string;
    rc: [number, number, number, number];
    uv: [number, number, number, number];
    flags: SpriteFlag;
}

export interface AtlasPageJson {
    width: number;
    height: number;
    image_path: string;
    sprites: SpriteJson[];
}

export interface AtlasJson {
    pages: AtlasPageJson[];
}