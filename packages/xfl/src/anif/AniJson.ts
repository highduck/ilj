import {Color32_ARGB} from "@highduck/math";

export const enum FilterType {
    None = 0,
    DropShadow = 1,
    Glow = 2
}

export interface FilterJson {
    type: FilterType;
    quality: number;
    color: Color32_ARGB;
    blur: [number, number];
    offset: [number, number];
}

interface DynamicTextJson {
    rect: [number, number, number, number];
    text: string;
    face: string;
    alignment: [number, number];
    line_spacing: number;
    line_height: number;
    size: number;
    color: Color32_ARGB;
}

export interface EasingJson {
    attribute?: number; // default = 0
    ease?: number; // default = 0
    curve?: number[]; //pairs: x,y,x,y,x,y...
}

interface MovieFrameJson {
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

interface MovieLayerJson {
    key: number;
    frames: MovieFrameJson[];
}

export interface MovieJson {
    frames: number;
    layers: MovieLayerJson[];
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
}

export type LinkagesMap = { [key: string]: string | undefined };

export interface AniJson {
    linkages: LinkagesMap;
    library: NodeJson;
}

