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
    lineSpacing: number;
    lineHeight: number;
    size: number;
    color: ARGB32;
}

export interface EasingJson {
    // target attribute
    t?: TweenTargetType; // default = 0
    // ease value
    v?: number; // default = 0
    // curve points
    c?: number[]; //pairs: x,y,x,y,x,y...
}

export interface TransformJson {
    // position-scale-rotation(skew)-origin(pivot)
    p?: [number, number];
    s?: [number, number];
    r?: [number, number];
    o?: [number, number];

    // color multiplier, color offset
    cm?: [number, number, number, number];
    co?: [number, number, number, number];

    // is visible
    v?: boolean;
}

export interface KeyframeJson extends TransformJson {
    // start time, end time
    // additional could be used [Flags for motion+loop-mode, first frame]
    _: number[];
    // i: number; // start time
    // e: number; // end time
    // motion type
    m?: number; // None by default
    // loop/firstFrame
    l?: number[];

    // easing setup
    ease?: EasingJson[];
}

export interface MovieJson {
    // length, total frames
    l: number;
    // [Target ID] -> Frames[]
    t: KeyframeJson[][];
    // fps
    f?: number;
}

export interface NodeJson extends TransformJson {
    // name in library: `libraryName`
    ref?: string;

    // instance name
    id?: string;

    // Sprite ID
    spr?: string;

    // Node's children
    _?: NodeJson[];

    button?: boolean;
    touchable?: boolean;
    scaleGrid?: [number, number, number, number];
    hitRect?: [number, number, number, number];
    clipRect?: [number, number, number, number];
    filters?: FilterJson[];
    tf?: DynamicTextJson;
    mc?: MovieJson;
    // Animation target ID
    i?: number;
}

export interface AniJson {
    linkages: { [key: string]: string };
    scenes: { [key: string]: string };
    library: { [key: string]: NodeJson };
}

