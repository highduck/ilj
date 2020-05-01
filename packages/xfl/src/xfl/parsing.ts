import {Color32_ARGB, Color4, Matrix2D, Rect, Vec2} from "@highduck/math";
import {ColorTransform} from "./ColorTransform";
import {DOMMatrix2DHolder, FDOMColor, FDOMPoint, FDOMRect, FDOMTransformationPoint} from "./dom";

export function parseMatrix2D(out: Matrix2D, data: DOMMatrix2DHolder) {
    const m = data.matrix?.Matrix;
    if (m === undefined) {
        return;
    }
    out.a = m.$a ?? 1;
    out.b = m.$b ?? 0;
    out.c = m.$c ?? 0;
    out.d = m.$d ?? 1;
    out.x = m.$tx ?? 0;
    out.y = m.$ty ?? 0;
}

export function parseColorCSS(v?: string): Color32_ARGB {
    return v !== undefined ? parseInt(v.substr(1), 16) : 0x0;
}

export function parseColorTransform(out: ColorTransform, data: { color?: { Color?: FDOMColor } }) {
    const v = data.color?.Color;
    if (v === undefined) {
        return;
    }
    out.multiplier.r = v.$redMultiplier ?? 1;
    out.multiplier.g = v.$greenMultiplier ?? 1;
    out.multiplier.b = v.$blueMultiplier ?? 1;
    out.multiplier.a = v.$alphaMultiplier ?? 1;

    out.offset.r = v.$redOffset ?? 0;
    out.offset.g = v.$greenOffset ?? 0;
    out.offset.b = v.$blueOffset ?? 0;
    out.offset.a = v.$alphaOffset ?? 0;

    const tintMultiplier = v.$tintMultiplier ?? 0;
    if (tintMultiplier > 0) {
        const tintColor = v.$tintColor != null ? parseColorCSS(v.$tintColor) : 0;
        out.tint(tintColor, tintMultiplier);
    }
}

export function readColor(out: Color4, data: any, colorTag: string = '$color', alphaTag: string = '$alpha') {
    const c = parseColorCSS(data[colorTag]);
    const a = data[alphaTag] ?? 1;
    out.r = ((c >>> 16) & 0xFF) / 255;
    out.g = ((c >>> 8) & 0xFF) / 255;
    out.b = (c & 0xFF) / 255;
    out.a = a;
}


export function readRectBounds(out: Rect, data: any, nn: [string, string, string, string]) {
    const l = data[nn[0]] ?? 0;
    const t = data[nn[1]] ?? 0;
    const r = data[nn[2]] ?? 0;
    const b = data[nn[3]] ?? 0;
    out.set(Math.min(l, r), Math.min(t, b), Math.abs(l - r), Math.abs(t - b));
}

export function readScaleGrid(out: Rect, data: any) {
    return readRectBounds(out, data, [
        "scaleGridLeft",
        "scaleGridTop",
        "scaleGridRight",
        "scaleGridBottom"
    ]);
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
    rc.x = data.$left ?? 0;
    rc.y = data.$top ?? 0;
    rc.width = data.$width ?? 0;
    rc.height = data.$height ?? 0;
}

export function readPoint(p: Vec2, data: FDOMPoint) {
    p.x = data.$x ?? 0;
    p.y = data.$y ?? 0;
}

export function readTransformationPoint(p: Vec2, data: { transformationPoint?: FDOMTransformationPoint }) {
    const point = data?.transformationPoint?.Point;
    if (point === undefined) {
        return;
    }
    readPoint(p, point);
}