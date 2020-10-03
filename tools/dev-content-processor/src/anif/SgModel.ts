import {Matrix2D, Recta, Vec2, Color32_ARGB, Color4} from "@highduck/math";
import {
    AniJson,
    DynamicTextJson,
    EasingJson,
    FilterJson,
    FilterType,
    KeyframeJson,
    MovieJson,
    NodeJson,
    TweenTargetType
} from "@highduck/anijson";
import {fixPrecision, mapToDict, tupleColor4, tupleRect, tupleVec2} from "./Serialize";
import {LoopMode, RotationDirection} from "@highduck/xfl";

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
    readonly rect = new Recta();
    text: string = "";
    face: string = "";
    readonly alignment = new Vec2();
    lineSpacing = 0;
    lineHeight = 0;
    size = 0;
    color: Color32_ARGB = 0;

    serialize(): DynamicTextJson {
        return {
            rect: tupleRect(this.rect),
            text: this.text,
            face: this.face,
            lineSpacing: this.lineSpacing,
            lineHeight: this.lineHeight,
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

    get isDefault(): boolean {
        return this.attribute === TweenTargetType.All &&
            this.ease === 0 &&
            this.curve.length === 0;
    }

    serialize(): EasingJson {
        const r: EasingJson = {};

        if (this.attribute !== 0) {
            r.t = this.attribute;
        }

        if (this.ease !== 0) {
            r.v = this.ease;
        }

        if (this.curve.length > 0) {
            r.c = [];
            for (const p of this.curve) {
                r.c.push(
                    fixPrecision(p.x, 6),
                    fixPrecision(p.y, 6)
                );
            }
        }

        return r;
    }
}

export class SgMovieFrame {
    // KEY FRAME
    index = 0;
    duration = 1;
    motionType = 0;

    readonly easing: SgEasing[] = [];

    readonly position = new Vec2();
    readonly scale = new Vec2(1, 1);
    readonly skew = new Vec2();

    readonly pivot = new Vec2();
    readonly colorMultiplier = new Color4(1, 1, 1, 1);
    readonly colorOffset = new Color4(0, 0, 0, 0);

    visible = true;

    // graphic frame control
    loopMode: LoopMode | undefined = undefined;
    firstFrame = 0;

    // rotation postprocessing
    rotate = RotationDirection.none;
    rotateTimes = 0;

    serialize(): KeyframeJson {
        const r: KeyframeJson = {
            _: [this.index, this.index + this.duration]
        };

        if (this.motionType !== 0) {
            r.m = this.motionType;
        }

        if (this.easing.length > 0) {
            if (this.easing.length === 1 && this.easing[0].isDefault && this.motionType === 1) {
                // oh, ignore this value, we know it's linear by default
            } else {
                r.ease = this.easing.map((v) => v.serialize());
            }
        }

        if (!Vec2.ZERO.equals(this.position)) {
            r.p = tupleVec2(this.position);
        }

        if (!Vec2.ONE.equals(this.scale, 1e-4)) {
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

        if (!this.visible) {
            r.v = this.visible;
        }

        if (this.loopMode !== undefined) {
            switch (this.loopMode) {
                case LoopMode.Loop:
                    r.l = [0];
                    break;
                case LoopMode.PlayOnce:
                    r.l = [1, this.firstFrame];
                    break;
                case LoopMode.SingleFrame:
                    r.l = [2, this.firstFrame];
                    break;
            }
        }
        return r;
    }
}

export class SgMovieLayer {
    readonly frames: SgMovieFrame[] = [];
    readonly targets: SgNode[] = [];
}

export class SgMovie {
    frames = 1;
    layers: SgMovieLayer[] = [];
    fps = 24;

    serialize(): MovieJson {
        const targetsToFrames: KeyframeJson[][] = [];
        for (let i =0 ; i < this.layers.length; ++i) {
            targetsToFrames[i] = this.layers[i].frames.map((v) => v.serialize());
        }
        return {
            l: this.frames,
            f: this.fps,
            t: targetsToFrames
        }
    }
}

export class SgNode {

    // transform
    readonly matrix = new Matrix2D();
    readonly colorMultiplier = new Color4(1, 1, 1, 1);
    readonly colorOffset = new Color4(0, 0, 0, 0);
    visible = true;

    // instance name
    name: string = "";

    // name in library
    libraryName: string = "";

    // sprite id
    sprite: undefined | string = undefined;

    button = false;
    touchable = true;
    readonly scaleGrid = new Recta();
    readonly hitRect = new Recta();
    readonly clipRect = new Recta();
    readonly children: SgNode[] = [];
    readonly filters: SgFilterData[] = [];
    script: undefined | string = undefined;
    dynamicText: undefined | SgDynamicText = undefined;
    movie: undefined | SgMovie = undefined;

    movieTargetId: number | undefined = undefined;

    readonly scripts = new Map<number, string>();
    readonly labels = new Map<number, string>();

    serialize(): NodeJson {
        const r: NodeJson = {};
        if (this.name.length > 0) {
            r.id = this.name;
        }
        if (this.libraryName.length > 0) {
            r.ref = this.libraryName;
        }
        // matrix
        const pos = new Vec2(this.matrix.x, this.matrix.y);
        const scale = new Vec2();
        this.matrix.extractScale(scale);
        const skew = new Vec2();
        this.matrix.extractSkew(skew);
        if (!Vec2.ZERO.equals(pos)) {
            r.p = tupleVec2(pos, 2);
        }
        if (!Vec2.ONE.equals(scale, 1e-5)) {
            r.s = tupleVec2(scale);
        }
        if (!Vec2.ZERO.equals(skew)) {
            r.r = tupleVec2(skew);
        }
        // color transform
        if (!Color4.ONE.equals(this.colorMultiplier)) {
            r.cm = tupleColor4(this.colorMultiplier);
        }
        if (!Color4.ZERO.equals(this.colorOffset)) {
            r.co = tupleColor4(this.colorOffset);
        }

        // flags
        if (this.button) {
            r.button = this.button;
        }
        if (!this.touchable) {
            r.touchable = this.touchable;
        }
        if (!this.visible) {
            r.v = this.visible;
        }
        if (this.movieTargetId !== undefined) {
            r.i = this.movieTargetId;
        }

        if (this.sprite !== undefined && this.sprite.length > 0) {
            r.spr = this.sprite;
        }
        if (!this.scaleGrid.empty) {
            r.scaleGrid = tupleRect(this.scaleGrid);
        }
        if (!this.hitRect.empty) {
            r.hitRect = tupleRect(this.hitRect);
        }
        if (!this.clipRect.empty) {
            r.clipRect = tupleRect(this.clipRect);
        }
        if (this.dynamicText !== undefined) {
            r.tf = this.dynamicText.serialize();
        }
        if (this.movie !== undefined) {
            r.mc = this.movie.serialize();
        }
        if (this.filters.length > 0) {
            r.filters = this.filters.map((v) => v.serialize());
        }
        if (this.children.length > 0) {
            r._ = this.children.map((v) => v.serialize());
        }
        return r;
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
        const library: { [key: string]: NodeJson } = {};
        for (const node of this.library.children) {
            if (node.libraryName.length > 0) {
                const data = node.serialize();
                const ref = data.ref!;
                data.ref = undefined;
                library[ref] = data;
            }
        }
        return {
            library,
            linkages: mapToDict(this.linkages),
            scenes: mapToDict(this.scenes)
        };
    }
}