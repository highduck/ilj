export type ARGB32 = number;

export const enum FilterType {
    None = 0,
    DropShadow = 1,
    Glow = 2
}

export const enum TweenTargetType {
    All = 0,
    Position = 1,
    Rotation = 2,
    Scale = 3,
    Color = 4
}

export interface FilterJson {
    type: FilterType;
    quality: number;
    color: ARGB32;
    blur: [number, number];
    offset: [number, number];
}

export interface DynamicTextJson {
    rect: [number, number, number, number];
    text: string;
    face: string;
    alignment: [number, number];
    line_spacing: number;
    line_height: number;
    size: number;
    color: ARGB32;
}

export interface EasingJson {
    attribute?: TweenTargetType; // default = 0
    ease?: number; // default = 0
    curve?: number[]; //pairs: x,y,x,y,x,y...
}

export interface MovieFrameJson {
    i: number; // index
    len: number; // duration
    mot: number; // motion_type
    key: number;

    // position-scale-rotation(skew)-origin(pivot)
    p?: [number, number];
    s?: [number, number];
    r?: [number, number];
    o?: [number, number];

    // color multiplier, color offset
    cm?: [number, number, number, number];
    co?: [number, number, number, number];

    tweens?: EasingJson[];
}

export interface MovieLayerJson {
    key: number;
    frames: MovieFrameJson[];
}

export interface MovieJson {
    frames: number;
    layers: MovieLayerJson[];
    fps?: number;
}

export interface NodeJson {

    // instance `name`
    id?: string;

    // name in library: `libraryName`
    ref?: string;
    // position-scale-rotation_skew
    p?: [number, number];
    s?: [number, number];
    r?: [number, number];

    // color multiplier, color offset
    cm?: [number, number, number, number];
    co?: [number, number, number, number];

    // sprite id
    spr?: string;

    button?: boolean;
    touchable?: boolean;
    visible?: boolean;
    scaleGrid?: [number, number, number, number];
    hitRect?: [number, number, number, number];
    clipRect?: [number, number, number, number];
    children?: NodeJson[];
    filters?: FilterJson[];
    script?: string;
    dynamicText?: DynamicTextJson;
    movie?: MovieJson;

    ak?: number; // `animationKey`
    lk?: number; // `layerKey`

    l?:number; // loop mode
    ff?:number; // first frame
}

export interface AniJson {
    linkages: { [key: string]: string };
    scenes: { [key: string]: string };
    library: NodeJson;
}

