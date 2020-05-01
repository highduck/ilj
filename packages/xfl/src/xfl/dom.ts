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
    $blurX?: number;
    $blurY?: number;
    $distance?: number;
    $angle?: number;
    $quality?: number;
    $strength?: number;
    $inner?: boolean;
    $knockout?: boolean;
    $hideObject?: boolean;
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
    guide = 'guide'
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
    $name: string,
    $itemID: string,
    $isExpanded?: boolean
}

export interface DOMFontItem {
    $name: string,
    $itemID: string,
    $linkageExportForAS: boolean,
    $linkageBaseClass: string, // "flash.text.Font"
    $linkageClassName: string, // Font1
    $font: string, //"mini",
    $size: number, // 0
    $id: number, // 1
    $sourceLastImported: number, //1553239021,
    $embedRanges: string //"1|2|3|4|5"
}

export interface DOMBitmapItem {
    $name: string,//"flump/puppet parts/calf copy",
    $itemID: string,
    $sourceExternalFilepath: string, //"./LIBRARY/flump/puppet parts/calf copy",
    $sourceLastImported: number,
    $sourcePlatform: string,
    $originalCompressionType: string,// TODO: enum? "lossless",
    $quality: number, //90,
    $href: string,// "flump/puppet parts/calf copy",
    $bitmapDataHRef: string,//"M 10 1552682487.dat",
    $frameRight: number, //1300,
    $frameBottom: number, //1780
}

interface DOMSoundItem {
    $name: "media_test/next_level.mp3",
    $itemID: "5c938c07-0000034a",
    $sourceExternalFilepath: "./LIBRARY/media_test/next_level.mp3",
    $sourceLastImported: 1536049774,
    $sourcePlatform: "macintosh",
    $externalFileCRC32: 4118010386,
    $externalFileSize: 18807,
    $href: "media_test/next_level.mp3",
    $soundDataHRef: "M 23 1553173508.dat",
    $format: "44kHz 16bit Stereo",
    $sampleCount: 51840,
    $exportFormat: 1,
    $exportBits: 7,
    $dataLength: 18807,
    $exportNative: true,
    $cacheFormat: "5kHz 8bit Stereo",
    $cachedSampleCount: 6480
}

export interface Include {
    $href: string,//"bella/dance_01.xml",
    $itemIcon?: number,
    $loadImmediate?: boolean,
    $itemID: string,
    $lastModified: string,
}

export interface DOMShape {
    "$selected": true,
    "$isDrawingObject": true,
    "fills": {
        "FillStyle": {
            "$index": 1,
            "SolidColor": {
                "$color": "#F8E28D"
            }
        }
    },
    "edges": {
        "Edge": [
            {
                "$fillStyle1": 1,
                "$edges": "!5315 180|140 180!140 180[105 183 70 173!70 173[0 154 0 90!0 90[0 26 70 7!70 7[105 -3 140 0!140 0|5315 0!5315 0|5385 12!5385 12[5455 34 5455 90!5455 90[5455 145 5385 168!5385 168|5315 180"
            },
            {
                "$cubics": "!5315 180(;5315,180 140,180 140,180q5315 180 140 180);"
            },
            {
                "$cubics": "!140 180(;140,180 0,192 0,90q140 180Q105 183q70 173Q0 154q0 90);"
            },
            {
                "$cubics": "!0 90(;0,-12 140,0 140,0q0 90Q0 26q70 7Q105 -3q140 0);"
            },
            {
                "$cubics": "!140 0(;140,0 5315,0 5315,0q140 0 5315 0);"
            },
            {
                "$cubics": "!5315 0(;5315,0 5455,1 5455,90q5315 0Q5315 0q5385 12Q5455 34q5455 90);"
            },
            {
                "$cubics": "!5455 90(;5455,178 5315,180 5315,180q5455 90Q5455 145q5385 168Q5315 180q5315 180);"
            }
        ]
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
    $target?: TweenTarget, // all
    $intensity?: number // -100 .. 100
}

export interface DOMCustomEase {
    $target?: TweenTarget, // all
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
    $name: string,
    $index: number,//0,
    $duration: number, // 1
    $tweenType: TweenType,
    $keyMode: number,//9728,
    $acceleration?: number,
    $hasCustomEase?: boolean,
    $motionTweenRotateTimes?: number, // 0
    $motionTweenRotate?: RotationDirection,
    $motionTweenSnap?: boolean,
    $motionTweenOrientToPath?: boolean,

    elements: DOMElementAny,

    tweens?: {
        Ease?: DOMEase | DOMEase[],
        CustomEase?: DOMCustomEase | DOMCustomEase[]
    }
}

export interface DOMLayer {
    $name: string,
    $color: string, //"#4FFF4F",
    //$current: boolean,
    //$isSelected: boolean,
    $layerType: 'guide' | 'normal'
    frames: {
        DOMFrame: DOMFrame | DOMFrame[]
    }
}

export interface DOMTimeline {
    $name: string,
    layers: {
        DOMLayer: DOMLayer | DOMLayer[]
    }
}

export interface DOMSymbolItem {
    $name: string, //"test_button/001.ai Assets/&amp;#060Path&amp;#062_6",
    $itemID: string,
    $lastModified: number,
    timeline: {
        DOMTimeline: DOMTimeline
    }
}


export interface DOMDocument {
    $currentTimeline: number,
    $xflVersion: number,
    $creatorInfo: string,
    $platform: string,
    $versionInfo: string,
    $majorVersion: number,
    $minorVersion: number,
    $buildNumber: number,
    $nextSceneIdentifier: number,
    $playOptionsPlayLoop: boolean,
    $playOptionsPlayPages: boolean,
    $playOptionsPlayFrameActions: boolean,
    $filetypeGUID: string,
    $fileGUID: string,

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
    $left?: number;
    $top?: number;
    $width?: number;
    $height?: number;
}

export interface FDOMPoint {
    $x?: number;
    $y?: number;
}

export interface FDOMTransformationPoint {
    Point?: FDOMPoint
}

export interface FDOMMatrix2D {
    $a?: number;
    $b?: number;
    $c?: number;
    $d?: number;
    $tx?: number;
    $ty?: number;
}

export interface FDOMColor {
    $redMultiplier?: number;
    $greenMultiplier?: number;
    $blueMultiplier?: number;
    $alphaMultiplier?: number;

    $redOffset?: number;
    $greenOffset?: number;
    $blueOffset?: number;
    $alphaOffset?: number;

    $tintMultiplier?: number;
    $tintColor?: string;
}

export interface DOMTextAttributes {
    $fillColor?: string,
    $alpha?: number,
    $alignment?: string,
    $aliasText?: boolean,
    $size?: number,
    $lineHeight?: number,
    $lineSpacing?: number,
    $bitmapSize?: number,
    $face?: string,
}

export interface DOMTextRun {
    characters: string,
    textAttrs: DOMTextAttributes | DOMTextAttributes[]
}

export interface DOMEdges {
    $fillStyle0?: number,
    $fillStyle1?: number,
    $strokeStyle?: number
    $edges: string
}

export interface DOMSolidStroke {
    $weight?: number;
    fill?: { SolidColor: { $color: string, $alpha: number } };
    $miterLimit?: number;
    $pixelHinting?: boolean;
    $scaleMode?: ScaleMode;
    $caps?: LineCaps;
    $joints?: LineJoints;
    $solidStyle?: SolidStyleType;
}

export interface DOMStrokeStyle {
    $index: number,
    SolidStroke?: DOMSolidStroke;
}

export interface DOMGradientEntry {
    $color?: string,
    $alpha?: number,
    $ratio?: number
}

export interface DOMMatrix2DHolder {
    matrix?: {
        Matrix?: FDOMMatrix2D
    }
}