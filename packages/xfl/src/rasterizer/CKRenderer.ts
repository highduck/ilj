import {
    CanvasKit,
    SkBlendMode,
    SkCanvas,
    SkImage,
    SkMatrix,
    SkPaint,
    SkPath,
    SkShader,
    SkSurface,
    SkTileMode
} from "canvaskit-wasm";
import {TransformModel} from "../render/TransformModel";
import {Bitmap, FillStyle, StrokeStyle} from "../xfl/types";
import {RenderCommand} from "../render/RenderCommand";
import {BlendMode, FillType, LineCaps, LineJoints, SpreadMethod} from "../xfl/dom";
import {RenderOp} from "../render/RenderOp";
import {destroyPMASurface, getCanvasKit, makePMASurface} from "./CanvasKitHelpers";
import {Color4, Matrix2D} from "@highduck/math";

function convertMatrix(m: Matrix2D): SkMatrix {
    return [
        m.a, m.c, m.x,
        m.b, m.d, m.y,
        0, 0, 1
    ];
}

class SkBitmapFillInstance {

    surface: SkSurface;
    image: SkImage;

    constructor(
        readonly ck: CanvasKit, bitmap: Bitmap
    ) {
        this.surface = makePMASurface(ck, bitmap.width, bitmap.height);
        if (bitmap.data) {
            this.surface.getCanvas().writePixels(bitmap.data, bitmap.width, bitmap.height, 0, 0);
        } else {
            console.warn('error: empty bitmap data!');
        }
        this.image = this.surface.makeImageSnapshot();
        if (this.image == null) {
            console.warn('error: create skia image!');
        }
    }

    dispose() {
        this.image.delete();
        destroyPMASurface(this.ck, this.surface);
    }

    makeShader(fill: FillStyle, transform: TransformModel): SkShader {
        const tileMode = convertSpreadMethod(this.ck, fill.spreadMethod);
        const matrix = new Matrix2D();
        matrix.copyFrom(transform.matrix);
        matrix.mult(fill.matrix);
        const localMatrix = convertMatrix(matrix);
        return ((this.image as any).makeShader(tileMode, tileMode, localMatrix)) as SkShader;
    }
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

interface CanvasKitEx extends CanvasKit {
    Color4f(r: number, g: number, b: number, a: number): number;
}

function convertSpreadMethod(ck: CanvasKit, spreadMethod?: SpreadMethod): SkTileMode {
    if (spreadMethod === SpreadMethod.extend) {
        return ck.TileMode.Clamp;
    } else if (spreadMethod === SpreadMethod.repeat) {
        return ck.TileMode.Repeat;
    } else if (spreadMethod === SpreadMethod.reflect) {
        return ck.TileMode.Mirror;
    }
    return ck.TileMode.Decal;
}

function create_fill_pattern(ck: CanvasKit, fill: FillStyle, transform: TransformModel): SkShader {
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
        colors.push(ck.Color(255 * color.r, 255 * color.g, 255 * color.b, color.a));
        positions.push(entry.ratio);
    }

    switch (fill.type) {
        case FillType.linear:
            return ck.MakeLinearGradientShader([-819.2, 0], [819.2, 0],
                colors, positions, (tileMode as any) as number, localMatrix, 0);
        case FillType.radial:
            return ck.MakeTwoPointConicalGradientShader([0, 0], 0, [0, 0], 819.2,
                colors, positions, (tileMode as any) as number, localMatrix, 0);
        default:
            throw ("error: " + fill.type);
    }
}

export class CKRenderer {
    readonly ck: CanvasKit;
    readonly transform = new TransformModel();

    fill_flag_ = false;
    stroke_flag_ = false;
    open_flag_ = false;

    fill_style_: undefined | FillStyle = undefined;
    stroke_style_: undefined | StrokeStyle = undefined;

    blendMode: SkBlendMode;
    paintStroke: SkPaint;
    paintSolidFill: SkPaint;
    paintShaderFill: SkPaint;
    bitmapFillImage: undefined | SkBitmapFillInstance = undefined;

    path: undefined | SkPath = undefined;

    constructor(readonly canvas: SkCanvas, aa: boolean) {
        this.ck = getCanvasKit();
        this.paintStroke = new this.ck.SkPaint();
        this.paintStroke.setAntiAlias(aa);
        this.paintStroke.setStyle(this.ck.PaintStyle.Stroke);
        this.paintSolidFill = new this.ck.SkPaint();
        this.paintSolidFill.setAntiAlias(aa);
        this.paintSolidFill.setStyle(this.ck.PaintStyle.Fill);
        this.paintShaderFill = new this.ck.SkPaint();
        this.paintShaderFill.setAntiAlias(aa);
        this.paintShaderFill.setStyle(this.ck.PaintStyle.Fill);
        this.blendMode = this.ck.BlendMode.SrcOver;
    }

    dispose() {
        this.paintStroke.delete();
        this.paintSolidFill.delete();
        this.paintShaderFill.delete();
        if (this.path !== undefined) {
            this.path.delete();
            this.path = undefined;
        }
        if (this.bitmapFillImage) {
            this.bitmapFillImage.dispose();
            this.bitmapFillImage = undefined;
        }
    }

    set_transform(transform: TransformModel) {
        this.transform.copyFrom(transform);
        this.blendMode = convertBlendMode(this.ck, transform.blendMode);
    }

    draw_bitmap(bitmap: Bitmap) {
        if (bitmap.data === undefined) {
            return;
        }
        const surface = makePMASurface(this.ck, bitmap.width, bitmap.height);
        surface.getCanvas().writePixels(bitmap.data, bitmap.width, bitmap.height, 0, 0);
        const image = surface.makeImageSnapshot();

        this.canvas.save();
        this.canvas.concat(convertMatrix(this.transform.matrix));
        const paint = new this.ck.SkPaint();
        paint.setBlendMode(this.blendMode);
        paint.setAntiAlias(true);
        paint.setFilterQuality(this.ck.FilterQuality.None);
        this.canvas.drawImage(image, 0, 0, paint);
        this.canvas.flush();
        paint.delete();
        image.delete();
        destroyPMASurface(this.ck, surface);
    }

    private createOvalPath(cmd: RenderCommand, matrix: Matrix2D): SkPath {
        const a0 = cmd.v[4];
        let a1 = cmd.v[5];
        if (a1 <= a0) {
            a1 += 360;
        }

        let sweep = a1 - a0;
        let close = cmd.v[6] > 0;
        if (a1 === 360 && a0 === 0) {
            sweep = 360;
            close = false;
        }
        const l = cmd.v[0];
        const t = cmd.v[1];
        const r = cmd.v[2];
        const b = cmd.v[3];
        const cx = l + (r - l) / 2;
        const cy = t + (b - t) / 2;
        const inner = cmd.v[7];
        const path = new this.ck.SkPath();

        // if (close) {
        //     path.moveTo(cx, cy);
        // }
        //
        path.arcTo({fLeft: l, fTop: t, fRight: r, fBottom: b}, a0, sweep, true);
        if (inner > 0) {
            const rx = inner * (r - l) / 2;
            const ry = inner * (b - t) / 2;
            path.arcTo({
                fLeft: cx - rx, fTop: cy - ry, fRight: cx + rx, fBottom: cy + ry
            }, a0 + sweep, -sweep, !close);

            if (close) {
                path.arcTo({fLeft: l, fTop: t, fRight: r, fBottom: b}, a0, 0, false);
                path.close();
            }
        } else {
            if (close) {
                path.lineTo(cx, cy);
                path.close();
            }
        }

        // if (close) {
        //     path.lineTo(cx, cy);
        //     path.close();
        // }
        path.transform([
            matrix.a, matrix.c, matrix.x,
            matrix.b, matrix.d, matrix.y,
            0, 0, 1
        ]);
        return path;
    }

    private createRectanglePath(cmd: RenderCommand, matrix: Matrix2D): SkPath {
        const l = cmd.v[0];
        const t = cmd.v[1];
        const r = cmd.v[2];
        const b = cmd.v[3];
        const path = new this.ck.SkPath();
        const maxRadius = Math.min((b - t) / 2, (r - l) / 2);
        const r1 = Math.min(maxRadius, cmd.v[4]);
        const r2 = Math.min(maxRadius, cmd.v[5]);
        const r3 = Math.min(maxRadius, cmd.v[6]);
        const r4 = Math.min(maxRadius, cmd.v[7]);
        path.moveTo(l, t + r1);
        path.arcTo({fLeft: l, fTop: t, fRight: l + r1 * 2, fBottom: t + r1 * 2}, -180, 90, false);
        path.lineTo(r - r2, t);
        path.arcTo({fLeft: r - r2 * 2, fTop: t, fRight: r, fBottom: t + r2 * 2}, -90, 90, false);
        path.lineTo(r, b - r3);
        path.arcTo({fLeft: r - r3 * 2, fTop: b - r3 * 2, fRight: r, fBottom: b}, 0, 90, false);
        path.lineTo(l + r4, b);
        path.arcTo({fLeft: l, fTop: b - r4 * 2, fRight: l + r4 * 2, fBottom: b}, 90, 90, false);
        path.close();
        path.transform([
            matrix.a, matrix.c, matrix.x,
            matrix.b, matrix.d, matrix.y,
            0, 0, 1
        ]);
        return path;
    }

    drawCmdPath(cmd: RenderCommand, path: SkPath) {
        let paint = this.setFillStyle(cmd.fill);
        if (paint) {
            paint.setStyle(this.ck.PaintStyle.Fill);
            this.canvas.drawPath(path, paint);
        }
        paint = this.setStrokeStyle(cmd.stroke);
        if (paint) {
            paint.setStyle(this.ck.PaintStyle.Stroke);
            this.canvas.drawPath(path, paint);
        }
    }

    execute(cmd: RenderCommand) {
        switch (cmd.op) {
            case RenderOp.line_style_setup: {
                if (this.open_flag_ && this.stroke_flag_) {
                    this.close();
                }
                this.open();
                this.stroke_flag_ = true;
                this.stroke_style_ = cmd.stroke;
            }
                break;
            case RenderOp.line_style_reset:
                this.close();
                this.stroke_flag_ = false;
                break;
            case RenderOp.fill_end:
                this.close();
                this.fill_flag_ = false;
                break;
            case RenderOp.fill_begin: {
                if (this.open_flag_ && this.fill_flag_) {
                    this.close();
                }
                this.open();

                this.fill_flag_ = true;
                this.fill_style_ = cmd.fill;
            }
                break;
            case RenderOp.line_to:
                if (this.path !== undefined) {
                    this.path.lineTo(cmd.v[0], cmd.v[1]);
                }
                // this.line_to(ctx_, cmd.v[0], cmd.v[1]);
                break;

            case RenderOp.curve_to:
                if (this.path !== undefined) {
                    this.path.quadTo(cmd.v[0], cmd.v[1], cmd.v[2], cmd.v[3]);
                }
                //this.quadratic_curve_to(ctx_, cmd.v[0], cmd.v[1], cmd.v[2], cmd.v[3]);
                break;

            case RenderOp.move_to:
                if (this.path !== undefined) {
                    this.path.moveTo(cmd.v[0], cmd.v[1]);
                }
                // cairo_move_to(ctx_, cmd.v[0], cmd.v[1]);
                break;
            case RenderOp.oval: {
                const path = this.createOvalPath(cmd, this.transform.matrix);
                this.drawCmdPath(cmd, path);
                path.delete();
            }
                break;

            case RenderOp.Rectangle: {
                const path = this.createRectanglePath(cmd, this.transform.matrix);
                this.drawCmdPath(cmd, path);
                path.delete();
                // const m = this.transform.matrix;
                // this.canvas.save();
                // this.canvas.concat([m.a, m.c, m.x,
                //     m.b, m.d, m.y,
                //     0, 0, 1]);
                // if (cmd.fill) {
                //     this.drawRectangle(cmd, this.setFillStyle(cmd.fill, false));
                // }
                // if (cmd.stroke) {
                //     this.drawRectangle(cmd, this.setStrokeStyle(cmd.stroke));
                // }
                // this.canvas.restore();
            }
                break;

            case RenderOp.bitmap:
                if (cmd.bitmap !== undefined) {
                    this.draw_bitmap(cmd.bitmap);
                }
                break;
        }
    }

    private open() {
        if (!this.open_flag_) {
            if (this.path !== undefined) {
                this.path.delete();
            }
            this.path = new this.ck.SkPath();
            this.path.setFillType(this.ck.FillType.EvenOdd);
            this.open_flag_ = true;
        }
    }

    private setFillStyle(fillStyle?: FillStyle): SkPaint | undefined {
        let paint: SkPaint | undefined = undefined;
        if (fillStyle) {
            paint = this.paintSolidFill;
            if (fillStyle.type === FillType.solid) {
                if (fillStyle.entries && fillStyle.entries.length > 0) {
                    const c = fillStyle.entries[0].color.copy();
                    this.transform.transformColor(c);
                    paint.setColorf(c.r, c.g, c.b, c.a);
                } else {
                    throw "bad data";
                }
            } else {
                paint = this.paintShaderFill;
                if (fillStyle.type === FillType.Bitmap) {
                    if (fillStyle.bitmap) {
                        if (this.bitmapFillImage) {
                            this.bitmapFillImage.dispose();
                        }
                        this.bitmapFillImage = new SkBitmapFillInstance(this.ck, fillStyle.bitmap);
                        paint.setShader(this.bitmapFillImage.makeShader(fillStyle, this.transform));
                        // paint = this.paintSolidFill;
                        // paint.setColorf(1, 0, 0, 1);
                    } else {
                        paint = this.paintSolidFill;
                        paint.setColorf(0, 0, 0, 0);
                    }
                } else {
                    paint.setShader(create_fill_pattern(this.ck, fillStyle, this.transform));
                }
            }
            paint.setBlendMode(this.blendMode);
        }
        return paint;
    }

    private setStrokeStyle(strokeStyle?: StrokeStyle): SkPaint | undefined {
        if (!strokeStyle) {
            return undefined;
        }
        let paint: SkPaint | undefined = this.setFillStyle(strokeStyle.solid.fill);
        if (!paint) {
            return;
        }

        const solid = strokeStyle.solid;
        switch (solid.caps) {
            case LineCaps.none:
                paint.setStrokeCap(this.ck.StrokeCap.Butt);
                break;
            case LineCaps.round:
                paint.setStrokeCap(this.ck.StrokeCap.Round);
                break;
            case LineCaps.square:
                paint.setStrokeCap(this.ck.StrokeCap.Square);
                break;
        }

        switch (solid.joints) {
            case LineJoints.miter:
                paint.setStrokeJoin(this.ck.StrokeJoin.Miter);
                break;
            case LineJoints.round:
                paint.setStrokeJoin(this.ck.StrokeJoin.Round);
                break;
            case LineJoints.bevel:
                paint.setStrokeJoin(this.ck.StrokeJoin.Bevel);
                break;
        }

        paint.setStrokeWidth(solid.weight);
        paint.setStrokeMiter(solid.miterLimit);
        paint.setBlendMode(this.blendMode);

        return paint;
    }

    private fill() {

    }

    private close() {
        if (this.open_flag_) {
            if (this.path !== undefined) {
                this.path.close();

                if (this.fill_flag_) {
                    const paint = this.setFillStyle(this.fill_style_);
                    if (paint) {
                        paint.setStyle(this.ck.PaintStyle.Fill);
                        this.canvas.drawPath(this.path, paint);
                    }
                }

                if (this.stroke_flag_) {
                    const paint = this.setStrokeStyle(this.stroke_style_);
                    if (paint) {
                        paint.setStyle(this.ck.PaintStyle.Stroke);
                        this.canvas.drawPath(this.path, paint);
                    }
                }
            }

            this.stroke_flag_ = false;
            this.fill_flag_ = false;
            this.open_flag_ = false;
        }
    }
}