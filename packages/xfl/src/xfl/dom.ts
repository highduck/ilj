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
    shape_oval = 'ShapeOval', // todo:

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
    radial = 'RadialGradient'
}

export const enum LayerType {
    normal = 'normal',
    guide = 'guide',
    Folder = 'folder',
    Camera = 'camera'
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

export interface DOMFolderItem {
    _name: string,
    _itemID: string,
    _isExpanded?: boolean
}

export interface DOMFontItem {
    _name: string,
    _itemID: string,
    _linkageExportForAS: boolean,
    _linkageBaseClass: string, // "flash.text.Font"
    _linkageClassName: string, // Font1
    _font: string, //"mini",
    _size: number, // 0
    _id: number, // 1
    _sourceLastImported: number, //1553239021,
    _embedRanges: string //"1|2|3|4|5"
}

export interface DOMBitmapItem {
    _name: string,//"flump/puppet parts/calf copy",
    _itemID: string,
    _sourceExternalFilepath: string, //"./LIBRARY/flump/puppet parts/calf copy",
    _sourceLastImported: number,
    _sourcePlatform: string,
    _originalCompressionType: string,// TODO: enum? "lossless",
    _quality: number, //90,
    _href: string,// "flump/puppet parts/calf copy",
    _bitmapDataHRef: string,//"M 10 1552682487.dat",
    _frameRight: number, //1300,
    _frameBottom: number, //1780
}

interface DOMSoundItem {
    _name: "media_test/next_level.mp3",
    _itemID: "5c938c07-0000034a",
    _sourceExternalFilepath: "./LIBRARY/media_test/next_level.mp3",
    _sourceLastImported: 1536049774,
    _sourcePlatform: "macintosh",
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
    _spreadMethod?: SpreadMethod,
    GradientEntry?: DOMGradientEntry | DOMGradientEntry[]
}

export interface DOMFillStyle {
    _index: number,
    SolidColor?: DOMGradientEntry, // actually only color / alpha
    LinearGradient?: DOMGradientStyle,
    RadialGradient?: DOMGradientStyle
}

export interface DOMShape {
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

export interface DOMElementAny {
    unknown?: never,
    ShapeOval?: never,
    DOMShape?: any,
    DOMGroup?: any,
    DOMDynamicText?: any,
    DOMStaticText?: any,
    DOMSymbolInstance?: any,
    DOMBitmapInstance?: any,
    DOMSymbolItem?: any,
    DOMBitmapItem?: any,
    DOMFontItem?: any,
    DOMSoundItem?: any
}

export interface DOMFrame {
    _name: string,
    _index: number,//0,
    _duration: number, // 1
    _tweenType: TweenType,
    _keyMode: number,//9728,
    _acceleration?: number,
    _hasCustomEase?: boolean,
    _motionTweenRotateTimes?: number, // 0
    _motionTweenRotate?: RotationDirection,
    _motionTweenSnap?: boolean,
    _motionTweenOrientToPath?: boolean,

    _parentLayerIndex?:number, // ?? todo:

    elements: DOMElementAny,

    tweens?: {
        Ease?: DOMEase | DOMEase[],
        CustomEase?: DOMCustomEase | DOMCustomEase[]
    }
}

export interface DOMLayer {
    _name: string,
    _layerType?: LayerType,
    _attachedToCamera?:boolean, // default: false (means layer actually affected by camera)
    _parentLayerIndex?:number, // ?? todo:
    _layerRiggingIndex?:number, // ?? layers hierarchy, also propagated into the DOMFrame
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

export interface DOMSymbolItem {
    _name: string, //"test_button/001.ai Assets/&amp;#060Path&amp;#062_6",
    _itemID: string,
    _lastModified: number,

    // TODO: base type
    _scaleGridLeft?: number,
    _scaleGridTop?: number,
    _scaleGridRight?: number,
    _scaleGridBottom?: number,

    timeline: {
        DOMTimeline: DOMTimeline
    },
}


export interface DOMDocument {
    _currentTimeline: number,
    _xflVersion: number,
    _creatorInfo: string,
    _platform: string,
    _versionInfo: string,
    _majorVersion: number,
    _minorVersion: number,
    _buildNumber: number,
    _nextSceneIdentifier: number,
    _playOptionsPlayLoop: boolean,
    _playOptionsPlayPages: boolean,
    _playOptionsPlayFrameActions: boolean,
    _filetypeGUID: string,
    _fileGUID: string,

    folders?: {
        DOMFolderItem?: DOMFolderItem | DOMFolderItem[]
    },

    fonts?: {
        DOMFontItem?: DOMFontItem | DOMFontItem[]
    },

    media?: {
        DOMBitmapItem?: DOMBitmapItem | DOMBitmapItem[],
        DOMSoundItem?: DOMSoundItem | DOMSoundItem[]
    },

    symbols?: {
        Include?: Include | Include[]
    },

    scripts?: string,
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

export interface FDOMTransformationPoint {
    Point?: FDOMPoint
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
    fill?: { SolidColor: { _color: string, _alpha: number } };
    _miterLimit?: number;
    _pixelHinting?: boolean;
    _scaleMode?: ScaleMode;
    _caps?: LineCaps;
    _joints?: LineJoints;
    _solidStyle?: SolidStyleType;
}

export interface DOMStrokeStyle {
    _index: number,
    SolidStroke?: DOMSolidStroke;
}

export interface DOMMatrix2DHolder {
    matrix?: {
        Matrix?: FDOMMatrix2D
    }
}

// TODO:
export interface DOMOvalObject extends DOMMatrix2DHolder {
    _objectWidth?: number; // 58
    _objectHeight?: number; // 58
    _x?: number;
    _y?: number;
    endAngle?: number; // 0
    fill?: DOMFillStyle;
}