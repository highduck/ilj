import {Color4, Matrix2D} from "@highduck/math";
import {CanvasKit, SkBlendMode, SkMatrix, SkPaint, SkShader, SkSurface, SkTileMode} from "canvaskit-wasm";
import {BlendMode, FillType, SpreadMethod} from "../xfl/dom";
import {FillStyle} from "../xfl/types";
import {TransformModel} from "../render/TransformModel";
import {getCanvasKit} from "./SkiaHelpers";

export function convertMatrix(m: Matrix2D): SkMatrix {
    return [
        m.a, m.c, m.x,
        m.b, m.d, m.y,
        0, 0, 1
    ];
}

export function setPaintColor(ck: CanvasKit, paint: SkPaint, r: number, g: number, b: number, a: number) {
    paint.setColor((ck as any).Color4f(r, g, b, a));
}

export function convertBlendMode(ck: CanvasKit, mode: BlendMode): SkBlendMode {
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


export function convertSpreadMethod(ck: CanvasKit, spreadMethod?: SpreadMethod): SkTileMode {
    if (spreadMethod === SpreadMethod.extend) {
        return ck.TileMode.Clamp;
    } else if (spreadMethod === SpreadMethod.repeat) {
        return ck.TileMode.Repeat;
    } else if (spreadMethod === SpreadMethod.reflect) {
        return ck.TileMode.Mirror;
    }
    return ck.TileMode.Decal;
}

export function createFillShader(ck: CanvasKit, fill: FillStyle, transform: TransformModel): SkShader {
    const tileMode = convertSpreadMethod(ck, fill.spreadMethod);

    const colors = [];
    const positions = [];
    const matrix = new Matrix2D();
    matrix.copyFrom(transform.matrix);
    matrix.mult(fill.matrix);
    const localMatrix = convertMatrix(matrix);

    for (const entry of fill.entries) {
        const color = new Color4();
        color.copyFrom(entry.color);
        transform.transformColor(color);
        colors.push((ck as any).Color4f(color.r, color.g, color.b, color.a));
        positions.push(entry.ratio);
    }

    switch (fill.type) {
        case FillType.linear:
            return ((ck as any).SkShader.MakeLinearGradient([-819.2, 0], [819.2, 0],
                colors, positions, (tileMode as any) as number, localMatrix, 0) as SkShader);
        case FillType.radial:
            return ((ck as any).SkShader.MakeTwoPointConicalGradient([0, 0], 0, [0, 0], 819.2,
                colors, positions, (tileMode as any) as number, localMatrix, 0) as SkShader);
        default:
            throw ("error: " + fill.type);
    }
}

export function blitDownSample(destSurface: SkSurface, srcSurface: SkSurface, x: number, y: number, upscale: number, blendMode: BlendMode) {
    const ck = getCanvasKit();
    const paint = new ck.SkPaint();
    paint.setAntiAlias(false);
    paint.setBlendMode(convertBlendMode(ck, blendMode));
    paint.setFilterQuality(ck.FilterQuality.High);
    const image = srcSurface.makeImageSnapshot();
    const canvas = destSurface.getCanvas();
    canvas.save();
    canvas.scale(1 / upscale, 1 / upscale);
    canvas.drawImage(image, 0, 0, paint);
    canvas.restore();
    paint.delete();
    image.delete();
}
