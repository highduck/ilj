import {Color32_ARGB, Color4, Matrix2D, Rect, Vec2} from "@highduck/math";
import {ColorTransform} from "./ColorTransform";
import {
    BlendMode,
    DOMAnyFilter,
    DOMEdges,
    DOMFilterKind,
    DOMFrame,
    DOMGradientEntry,
    DOMLayer,
    DOMMatrix2DHolder,
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
        this.blur.x = data.$blurX ?? 4;
        this.blur.y = data.$blurY ?? 4;
        this.distance = data.$distance ?? 4;
        this.angle = data.$angle ?? 45;
        this.quality = data.$quality ?? 1;
        this.strength = data.$strength ?? 100.0;
        this.inner = data.$inner ?? false;
        this.knockout = data.$knockout ?? false;
        this.hideObject = data.$hideObject ?? false;
    }
}

class Edge {
    readonly commands: number[] = [];
    readonly values: number[] = [];
    fill_style_0 = 0;
    fill_style_1 = 0;
    stroke_style = 0;

    parse(data: DOMEdges) {
        this.fill_style_0 = data.$fillStyle0 ?? 0;
        this.fill_style_1 = data.$fillStyle1 ?? 0;
        this.stroke_style = data.$strokeStyle ?? 0;
        parseEdges(data.$edges, this.commands, this.values);
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
        readAlignment(this.alignment, data.$alignment);
        this.alias_text = data.$aliasText ?? false;
        this.size = data.$size ?? 12;
        this.line_height = data.$lineHeight ?? this.size;
        this.line_spacing = data.$lineSpacing ?? 0;
        this.bitmap_size = data.$bitmapSize ?? (this.size * 20);
        this.face = data.$face;
        readColor(this.color, data, "$fillColor");
    }
}

class TextRun {
    characters = "";
    attributes = new TextAttributes();

    parse(data: DOMTextRun) {
        this.characters = he.decode(data.characters);
        this.attributes.parse(oneOrMany(data.textAttrs)[0]);
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
        this.weight = data.$weight ?? 1;
        if (data.fill) {
            readColor(this.fill, data.fill.SolidColor);
        }
        this.miterLimit = data.$miterLimit ?? 3;
        this.pixelHinting = data.$pixelHinting ?? false;
        this.scaleMode = data.$scaleMode ?? ScaleMode.normal;
        this.caps = data.$caps ?? LineCaps.round;
        this.joints = data.$joints ?? LineJoints.round;
        this.solidStyle = data.$solidStyle ?? SolidStyleType.hairline;
    }
}

class GradientEntry {
    color = new Color4();
    ratio = 0.0;

    parse(data: DOMGradientEntry) {
        readColor(this.color, data);
        this.ratio = data.$ratio ?? 0;
    }
}

export class FillStyle {
    index = 0;
    type = FillType.unknown;
    spreadMethod = SpreadMethod.extend;
    entries: GradientEntry[] = [];
    readonly matrix = new Matrix2D();

    parse(data: { $index: number; SolidColor?: { $color: string }; LinearGradient?: any, RadialGradient?: any }) {
        // TODO:
        this.index = data.$index;
        for (const fillData of oneOrMany(data.SolidColor)) {
            this.type = FillType.solid;
            const entry = new GradientEntry();
            entry.parse(fillData);
            this.entries.push(entry);
        }

        for (const fillData of oneOrMany(data.LinearGradient)) {
            this.type = FillType.linear;
            this.spreadMethod = fillData.$spreadMethod ?? SpreadMethod.extend;
            parseMatrix2D(this.matrix, fillData as DOMMatrix2DHolder);
            for (const entryData of oneOrMany(fillData.GradientEntry)) {
                const entry = new GradientEntry();
                entry.parse(entryData as DOMGradientEntry);
                this.entries.push(entry);
            }
        }

        for (const fillData of oneOrMany(data.RadialGradient)) {
            this.type = FillType.radial;
            this.spreadMethod = fillData.$spreadMethod ?? SpreadMethod.extend;
            parseMatrix2D(this.matrix, fillData as DOMMatrix2DHolder);
            for (const entryData of oneOrMany(fillData.GradientEntry)) {
                const entry = new GradientEntry();
                entry.parse(entryData as DOMGradientEntry);
                this.entries.push(entry);
            }
        }
        // for (const tag of data) {
        //     r.type << el.name();
        //     switch (r.type) {
        //         case fill_type::solid:
        //             r.entries.push_back(parse_xml_node<gradient_entry>(el));
        //             break;
        //         case fill_type::linear:
        //             case fill_type::radial:
        //             r.spreadMethod << el.attribute("spreadMethod").value();
        //             r.matrix << el;
        //             for (const auto& e: el.children("GradientEntry")) {
        //             r.entries.push_back(parse_xml_node<gradient_entry>(e));
        //         }
        //             break;
        //         default:
        //             break;
        //     }
        // }
    }
}

export class StrokeStyle {
    index = 0;
    solid = new SolidStroke();
    is_solid = false;

    parse(data: DOMStrokeStyle) {
        this.index = data.$index;
        const solidData = data.SolidStroke;
        if (solidData !== undefined) {
            this.solid.parse(solidData);
        }
        this.is_solid = solidData !== undefined;
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
        this.index = data.$index;
        this.duration = data.$duration ?? 1;
        this.tweenType = data.$tweenType ?? TweenType.none;
        if (data.$name) {
            this.name = he.decode(data.$name);
        }

        this.motionTweenSnap = data.$motionTweenSnap ?? false;
        this.motionTweenOrientToPath = data.$motionTweenOrientToPath ?? false;

        this.motionTweenRotate = data.$motionTweenRotate ?? RotationDirection.none;
        this.motionTweenRotateTimes = data.$motionTweenRotateTimes ?? 0;

        this.hasCustomEase = data.$hasCustomEase ?? false;

        this.keyMode = data.$keyMode ?? 0;
        this.acceleration = data.$acceleration ?? 0;

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
                tweenObject.target = tweenData.$target ?? TweenTarget.all;
                tweenObject.intensity = tweenData.$intensity ?? 0;
                this.tweens.push(tweenObject);
            }

            for (const tweenData of oneOrMany(data.tweens.CustomEase)) {
                const tweenObject = new TweenObject();
                tweenObject.target = tweenData.$target ?? TweenTarget.all;
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
        this.name = he.decode(data.$name);
        this.color = parseColorCSS(data.$color);
        if (data.$layerType) {
            this.layerType = data.$layerType as LayerType;
        }

        for (const frameData of oneOrMany(data.frames.DOMFrame)) {
            const frame = new Frame();
            frame.parse(frameData);
            this.frames.push(frame);
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
        this.name = he.decode(data.$name);
        for (const layerData of oneOrMany(data.layers.DOMLayer)) {
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
        if (data.$name) {
            this.name = he.decode(data.$name);
        }
        if (data.$itemID) {
            this.itemID = data.$itemID;
        }
        if (data.$sourceLastImported) {
            this.sourceLastImported = data.$sourceLastImported;
        }
        if (data.$sourceExternalFilepath) {
            this.sourceExternalFilepath = data.$sourceExternalFilepath;
        }
        if (data.$linkageClassName) {
            this.linkageClassName = data.$linkageClassName;
        }
        if (data.$linkageExportForAS) {
            this.linkageExportForAS = data.$linkageExportForAS;
        }
        if (data.$linkageBaseClass) {
            this.linkageBaseClass = data.$linkageBaseClass;
        }
        if (data.$lastModified) {
            this.lastModified = data.$lastModified;
        }
    }
}

export class Element {
    readonly item = new ItemProperties();

    elementType = ElementType.unknown;

    /** Transform point (Free Transform Tool) for current element, in LOCAL SPACE (do not applicate matrix) **/
    readonly transformationPoint = new Vec2();
    readonly matrix = new Matrix2D();
    readonly color = new ColorTransform();
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

    blend_mode = BlendMode.last;

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
        //console.warn("parse " + tag);
        this.item.parse(data);
        this.elementType = tag;

        readRect(this.rect, data);

        //// shape
        if (data.$isDrawingObject != null) {
            this.isDrawingObject = data.$isDrawingObject;
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
                if (edgeData.$edges != null) {
                    const edge = new Edge();
                    edge.parse(edgeData);
                    this.edges.push(edge);
                }
            }
        }

        /// instances ref
        if (data.$libraryItemName != null) {
            this.libraryItemName = he.decode(data.$libraryItemName);
        }

        /////   SymbolInstance
        if (data.$symbolType != null) {
            this.symbolType = data.$symbolType;
        }

        if (data.$centerPoint3DX != null) {
            this.centerPoint3DX = data.$centerPoint3DX;
        }

        if (data.$centerPoint3DY != null) {
            this.centerPoint3DY = data.$centerPoint3DY;
        }

        if (data.$cacheAsBitmap != null) {
            this.cacheAsBitmap = data.$cacheAsBitmap;
        }

        if (data.$exportAsBitmap != null) {
            this.exportAsBitmap = data.$exportAsBitmap;
        }

        if (data.$hasAccessibleData) {
            if (data.$forceSimple != null) {
                this.forceSimple = data.$forceSimple;
            }
            if (data.$silent != null) {
                this.silent = data.$silent;
            }
        }

        if (data.$isVisible != null) {
            this.isVisible = data.$isVisible;
        }

        /// text

        if (data.$isSelectable != null) {
            this.isSelectable = data.$isSelectable;
        }

        /// dynamic text

        if (data.$border != null) {
            this.border = data.$border;
        }
        if (data.$fontRenderingMode != null) {
            this.fontRenderingMode = data.$fontRenderingMode;
        }
        if (data.$autoExpand != null) {
            this.autoExpand = data.$autoExpand;
        }
        if (data.$lineType != null) {
            this.lineType = data.$lineType;
        }
        readTransformationPoint(this.transformationPoint, data);
        parseColorTransform(this.color, data);
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
        if (data.$blendMode != null) {
            this.blend_mode = data.$blendMode;
        }
        readScaleGrid(this.scaleGrid, data);
        if (data.timeline !== undefined) {
            this.timeline.parse(data.timeline.DOMTimeline);
        }

        // bitmap item
        if (data.$quality != null) {
            this.quality = data.$quality;
        }
        if (data.$href != null) {
            this.href = he.decode(data.$href);
        }
        if (data.$bitmapDataHRef != null) {
            this.bitmapDataHRef = he.decode(data.$bitmapDataHRef);
        }
        if (data.$isJPEG != null) {
            this.isJPEG = data.$isJPEG;
        }

        // font item

        if (data.$font != null) {
            this.font = data.$font;
        }

        if (data.$size != null) {
            this.size = data.$size;
        }

        if (data.$id != null) {
            this.id = data.$id;
        }

        // sound item
        ////  todo:


    }
}