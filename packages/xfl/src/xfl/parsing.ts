import {clamp, Color32_ARGB, Color4, Matrix2D, Rect, Vec2} from "@highduck/math";
import {
    DOMColorHolder,
    DOMMatrix2DHolder,
    DOMScaleGrid,
    DOMTransformationPointHolder,
    FDOMPoint,
    FDOMRect,
} from "./dom";

export function parseMatrix2D(out: Matrix2D, data: DOMMatrix2DHolder) {
    const m = data.matrix?.Matrix;
    if (m === undefined) {
        return;
    }
    out.a = m._a ?? 1;
    out.b = m._b ?? 0;
    out.c = m._c ?? 0;
    out.d = m._d ?? 1;
    out.x = m._tx ?? 0;
    out.y = m._ty ?? 0;
}

export function parseColorCSS(v?: string): Color32_ARGB {
    return v !== undefined ? parseInt(v.substr(1), 16) : 0x0;
}

function applyTint(multiplier: Color4, offset: Color4, color: Color32_ARGB, intensity: number) {
    multiplier.r = 1 - intensity;
    multiplier.g = 1 - intensity;
    multiplier.b = 1 - intensity;
    offset.r = ((color >>> 16) & 0xFF) * intensity / 255.0;
    offset.g = ((color >>> 8) & 0xFF) * intensity / 255.0;
    offset.b = (color & 0xFF) * intensity / 255.0;
}

export function parseColorTransform(outMultiplier: Color4, outOffset: Color4, data: DOMColorHolder) {
    const v = data.color?.Color;
    if (v === undefined) {
        return;
    }
    outMultiplier.r = v._redMultiplier ?? 1;
    outMultiplier.g = v._greenMultiplier ?? 1;
    outMultiplier.b = v._blueMultiplier ?? 1;
    outMultiplier.a = v._alphaMultiplier ?? 1;

    outOffset.r = (v._redOffset ?? 0) / 255.0;
    outOffset.g = (v._greenOffset ?? 0) / 255.0;
    outOffset.b = (v._blueOffset ?? 0) / 255.0;
    outOffset.a = (v._alphaOffset ?? 0) / 255.0;

    const tintMultiplier = v._tintMultiplier ?? 0;
    if (tintMultiplier > 0) {
        const tintColor = v._tintColor != null ? parseColorCSS(v._tintColor) : 0;
        applyTint(outMultiplier, outOffset, tintColor, tintMultiplier);
    }

    const br = clamp(v._brightness ?? 0, -1, 1);
    if (br < 0) {
        outMultiplier.r =
            outMultiplier.g =
                outMultiplier.b = 1 + br;
    } else if (br > 0) {
        outOffset.r =
            outOffset.g =
                outOffset.b = br;
    }
}

export function readColor(out: Color4, data: any, colorTag: string = '_color', alphaTag: string = '_alpha') {
    const c = parseColorCSS(data[colorTag]);
    const a = data[alphaTag] ?? 1;
    out.r = ((c >>> 16) & 0xFF) / 255;
    out.g = ((c >>> 8) & 0xFF) / 255;
    out.b = (c & 0xFF) / 255;
    out.a = a;
}

export function readScaleGrid(out: Rect, data: DOMScaleGrid) {
    out.setBounds(
        data._scaleGridLeft ?? 0,
        data._scaleGridTop ?? 0,
        data._scaleGridRight ?? 0,
        data._scaleGridBottom ?? 0
    );
}

export function oneOrMany<T>(a?: undefined | null | T | T[]): T[] {
    return a != null ? (Array.isArray(a) ? a : [a]) : [];
}

export function readAlignment(out: Vec2, data?: string) {
    out.set(0, 0);
    if (data === 'center') {
        out.x = 0.5;
    } else if (data === 'right') {
        out.x = 1;
    }
}

export function readRect(rc: Rect, data: FDOMRect) {
    rc.set(
        data._left ?? 0,
        data._top ?? 0,
        data._width ?? 0,
        data._height ?? 0
    );
}

export function readPoint(p: Vec2, data: FDOMPoint) {
    p.x = data._x ?? 0;
    p.y = data._y ?? 0;
}

export function readTransformationPoint(p: Vec2, data: DOMTransformationPointHolder) {
    const point = data?.transformationPoint?.Point;
    if (point === undefined) {
        return;
    }
    readPoint(p, point);
}