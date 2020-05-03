import {Color32_ARGB, Color4, Matrix2D, Rect, Vec2} from "@highduck/math";
import {
    BlendMode,
    DOMAnyFilter,
    DOMEdges,
    DOMFillStyle,
    DOMFilterKind,
    DOMFrame,
    DOMGradientEntry,
    DOMLayer,
    DOMSolidStroke,
    DOMStrokeStyle,
    DOMTextAttributes,
    DOMTextRun,
    DOMTimeline,
    ElementType,
    FillType,
    LayerType,
    LineCaps,
    LineJoints,
    RotationDirection,
    ScaleMode,
    SolidStyleType,
    SpreadMethod,
    SymbolType,
    TweenTarget,
    TweenType
} from "./dom";
import {
    oneOrMany,
    parseColorCSS,
    parseColorTransform,
    parseMatrix2D,
    readAlignment,
    readColor,
    readPoint,
    readRect,
    readScaleGrid,
    readTransformationPoint
} from "./parsing";
import {parseEdges} from "./parseEdges";
import he from 'he';

export class Bitmap {
    path?: string;
    width = 0;
    height = 0;
    bpp = 4;
    alpha = true;
    data?: Uint8Array;
}

class Filter {
    type = DOMFilterKind.none;

    readonly color = new Color4();
    readonly blur = new Vec2();
    distance = 0.0;
    angle = 0.0; // degrees
    quality = 1; // TODO: check
    strength = 100.0;
    inner = false;
    knockout = false;
    hideObject = false;

    parse(tag: string, data: DOMAnyFilter) {
        this.type = tag as DOMFilterKind;
        readColor(this.color, data);
        this.blur.x = data._blurX ?? 4;
        this.blur.y = data._blurY ?? 4;
        this.distance = data._distance ?? 4;
        this.angle = data._angle ?? 45;
        this.quality = data._quality ?? 1;
        this.strength = data._strength ?? 100.0;
        this.inner = data._inner ?? false;
        this.knockout = data._knockout ?? false;
        this.hideObject = data._hideObject ?? false;
    }
}

class Edge {
    readonly commands: number[] = [];
    readonly values: number[] = [];
    fill_style_0 = 0;
    fill_style_1 = 0;
    stroke_style = 0;

    parse(data: DOMEdges) {
        if (data._edges !== undefined) {
            this.fill_style_0 = data._fillStyle0 ?? 0;
            this.fill_style_1 = data._fillStyle1 ?? 0;
            this.stroke_style = data._strokeStyle ?? 0;
            parseEdges(data._edges, this.commands, this.values);
        }
    }
}

class TextAttributes {
    readonly alignment = new Vec2();// alignment = "left"; / center / right
    alias_text = false;
    readonly color = new Color4(0, 0, 0, 1);
    face: undefined | string = undefined; // face="Font 1*"
    line_height = 20; // 20
    line_spacing = 0; // "-14";
    size = 32;// = "32";
    bitmap_size = 640; // just twips size
    parse(data: DOMTextAttributes) {
        readAlignment(this.alignment, data._alignment);
        this.alias_text = data._aliasText ?? false;
        this.size = data._size ?? 12;
        this.line_height = data._lineHeight ?? this.size;
        this.line_spacing = data._lineSpacing ?? 0;
        this.bitmap_size = data._bitmapSize ?? (this.size * 20);
        this.face = data._face;
        readColor(this.color, data, "_fillColor");
    }
}

class TextRun {
    characters = "";
    attributes = new TextAttributes();

    parse(data: DOMTextRun) {
        this.characters = he.decode(String(data.characters ?? ""));
        this.attributes.parse(oneOrMany(data.textAttrs?.DOMTextAttrs)[0]);
    }
}

class MotionObject {
    duration: number = 1;
    timeScale: number = 1;
}

class SolidStroke {
    readonly fill = new Color4();
    scaleMode = ScaleMode.none;
    solidStyle = SolidStyleType.hairline;
    weight = 1.0;
    caps = LineCaps.round;
    joints = LineJoints.round;
    miterLimit = 0.0;
    pixelHinting = false;

    parse(data: DOMSolidStroke) {
        this.weight = data._weight ?? 1;
        if (data.fill) {
            readColor(this.fill, data.fill.SolidColor);
        }
        this.miterLimit = data._miterLimit ?? 3;
        this.pixelHinting = data._pixelHinting ?? false;
        this.scaleMode = data._scaleMode ?? ScaleMode.normal;
        this.caps = data._caps ?? LineCaps.round;
        this.joints = data._joints ?? LineJoints.round;
        this.solidStyle = data._solidStyle ?? SolidStyleType.hairline;
    }
}

class GradientEntry {
    color = new Color4();
    ratio = 0.0;

    parse(data: DOMGradientEntry) {
        readColor(this.color, data);
        this.ratio = data._ratio ?? 0;
    }
}

export class FillStyle {
    index = 0;
    type = FillType.unknown;
    spreadMethod = SpreadMethod.extend;
    entries: GradientEntry[] = [];
    readonly matrix = new Matrix2D();

    parse(data: DOMFillStyle) {
        // TODO:
        this.index = data._index;
        for (const fillData of oneOrMany(data.SolidColor)) {
            this.type = FillType.solid;
            const entry = new GradientEntry();
            entry.parse(fillData);
            this.entries.push(entry);
        }

        for (const fillData of oneOrMany(data.LinearGradient)) {
            this.type = FillType.linear;
            this.spreadMethod = fillData._spreadMethod ?? SpreadMethod.extend;
            parseMatrix2D(this.matrix, fillData);
            for (const entryData of oneOrMany(fillData.GradientEntry)) {
                const entry = new GradientEntry();
                entry.parse(entryData);
                this.entries.push(entry);
            }
        }

        for (const fillData of oneOrMany(data.RadialGradient)) {
            this.type = FillType.radial;
            this.spreadMethod = fillData._spreadMethod ?? SpreadMethod.extend;
            parseMatrix2D(this.matrix, fillData);
            for (const entryData of oneOrMany(fillData.GradientEntry)) {
                const entry = new GradientEntry();
                entry.parse(entryData);
                this.entries.push(entry);
            }
        }
    }
}

export class StrokeStyle {
    index = 0;
    solid = new SolidStroke();
    isSolid = false;

    parse(data: DOMStrokeStyle) {
        this.index = data._index;
        const solidData = data.SolidStroke;
        if (solidData !== undefined) {
            this.solid.parse(solidData);
        }
        this.isSolid = solidData !== undefined;
    }
}

/**** elements tree ****/

class TweenObject {
    target = TweenTarget.all;
    intensity = 0; // <Ease intensity="-100...100" />
    custom_ease?: Vec2[];
}

export class Frame {
    index = 0;
    duration = 1;
    tweenType = TweenType.none;
    keyMode = 0;

    motionTweenSnap = false;
    motionTweenOrientToPath = false;
    motionTweenRotate = RotationDirection.none;
    motionTweenRotateTimes = 0;

    name?: string; // label
    acceleration = 0; // ease -100...100

    hasCustomEase = false;
    readonly tweens: TweenObject[] = [];

    readonly elements: Element[] = [];
    script?: string;
    motionObject?: MotionObject;

    parse(data: DOMFrame) {
        this.index = data._index;
        this.duration = data._duration ?? 1;
        this.tweenType = data._tweenType ?? TweenType.none;
        if (data._name) {
            this.name = he.decode(data._name);
        }

        this.motionTweenSnap = data._motionTweenSnap ?? false;
        this.motionTweenOrientToPath = data._motionTweenOrientToPath ?? false;

        this.motionTweenRotate = data._motionTweenRotate ?? RotationDirection.none;
        this.motionTweenRotateTimes = data._motionTweenRotateTimes ?? 0;

        this.hasCustomEase = data._hasCustomEase ?? false;

        this.keyMode = data._keyMode ?? 0;
        this.acceleration = data._acceleration ?? 0;

        for (const tag in data.elements) {
            // if (data.elements.hasOwnProperty(tag)) {
            const ttag = tag as ElementType;
            for (const elData of oneOrMany(data.elements[ttag])) {
                const el = new Element();
                el.parse(ttag, elData);
                this.elements.push(el);
            }
            // }
        }

        if (data.tweens !== undefined) {
            for (const tweenData of oneOrMany(data.tweens.Ease)) {
                const tweenObject = new TweenObject();
                tweenObject.target = tweenData._target ?? TweenTarget.all;
                tweenObject.intensity = tweenData._intensity ?? 0;
                this.tweens.push(tweenObject);
            }

            for (const tweenData of oneOrMany(data.tweens.CustomEase)) {
                const tweenObject = new TweenObject();
                tweenObject.target = tweenData._target ?? TweenTarget.all;
                tweenObject.custom_ease = [];
                for (const p of oneOrMany(tweenData.Point)) {
                    const v = new Vec2();
                    readPoint(v, p);
                    tweenObject.custom_ease.push(v);
                }
                this.tweens.push(tweenObject);
            }
        }
    }
}

class Layer {
    name?: string;
    layerType = LayerType.normal;
    color: Color32_ARGB = 0xFFFFFF;

    // autoNamed = false;
    // current = false;
    // isSelected = false;
    // locked = false;

    readonly frames: Frame[] = [];

    getDuration() {
        let total = 0;
        for (const frame of this.frames) {
            total += frame.duration;
        }
        return total;
    }

    parse(data: DOMLayer) {
        this.name = he.decode(data._name);
        this.color = parseColorCSS(data._color);
        if (data._layerType) {
            this.layerType = data._layerType as LayerType;
        }

        if (data.frames !== undefined) {
            for (const frameData of oneOrMany(data.frames.DOMFrame)) {
                const frame = new Frame();
                frame.parse(frameData);
                this.frames.push(frame);
            }
        }
    }
}


export class Timeline {
    name?: string;
    layers: Layer[] = [];

    getTotalFrames() {
        let res = 1;
        for (const layer of this.layers) {
            res = Math.max(layer.getDuration(), res);
        }
        return res;
    }

    parse(data: DOMTimeline) {
        this.name = he.decode(data._name);
        for (const layerData of oneOrMany(data.layers?.DOMLayer)) {
            const layer = new Layer();
            layer.parse(layerData);
            this.layers.push(layer);
        }
    }
}

class ItemProperties {
    name: string = "";
    itemID?: string;

    lastModified?: number;
    sourceLastImported?: number;
    sourceExternalFilepath?: string;

    linkageClassName?: string; //="Font1"
    linkageBaseClass?: string; //="flash.text.Font"
    linkageExportForAS = false;

    parse(data: any) {
        if (data._name) {
            this.name = he.decode(data._name);
        }
        if (data._itemID) {
            this.itemID = data._itemID;
        }
        if (data._sourceLastImported) {
            this.sourceLastImported = data._sourceLastImported;
        }
        if (data._sourceExternalFilepath) {
            this.sourceExternalFilepath = data._sourceExternalFilepath;
        }
        if (data._linkageClassName) {
            this.linkageClassName = data._linkageClassName;
        }
        if (data._linkageExportForAS) {
            this.linkageExportForAS = data._linkageExportForAS;
        }
        if (data._linkageBaseClass) {
            this.linkageBaseClass = data._linkageBaseClass;
        }
        if (data._lastModified) {
            this.lastModified = data._lastModified;
        }
    }
}

export class Element {
    readonly item = new ItemProperties();

    elementType = ElementType.unknown;

    /** Transform point (Free Transform Tool) for current element, in LOCAL SPACE (do not applicate matrix) **/
    readonly transformationPoint = new Vec2();
    readonly matrix = new Matrix2D();
    readonly colorMultiplier = new Color4(1, 1, 1, 1);
    readonly colorOffset = new Color4(0, 0, 0, 0);
    readonly rect = new Rect();

    /// SYMBOL ITEM
    readonly timeline = new Timeline();

    readonly scaleGrid = new Rect(); //scaleGridLeft="-2" scaleGridRight="2" scaleGridTop="-2" scaleGridBottom="2"

/// ref to item
    libraryItemName: undefined | string = undefined;

////// group
    readonly members: Element[] = [];

///// SHAPE
    readonly edges: Edge[] = [];
    readonly fills: FillStyle[] = [];
    readonly strokes: StrokeStyle[] = [];
    isDrawingObject = false;

    ///// Symbol instance
    symbolType = SymbolType.normal;
    centerPoint3DX?: number;
    centerPoint3DY?: number;
    cacheAsBitmap = false;
    exportAsBitmap = false;
    loop?: string;

    silent = false;
    forceSimple = false;
    isVisible = true;

    //// text
    isSelectable = true;
    textRuns: TextRun[] = [];
    filters: Filter[] = [];

    // dynamic text
    border = false;
    fontRenderingMode?: string;
    autoExpand = false;
    lineType?: string; // lineType="multiline no wrap"

    blendMode = BlendMode.last;

    // bitmap item
    bitmapDataHRef: undefined | string = undefined;
    //public var frameBottom:Int;
    //public var frameRight:Int;

    href = "";
    isJPEG = false;
    quality = 100;


    bitmap: undefined | Bitmap = undefined;

    /// FONT ITEM
    font: undefined | string = undefined;
    size = 0;
    id = 0;
    // embedRanges="1|2|3|4|5"

    // SOUND ITEM
    // sourcePlatform="macintosh"
    // externalFileSize="18807"
    // href="media_test/next_level.mp3"
    // soundDataHRef="M 23 1553173508.dat"
    // format="44kHz 16bit Stereo"
    // sampleCount="51840"
    // exportFormat="1"
    // exportBits="7"
    // dataLength="18807"
    // exportNative="true"
    // cacheFormat="5kHz 8bit Stereo"
    // cachedSampleCount="6480"

    parse(tag: ElementType, data: any) {
        this.item.parse(data);
        this.elementType = tag;

        readRect(this.rect, data);

        //// shape
        if (data._isDrawingObject != null) {
            this.isDrawingObject = data._isDrawingObject;
        }

        if (data.fills) {
            for (const fillData of oneOrMany(data.fills.FillStyle)) {
                const fill = new FillStyle();
                fill.parse(fillData);
                this.fills.push(fill);
            }
        }
        if (data.strokes) {
            for (const strokeData of oneOrMany(data.strokes.StrokeStyle)) {
                const stroke = new StrokeStyle();
                stroke.parse(strokeData as DOMStrokeStyle);
                this.strokes.push(stroke);
            }
        }
        if (data.edges) {
            for (const edgeData of oneOrMany(data.edges.Edge)) {
                if (edgeData._edges != null) {
                    const edge = new Edge();
                    edge.parse(edgeData);
                    this.edges.push(edge);
                }
            }
        }

        /// instances ref
        if (data._libraryItemName != null) {
            this.libraryItemName = he.decode(data._libraryItemName);
        }

        /////   SymbolInstance
        if (data._symbolType != null) {
            this.symbolType = data._symbolType;
        }

        if (data._centerPoint3DX != null) {
            this.centerPoint3DX = data._centerPoint3DX;
        }

        if (data._centerPoint3DY != null) {
            this.centerPoint3DY = data._centerPoint3DY;
        }

        if (data._cacheAsBitmap != null) {
            this.cacheAsBitmap = data._cacheAsBitmap;
        }

        if (data._exportAsBitmap != null) {
            this.exportAsBitmap = data._exportAsBitmap;
        }

        if (data._hasAccessibleData) {
            if (data._forceSimple != null) {
                this.forceSimple = data._forceSimple;
            }
            if (data._silent != null) {
                this.silent = data._silent;
            }
        }

        if (data._isVisible != null) {
            this.isVisible = data._isVisible;
        }

        /// text

        if (data._isSelectable != null) {
            this.isSelectable = data._isSelectable;
        }

        /// dynamic text

        if (data._border != null) {
            this.border = data._border;
        }
        if (data._fontRenderingMode != null) {
            this.fontRenderingMode = data._fontRenderingMode;
        }
        if (data._autoExpand != null) {
            this.autoExpand = data._autoExpand;
        }
        if (data._lineType != null) {
            this.lineType = data._lineType;
        }
        readTransformationPoint(this.transformationPoint, data);
        parseColorTransform(this.colorMultiplier, this.colorOffset, data);
        parseMatrix2D(this.matrix, data);

        //// group
        if (data.members) {
            for (const tag in data.members) {
                for (const elData of oneOrMany(data.members[tag])) {
                    const el = new Element();
                    el.parse(tag as ElementType, elData);
                    this.members.push(el);
                }
            }
        }

        if (data.textRuns) {
            for (const textRunData of oneOrMany(data.textRuns.DOMTextRun)) {
                const textRun = new TextRun();
                textRun.parse(textRunData as DOMTextRun);
                this.textRuns.push(textRun);
            }
        }

        if (data.filters) {
            for (const tag in data.filters) {
                for (const filterData of oneOrMany(data.filters[tag])) {
                    const filter = new Filter();
                    filter.parse(tag as DOMFilterKind, filterData as DOMAnyFilter);
                    this.filters.push(filter);
                }
            }
        }

        //// symbol item
        if (data._blendMode != null) {
            this.blendMode = data._blendMode;
        }
        readScaleGrid(this.scaleGrid, data);
        if (data.timeline !== undefined) {
            this.timeline.parse(data.timeline.DOMTimeline);
        }

        // bitmap item
        if (data._quality != null) {
            this.quality = data._quality;
        }
        if (data._href != null) {
            this.href = he.decode(data._href);
        }
        if (data._bitmapDataHRef != null) {
            this.bitmapDataHRef = he.decode(data._bitmapDataHRef);
        }
        if (data._isJPEG != null) {
            this.isJPEG = data._isJPEG;
        }

        // font item

        if (data._font != null) {
            this.font = data._font;
        }

        if (data._size != null) {
            this.size = data._size;
        }

        if (data._id != null) {
            this.id = data._id;
        }

        // sound item
        ////  todo:
    }
}