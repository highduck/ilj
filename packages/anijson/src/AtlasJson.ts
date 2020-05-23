export const enum SpriteFlag {
    None = 0,
    Rotated = 1,
    Packed = 2,
}

export type SpriteJson = [
    number, number, number, number, // rect
    number, number, number, number, // tex coords
    number // flags
];

export interface AtlasPageJson {
    width: number;
    height: number;
    img: string;
    mask?: string;
    // spot is a opaque white rect zone is available
    spot?: [number, number, number, number];

    // generate mip maps (default: true)
    mipmap?: boolean;

    // texture is opaque (default: false)
    opaque?: boolean;

    sprites: { [key: string]: SpriteJson };
}

export interface AtlasJson {
    pages: AtlasPageJson[];
}