import {Color32_ARGB, Matrix2D, Rect, Vec2} from "@highduck/math";
import {ColorTransform} from "../xfl/ColorTransform";

export const enum sg_filter_type {
    none,
    drop_shadow,
    glow
}

export class filter_data {
    type = sg_filter_type.none;
    quality = 1;
    color: Color32_ARGB = 0;
    readonly blur = new Vec2();
    readonly offset = new Vec2();

    serialize(io: any) {
        // io(type, quality, color, blur, offset);
    }
}

export class dynamic_text_data {
    readonly rect = new Rect();
    text: string = "";
    face: string = "";
    readonly alignment = new Vec2();
    line_spacing = 0;
    line_height = 0;
    size = 0;
    color: Color32_ARGB = 0;

    serialize(io: any) {
        //io(rect, text, face, alignment, line_spacing, line_height, size, color);
    }
}

// TODO: it should be optimized with easing table store :)
export class easing_data_t {
    attribute = 0;
    ease = 0;
    curve: Vec2[] = [];

    serialize(io: any) {
        //io(attribute, ease, curve);
    }
}

export class movie_frame_data {
    index = 0;
    duration = 0;
    motion_type = 0;

    readonly tweens: easing_data_t[] = [];

    key = 0;
    readonly position = new Vec2();
    readonly scale = new Vec2();
    readonly skew = new Vec2();
    readonly pivot = new Vec2();
    readonly color = new ColorTransform();

    serialize(io: any) {
        //io(index, duration, motion_type, key, position, scale, skew, pivot, color, tweens);
    }
}

export class movie_layer_data {
    key = 0;
//    std::string ref;
    readonly frames: movie_frame_data[] = [];

    serialize(io: any) {
        // io(key, frames);
    }
}

export class sg_movie_data {
    frames = 1;
    readonly layers: movie_layer_data[] = [];

    serialize(io: any) {
        // io(frames, layers);
    }
}

export class sg_node_data {

    readonly matrix = new Matrix2D();
    readonly color = new ColorTransform();

    // instance name
    name: string = "";

    // name in library
    libraryName: string = "";

    // sprite id
    sprite?: string = undefined;

    button = false;
    touchable = true;
    visible = true;
    readonly scaleGrid = new Rect();
    readonly hitRect = new Rect();
    readonly clipRect = new Rect();
    readonly children: sg_node_data[] = [];
    readonly filters: filter_data[] = [];
    script: undefined | string = undefined;
    dynamicText: undefined | dynamic_text_data = undefined;
    movie: undefined | sg_movie_data = undefined;
    animationKey = 0;
    layerKey = 0;

    serialize(io: any) {
        // io(
        //     name,
        //     libraryName,
        //     matrix,
        //     sprite,
        //
        //     button,
        //     touchable,
        //     visible,
        //
        //     script,
        //     color,
        //     scaleGrid,
        //     hitRect,
        //     clipRect,
        //
        //     children,
        //     filters,
        //     dynamicText,
        //     movie,
        //
        //     animationKey,
        //     layerKey
        // );
    }
}

export class sg_file {
    constructor(
        readonly library: sg_node_data,
        readonly linkages: Map<string, string>
    ) {

    }

    serialize(io: any) {
        //io(linkages, library);
    }
}