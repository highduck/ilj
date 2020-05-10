import {Color32_ARGB, Color4, Matrix2D, Rect, Vec2} from "@highduck/math";
import {
    AniJson,
    DynamicTextJson,
    EasingJson,
    FilterJson,
    FilterType,
    MovieFrameJson,
    MovieJson,
    MovieLayerJson,
    NodeJson,
    TweenTargetType
} from "@highduck/anijson";
import {fixPrecision, mapToDict, tupleColor4, tupleRect, tupleVec2} from "./Serialize";
import {LoopMode} from "../xfl/dom";

export class SgFilterData {
    type = FilterType.None;
    quality = 1;
    color: Color32_ARGB = 0;
    readonly blur = new Vec2();
    readonly offset = new Vec2();

    serialize(): FilterJson {
        return {
            type: this.type,
            quality: this.quality,
            color: this.color,
            blur: tupleVec2(this.blur),
            offset: tupleVec2(this.offset)
        };
    }
}

export class SgDynamicText {
    readonly rect = new Rect();
    text: string = "";
    face: string = "";
    readonly alignment = new Vec2();
    line_spacing = 0;
    line_height = 0;
    size = 0;
    color: Color32_ARGB = 0;

    serialize(): DynamicTextJson {
        return {
            rect: tupleRect(this.rect),
            text: this.text,
            face: this.face,
            line_spacing: this.line_spacing,
            line_height: this.line_height,
            size: this.size,
            color: this.color,
            alignment: tupleVec2(this.alignment)
        };
    }
}

// TODO: it should be optimized with easing table store :)
export class SgEasing {
    constructor(
        readonly attribute = TweenTargetType.All,
        readonly ease = 0,
        readonly curve: Vec2[] = []
    ) {
    }

    serialize(): EasingJson {
        const r: EasingJson = {};

        if (this.attribute !== 0) {
            r.attribute = this.attribute;
        }

        if (this.ease !== 0) {
            r.ease = this.ease;
        }
        if (this.curve.length > 0) {
            r.curve = [];
            for (const p of this.curve) {
                r.curve.push(
                    fixPrecision(p.x, 6),
                    fixPrecision(p.y, 6)
                );
            }
        }
        return r;
    }
}

export class SgMovieFrame {
    index = 0;
    duration = 0;
    motion_type = 0;

    readonly tweens: SgEasing[] = [];

    key = 0;
    readonly position = new Vec2();
    readonly scale = new Vec2();
    readonly skew = new Vec2();
    readonly pivot = new Vec2();
    readonly colorMultiplier = new Color4(1, 1, 1, 1);
    readonly colorOffset = new Color4(0, 0, 0, 0);

    // graphic frame control
    loopMode: LoopMode | undefined = undefined;
    firstFrame = 0;

    serialize(): MovieFrameJson {
        const r: MovieFrameJson = {
            i: this.index,
            len: this.duration,
            key: this.key,
            mot: this.motion_type
        };

        if (!Vec2.ZERO.equals(this.position)) {
            r.p = tupleVec2(this.position);
        }

        if (!Vec2.ONE.equals(this.scale)) {
            r.s = tupleVec2(this.scale);
        }

        if (!Vec2.ZERO.equals(this.skew)) {
            r.r = tupleVec2(this.skew);
        }

        if (!Vec2.ZERO.equals(this.pivot)) {
            r.o = tupleVec2(this.pivot);
        }

        if (!Color4.ONE.equals(this.colorMultiplier)) {
            r.cm = tupleColor4(this.colorMultiplier);
        }

        if (!Color4.ZERO.equals(this.colorOffset)) {
            r.co = tupleColor4(this.colorOffset);
        }

        if (this.tweens.length > 0) {
            r.tweens = this.tweens.map((v) => v.serialize());
        }
        return r;
    }
}

export class SgMovieLayer {
    key = 0;
//    std::string ref;
    readonly frames: SgMovieFrame[] = [];

    serialize(): MovieLayerJson {
        return {
            key: this.key,
            frames: this.frames.map((v) => v.serialize())
        };
    }
}

export class SgMovie {
    frames = 1;
    readonly layers: SgMovieLayer[] = [];
    fps = 24;

    serialize(): MovieJson {
        return {
            frames: this.frames,
            layers: this.layers.map((v) => v.serialize()),
            fps: this.fps
        }
    }
}

export class SgNode {

    readonly matrix = new Matrix2D();
    readonly colorMultiplier = new Color4(1, 1, 1, 1);
    readonly colorOffset = new Color4(0, 0, 0, 0);

    // instance name
    name: string = "";

    // name in library
    libraryName: string = "";

    // sprite id
    sprite: undefined | string = undefined;

    button = false;
    touchable = true;
    visible = true;
    readonly scaleGrid = new Rect();
    readonly hitRect = new Rect();
    readonly clipRect = new Rect();
    readonly children: SgNode[] = [];
    readonly filters: SgFilterData[] = [];
    script: undefined | string = undefined;
    dynamicText: undefined | SgDynamicText = undefined;
    movie: undefined | SgMovie = undefined;
    animationKey = 0;
    layerKey = 0;

    loop: LoopMode | undefined = undefined;
    firstFrame: undefined | number = undefined;

    serialize(): NodeJson {
        const pos = new Vec2(this.matrix.x, this.matrix.y);
        const scale = new Vec2();
        this.matrix.extractScale(scale);
        const skew = new Vec2();
        this.matrix.extractSkew(skew);

        const res: NodeJson = {};
        if (this.name.length > 0) {
            res.id = this.name;
        }
        if (this.libraryName.length > 0) {
            res.ref = this.libraryName;
        }
        // matrix
        if (!Vec2.ZERO.equals(pos)) {
            res.p = tupleVec2(pos, 2);
        }
        if (!Vec2.ONE.equals(scale)) {
            res.s = tupleVec2(scale);
        }
        if (!Vec2.ZERO.equals(skew)) {
            res.r = tupleVec2(skew);
        }
        // color transform
        if (!Color4.ONE.equals(this.colorMultiplier)) {
            res.cm = tupleColor4(this.colorMultiplier);
        }
        if (!Color4.ZERO.equals(this.colorOffset)) {
            res.co = tupleColor4(this.colorOffset);
        }
        // flags
        if (this.button) {
            res.button = this.button;
        }
        if (!this.touchable) {
            res.touchable = this.touchable;
        }
        if (!this.visible) {
            res.visible = this.visible;
        }
        if (this.animationKey !== 0) {
            res.ak = this.animationKey;
        }
        if (this.layerKey !== 0) {
            res.lk = this.layerKey;
        }
        if (this.loop !== undefined) {
            switch (this.loop) {
                case LoopMode.Loop:
                    res.l = 0;
                    break;
                case LoopMode.SingleFrame:
                    res.l = 1;
                    break;
                case LoopMode.PlayOnce:
                    res.l = 2;
                    break;
            }
            res.ff = this.firstFrame!;
        }

        if (this.sprite !== undefined && this.sprite.length > 0) {
            res.spr = this.sprite;
        }
        if (!this.scaleGrid.empty) {
            res.scaleGrid = tupleRect(this.scaleGrid);
        }
        if (!this.hitRect.empty) {
            res.hitRect = tupleRect(this.hitRect);
        }
        if (!this.clipRect.empty) {
            res.clipRect = tupleRect(this.clipRect);
        }
        if (this.dynamicText !== undefined) {
            res.dynamicText = this.dynamicText.serialize();
        }
        if (this.movie !== undefined) {
            res.movie = this.movie.serialize();
        }
        if (this.script !== undefined && this.script.length > 0) {
            res.script = this.script;
        }
        if (this.filters.length > 0) {
            res.filters = this.filters.map((v) => v.serialize());
        }
        if (this.children.length > 0) {
            res.children = this.children.map((v) => v.serialize());
        }
        return res;
    }
}

export class SgFile {
    constructor(
        readonly library: SgNode,
        readonly linkages: Map<string, string>,
        readonly scenes: Map<string, string>
    ) {

    }

    serialize(): AniJson {
        return {
            library: this.library.serialize(),
            linkages: mapToDict(this.linkages),
            scenes: mapToDict(this.scenes)
        };
    }
}