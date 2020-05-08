export const enum SpriteFlag {
    None = 0,
    Rotated = 1,
    Packed = 2,
}

export type SpriteJson = [
    number, number, number, number, // rect
    number, number, number, number, // tex coords
    number // flags
]

// {
//     name: string;
//     rc: [number, number, number, number];
//     uv: [number, number, number, number];
//     flags: SpriteFlag;
// }

export interface AtlasPageJson {
    width: number;
    height: number;
    img: string;
    mask?: string;

    // generate mip maps (default: true)
    mipmap?: boolean;

    // texture is opaque (default: false)
    opaque?: boolean;

    sprites: { [key: string]: SpriteJson };
}

export interface AtlasJson {
    pages: AtlasPageJson[];
}