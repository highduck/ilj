import {Matrix2D, Color4} from "@highduck/math";
import {BlendMode as SkBlendMode, Matrix3x3 as SkMatrix, SkPaint, SkShader, SkSurface, TileMode} from "canvaskit-wasm";
import {BlendMode, FillStyle, FillType, SpreadMethod} from "@highduck/xfl";
import {TransformModel} from "../render/TransformModel";
import {CanvasKit} from "./SkiaHelpers";

export function convertMatrix(m: Matrix2D): SkMatrix {
    return new Float32Array([
        m.a, m.c, m.x,
        m.b, m.d, m.y,
        0, 0, 1
    ]);
}

export function setPaintColor(paint: SkPaint, r: number, g: number, b: number, a: number) {
    paint.setColor(CanvasKit.Color4f(r, g, b, a));
}

export function convertBlendMode(mode: BlendMode): SkBlendMode {
    const ck = CanvasKit;
    switch (mode) {
        case BlendMode.last:
            return ck.BlendMode.SrcOver;
        case BlendMode.normal:
            return ck.BlendMode.SrcOver;
        case BlendMode.layer:
            return ck.BlendMode.SrcOver;
        case BlendMode.multiply:
            return ck.BlendMode.Multiply;
        case BlendMode.screen:
            return ck.BlendMode.Screen;
        case BlendMode.lighten:
            return ck.BlendMode.Lighten;
        case BlendMode.darken:
            return ck.BlendMode.Darken;
        case BlendMode.difference:
            return ck.BlendMode.Difference;
        case BlendMode.add:
            return ck.BlendMode.Plus;
        case BlendMode.subtract:
            return ck.BlendMode.Exclusion;
        case BlendMode.invert:
            return ck.BlendMode.Xor; // ?
        case BlendMode.alpha:
            return ck.BlendMode.SrcATop; // ?
        case BlendMode.erase:
            return ck.BlendMode.Clear; // ?
        case BlendMode.overlay:
            return ck.BlendMode.Overlay;
        case BlendMode.hardlight:
            return ck.BlendMode.HardLight;
    }
    return ck.BlendMode.SrcOver;
}


export function convertSpreadMethod(spreadMethod?: SpreadMethod): TileMode {
    if (spreadMethod === SpreadMethod.extend) {
        return CanvasKit.TileMode.Clamp;
    } else if (spreadMethod === SpreadMethod.repeat) {
        return CanvasKit.TileMode.Repeat;
    } else if (spreadMethod === SpreadMethod.reflect) {
        return CanvasKit.TileMode.Mirror;
    }
    return CanvasKit.TileMode.Decal;
}

export function createFillShader(fill: FillStyle, transform: TransformModel): SkShader {
    const tileMode = convertSpreadMethod(fill.spreadMethod);

    const colors = [];
    const positions = [];
    const matrix = new Matrix2D();
    matrix.copyFrom(transform.matrix);
    matrix.multiplyWith(fill.matrix);
    const localMatrix = convertMatrix(matrix);

    for (const entry of fill.entries) {
        const color = new Color4();
        color.copyFrom(entry.color);
        transform.transformColor(color);
        colors.push(CanvasKit.Color4f(color.r, color.g, color.b, color.a));
        positions.push(entry.ratio);
    }

    switch (fill.type) {
        case FillType.linear:
            return CanvasKit.SkShader.MakeLinearGradient(
                [-819.2, 0], [819.2, 0],
                colors, positions, tileMode, localMatrix, 0
            );
        case FillType.radial:
            return CanvasKit.SkShader.MakeTwoPointConicalGradient(
                [0, 0], 0, [0, 0], 819.2,
                colors, positions, tileMode, localMatrix, 0
            );
        default:
            throw ("error: " + fill.type);
    }
}

export function blitDownSample(destSurface: SkSurface, srcSurface: SkSurface, x: number, y: number, upscale: number, blendMode: BlendMode) {
    const paint = new CanvasKit.SkPaint();
    paint.setAntiAlias(false);
    paint.setBlendMode(convertBlendMode(blendMode));
    paint.setFilterQuality(CanvasKit.FilterQuality.High);
    const image = srcSurface.makeImageSnapshot();
    const canvas = destSurface.getCanvas();
    canvas.save();
    canvas.scale(1 / upscale, 1 / upscale);
    canvas.drawImage(image, 0, 0, paint);
    canvas.restore();
    paint.delete();
    image.delete();
}
