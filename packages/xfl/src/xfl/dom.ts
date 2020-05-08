// Graphic Symbol loop mode
export const enum LoopMode {
    Loop = 'loop',
    PlayOnce = 'play once',
    SingleFrame = 'single frame',
}

export const enum SpreadMethod {
    extend = 'extend',
    reflect = 'reflect',
    repeat = 'repeat'
}

export const enum BlendMode {
    last = 'last', // default
    normal = 'normal', // default
    layer = 'layer',
    multiply = 'multiply',
    screen = 'screen',
    lighten = 'lighten',
    darken = 'darken',
    difference = 'difference',
    add = 'add',
    subtract = 'subtract',
    invert = 'invert',
    alpha = 'alpha',
    erase = 'erase',
    overlay = 'overlay',
    hardlight = 'hardlight'
}

export const enum ElementType {
    unknown = 'unknown',
    shape = 'DOMShape',
    OvalObject = 'DOMOvalObject',
    RectangleObject = 'DOMRectangleObject',

    group = 'DOMGroup',
    dynamic_text = 'DOMDynamicText',
    static_text = 'DOMStaticText',
    symbol_instance = 'DOMSymbolInstance',
    bitmap_instance = 'DOMBitmapInstance',
    symbol_item = 'DOMSymbolItem',
    bitmap_item = 'DOMBitmapItem',
    font_item = 'DOMFontItem',
    sound_item = 'DOMSoundItem'
}

export const enum SymbolType {
    normal = 'normal',
    button = 'button',
    graphic = 'graphic'
}

export const enum DOMFilterKind {
    none = 'none',
    drop_shadow = 'DropShadowFilter',
    glow = 'GlowFilter',
    gradient_glow = 'GradientGlowFilter',
    blur = 'BlurFilter',
    bevel = 'BevelFilter',
    gradient_bevel = 'GradientBevelFilter',
    convolution = 'ConvolutionFilter',
    adjust_color = 'AdjustColorFilter'
}

export interface DOMAnyFilter {
    _blurX?: number;
    _blurY?: number;
    _distance?: number;
    _angle?: number;
    _quality?: number;
    _strength?: number;
    _inner?: boolean;
    _knockout?: boolean;
    _hideObject?: boolean;
}

export const enum ScaleMode {
    none = 'none',
    normal = 'normal',
    horizontal = 'horizontal',
    vertical = 'vertical'
}

export const enum SolidStyleType {
    hairline = 'hairline'
}

export const enum LineCaps {
    none = 'none',
    round = 'round', // default
    square = 'square'
}

export const enum LineJoints {
    miter = 'miter',
    round = 'round', // default
    bevel = 'bevel'
}

export const enum FillType {
    unknown = 'unknown',
    solid = 'SolidColor',
    linear = 'LinearGradient',
    radial = 'RadialGradient',
    Bitmap = 'BitmapFill'
}

export const enum LayerType {
    normal = 'normal',
    guide = 'guide',
    Folder = 'folder',
    Camera = 'camera',
    Mask = 'mask'
}

export const enum TweenType {
    none = 'none',
    motion = 'motion'
}

export const enum RotationDirection {
    none = 'none',
    ccw = 'counter-clockwise',
    cw = 'clockwise'
}

export interface ItemObject {
    _name: string;
    _itemID: string;

    // these attributes are common
    _linkageExportForAS?: boolean; // def: false
    _linkageBaseClass?: string, // "flash.text.Font"
    _linkageClassName?: string;

    // "./LIBRARY/media_test/next_level.mp3"
    // "./LIBRARY/flump/puppet parts/calf copy"
    _sourceExternalFilepath?: string;
    _sourcePlatform?: string; //"macintosh"
    _sourceFlashFilepath?: string; // "../../parrot/parrot.xfl"
    _sourceLibraryItemHRef?: string; // "parrot"
    _sourceLastImported?: number; // 1536049774
    _sourceLastModified?: number; // 1588510883
    _sourceAutoUpdate?: boolean; // def: false
    _lastModified?: number; // 1588760993
    _sourceItemID?: string; // "5eaeba42-0000014e"

    // scaling grid
    _scaleGridLeft?: number;
    _scaleGridTop?: number;
    _scaleGridRight?: number;
    _scaleGridBottom?: number;

    timeline?: {
        DOMTimeline?: DOMTimeline
    };
}

export interface ElementObject {

}

// Element Object everything appears on the stage
// Item Object for the Library


export interface DOMFolderItem extends ItemObject {
    _isExpanded?: boolean;
}

export interface DOMFontItem extends ItemObject {
    _font: string, //"mini",
    _size: number, // 0
    _id: number, // 1
    _embedRanges: string //"1|2|3|4|5"
}

export interface DOMBitmapItem extends ItemObject {
    _originalCompressionType: string; // TODO: enum? "lossless",
    _quality: number; //90,
    _href: string; // "flump/puppet parts/calf copy",
    _bitmapDataHRef: string; //"M 10 1552682487.dat",
    _frameRight: number; //1300,
    _frameBottom: number; //1780
}

interface DOMSoundItem extends ItemObject {
    _externalFileCRC32: 4118010386,
    _externalFileSize: 18807,
    _href: "media_test/next_level.mp3",
    _soundDataHRef: "M 23 1553173508.dat",
    _format: "44kHz 16bit Stereo",
    _sampleCount: 51840,
    _exportFormat: 1,
    _exportBits: 7,
    _dataLength: 18807,
    _exportNative: true,
    _cacheFormat: "5kHz 8bit Stereo",
    _cachedSampleCount: 6480
}

export interface Include {
    _href: string,//"bella/dance_01.xml",
    _itemIcon?: number,
    _loadImmediate?: boolean,
    _itemID: string,
    _lastModified: string,
}

export interface DOMGradientEntry {
    _color?: string,
    _alpha?: number,
    _ratio?: number
}

export interface DOMGradientStyle extends DOMMatrix2DHolder {
    _spreadMethod?: SpreadMethod;
    // TODO: could be "linearRGB"
    _interpolationMethod?: string;
    GradientEntry?: DOMGradientEntry | DOMGradientEntry[];
}

export interface DOMBitmapFill extends DOMMatrix2DHolder {
    _bitmapPath: string; // "import/bmp0305/Layer 30 copy"
}

export interface DOMFillStyle {
    _index?: number,
    SolidColor?: DOMGradientEntry, // actually only color / alpha
    LinearGradient?: DOMGradientStyle,
    RadialGradient?: DOMGradientStyle,
    BitmapFill?: DOMBitmapFill
}

export interface DOMShape extends ElementObject {
    _selected: true,
    _isDrawingObject: true,
    fills?: {
        FillStyle?: DOMFillStyle | DOMFillStyle[]
    },
    edges?: {
        Edge?: DOMEdges | DOMEdges[]
    }
}

export const enum TweenTarget {
    all = 'all',
    position = 'position',
    rotation = 'rotation',
    scale = 'scale',
    color = 'color',
    filters = 'filters'
}

export interface DOMEase {
    _target?: TweenTarget, // all
    _intensity?: number // -100 .. 100
}

export interface DOMCustomEase {
    _target?: TweenTarget, // all
    Point: FDOMPoint | FDOMPoint[]
}

export interface DOMSymbolInstance extends ElementObject, DOMMatrix2DHolder, DOMTransformationPointHolder, DOMColorHolder {
    _isVisible?: boolean; // def: true
    _libraryItemName?: string;
    _symbolType?: SymbolType; // def: normal

    // graphic symbol options
    _loop?: LoopMode;
    _firstFrame?: number; // def: 0 (zero-based index, in IDE displays from 1st)

    // ignore
    _centerPoint3DX?: number; // def: 0
    _centerPoint3DY?: number; // def: 0
    _selected?: boolean; // def: false
}

export type DOMAnyElement = DOMShape | DOMSymbolInstance | DOMSymbolItem | DOMOvalObject | DOMRectangleObject | any;


export interface DOMElementObject {
    unknown?: never;

    DOMShape?: DOMShape;
    DOMGroup?: any;
    DOMDynamicText?: any;
    DOMStaticText?: any;
    DOMSymbolInstance?: DOMSymbolInstance;
    DOMBitmapInstance?: any;
    DOMSymbolItem?: DOMSymbolItem;
    DOMBitmapItem?: any;
    DOMFontItem?: any;
    DOMSoundItem?: any;

    DOMOvalObject?: DOMOvalObject;
    DOMRectangleObject?: DOMRectangleObject;
}

export interface ElementsArray {
    DOMShape?: DOMShape | DOMShape[];
    DOMGroup?: any | any[];
    DOMDynamicText?: any | any[];
    DOMStaticText?: any | any[];
    DOMSymbolInstance?: DOMSymbolInstance | DOMSymbolInstance[];
    DOMBitmapInstance?: any | any[];
    DOMOvalObject?: DOMOvalObject | DOMOvalObject[];
    DOMRectangleObject?: DOMRectangleObject | DOMRectangleObject[];
}

export interface DOMFrame {
    _name: string;
    _index: number;//0,
    _duration: number; // 1
    _tweenType: TweenType;
    _keyMode: number;//9728,
    _acceleration?: number;
    _hasCustomEase?: boolean;
    _motionTweenRotateTimes?: number; // 0
    _motionTweenRotate?: RotationDirection;
    _motionTweenSnap?: boolean;
    _motionTweenOrientToPath?: boolean;

    _parentLayerIndex?: number; // ?? todo:

    elements?: ElementsArray;

    tweens?: {
        Ease?: DOMEase | DOMEase[],
        CustomEase?: DOMCustomEase | DOMCustomEase[]
    };

    // sound properties
    _soundName?: string; // "import/bgm_children.mp3"
    _soundEffect?: string; // def: "none"
    // "custom" / "left channel" / "right channel"
    // "fade left to right" / "fade right to left" / "fade in" / "fade out"
    _soundSync?: string; // def: "event" / "start" / "stop" / "stream"
    _outPoint44?: number; // 2563200
    _soundZoomLevel?: number; // 2
    _soundLoopMode?: string; // def: "repeat" (other "loop")
    _soundLoop?: number; // def: 1
    SoundEnvelope?: SoundEnvelope;
}

export interface DOMLayer {
    _name: string,
    _layerType?: LayerType,
    _attachedToCamera?: boolean, // default: false (means layer actually affected by camera)
    _parentLayerIndex?: number, // ?? todo:
    _layerRiggingIndex?: number, // ?? layers hierarchy, also propagated into the DOMFrame
    frames?: {
        DOMFrame: DOMFrame | DOMFrame[]
    },
    _color: string, //"#4FFF4F",
    _highlighted: boolean, // false
    //_current: boolean,
    //_isSelected: boolean,
}

export interface DOMTimeline {
    _name: string,
    _cameraLayerEnabled?: boolean, // false
    _layerDepthEnabled?: boolean, // false
    layers?: {
        DOMLayer?: DOMLayer | DOMLayer[]
    }
}

export interface DOMSymbolItem extends ItemObject {
}


export interface DOMDocument {
    _xflVersion: number;
    _creatorInfo: string;
    _platform: string;
    _versionInfo: string;
    _majorVersion: number;
    _minorVersion: number;
    _buildNumber: number;
    _playOptionsPlayLoop: boolean;
    _playOptionsPlayPages: boolean;
    _playOptionsPlayFrameActions: boolean;
    _filetypeGUID: string;
    _fileGUID: string;

    _currentTimeline: number;
    _nextSceneIdentifier: number;

    _width?: number;
    _height?: number;
    _frameRate?: number; // default: 24?
    _backgroundColor?: string; // default: "#FFFFFF"

    // document scenes
    timelines?: {
        DOMTimeline?: DOMTimeline | DOMTimeline[]
    };

    folders?: {
        DOMFolderItem?: DOMFolderItem | DOMFolderItem[]
    };

    fonts?: {
        DOMFontItem?: DOMFontItem | DOMFontItem[]
    };

    media?: {
        DOMBitmapItem?: DOMBitmapItem | DOMBitmapItem[],
        DOMSoundItem?: DOMSoundItem | DOMSoundItem[]
    };

    symbols?: {
        Include?: Include | Include[]
    };

    scripts?: string;

    // todo:
    // <PD n="ikTreeCount" t="i" v="6"/>
    // <PD n="ikBoneCount" t="i" v="10"/>
    // <PD n="ikNodeCount" t="i" v="16"/>
    persistentData?: any;
}

export interface DOMScaleGrid {
    _scaleGridLeft?: number;
    _scaleGridTop?: number;
    _scaleGridRight?: number;
    _scaleGridBottom?: number;
}

export interface FDOMRect {
    _left?: number;
    _top?: number;
    _width?: number;
    _height?: number;
}

export interface FDOMPoint {
    _x?: number;
    _y?: number;
}

export interface DOMColorHolder {
    color?: {
        Color?: FDOMColor
    }
}

export interface FDOMMatrix2D {
    _a?: number;
    _b?: number;
    _c?: number;
    _d?: number;
    _tx?: number;
    _ty?: number;
}

export interface FDOMColor {
    _redMultiplier?: number;
    _greenMultiplier?: number;
    _blueMultiplier?: number;
    _alphaMultiplier?: number;

    _redOffset?: number;
    _greenOffset?: number;
    _blueOffset?: number;
    _alphaOffset?: number;

    _tintMultiplier?: number;
    _tintColor?: string;

    _brightness?: number; // default: 0, values: -1 ... 1
}

export interface DOMTextAttributes {
    _fillColor?: string,
    _alpha?: number,
    _alignment?: string,
    _aliasText?: boolean,
    _size?: number,
    _lineHeight?: number,
    _lineSpacing?: number,
    _bitmapSize?: number,
    _face?: string,
}

export interface DOMTextRun {
    characters?: string,
    textAttrs?: {
        DOMTextAttrs?: DOMTextAttributes | DOMTextAttributes[]
    }
}

export interface DOMEdges {
    _fillStyle0?: number,
    _fillStyle1?: number,
    _strokeStyle?: number,
    _edges?: string,
    _cubics?: string
}

export interface DOMSolidStroke {
    _weight?: number;
    _miterLimit?: number;
    _pixelHinting?: boolean;
    _scaleMode?: ScaleMode;
    _caps?: LineCaps;
    _joints?: LineJoints;
    _solidStyle?: SolidStyleType;

    fill?: DOMFillStyle;
}

export interface DOMStrokeStyle {
    _index: number,
    SolidStroke?: DOMSolidStroke;
}

export interface DOMMatrix2DHolder {
    matrix?: {
        Matrix?: FDOMMatrix2D
    };
}

export interface DOMTransformationPointHolder {
    transformationPoint?: {
        Point?: FDOMPoint
    };
}

export interface DOMOvalObject extends DOMMatrix2DHolder, DOMTransformationPointHolder {
    _objectWidth?: number; // 58
    _objectHeight?: number; // 58
    _x?: number;
    _y?: number;
    _endAngle?: number; // 0
    _startAngle?: number; // 0
    _innerRadius?: number; // 0
    _closePath?: boolean; // true
    fill?: DOMFillStyle;
    stroke?: DOMStrokeStyle;
}

export interface DOMRectangleObject extends DOMMatrix2DHolder, DOMTransformationPointHolder {
    _objectWidth?: number; // 58
    _objectHeight?: number; // 58
    _x?: number;
    _y?: number;
    _lockFlag?: boolean; // false
    _topLeftRadius?: number; // 0
    _topRightRadius?: number; // 0
    _bottomLeftRadius?: number; // 0
    _bottomRightRadius?: number; // 0
    fill?: DOMFillStyle;
    stroke?: DOMStrokeStyle;
}

interface SoundEnvelopePoint {
    _level0?: number; // 32768
    _level1?: number; // 32768
    _mark44?: number; //
}

export interface SoundEnvelope {
    SoundEnvelopePoint?: SoundEnvelopePoint | SoundEnvelopePoint[];
}

