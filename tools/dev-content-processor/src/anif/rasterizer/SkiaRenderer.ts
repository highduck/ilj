import {BlendMode, SkCanvas, SkPaint, SkPath} from "canvaskit-wasm";
import {TransformModel} from "../render/TransformModel";
import {DecodedBitmap, FillStyle, FillType, LineCaps, LineJoints, StrokeStyle} from "@highduck/xfl";
import {RenderCommand} from "../render/RenderCommand";
import {RenderOp} from "../render/RenderOp";
import {CanvasKit, destroyPMASurface, makePMASurface} from "./SkiaHelpers";
import {Matrix2D} from "@highduck/math";
import {BitmapFillInstance} from "./BitmapFillShader";
import {convertBlendMode, convertMatrix, createFillShader, setPaintColor} from "./SkiaFunctions";

export class SkiaRenderer {
    readonly transform = new TransformModel();

    fill_flag_ = false;
    stroke_flag_ = false;
    open_flag_ = false;

    fill_style_: undefined | FillStyle = undefined;
    stroke_style_: undefined | StrokeStyle = undefined;

    blendMode: BlendMode;
    paintStroke: SkPaint;
    paintSolidFill: SkPaint;
    paintShaderFill: SkPaint;
    bitmapFillImage: undefined | BitmapFillInstance = undefined;

    path: undefined | SkPath = undefined;

    constructor(readonly canvas: SkCanvas, aa: boolean) {
        this.paintStroke = new CanvasKit.SkPaint();
        this.paintStroke.setAntiAlias(aa);
        this.paintStroke.setStyle(CanvasKit.PaintStyle.Stroke);
        this.paintSolidFill = new CanvasKit.SkPaint();
        this.paintSolidFill.setAntiAlias(aa);
        this.paintSolidFill.setStyle(CanvasKit.PaintStyle.Fill);
        this.paintShaderFill = new CanvasKit.SkPaint();
        this.paintShaderFill.setAntiAlias(aa);
        this.paintShaderFill.setStyle(CanvasKit.PaintStyle.Fill);
        this.blendMode = CanvasKit.BlendMode.SrcOver;
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

    setTransform(transform: TransformModel) {
        this.transform.copyFrom(transform);
        this.blendMode = convertBlendMode(transform.blendMode);
    }

    drawBitmap(bitmap: DecodedBitmap) {
        const surface = makePMASurface(bitmap.width, bitmap.height);
        // const surface = .MakeSurface(bitmap.width, bitmap.height);
        surface.getCanvas().writePixels(bitmap.data, bitmap.width, bitmap.height, 0, 0);
        const image = surface.makeImageSnapshot();

        this.canvas.save();
        this.canvas.concat(convertMatrix(this.transform.matrix));
        const paint = new CanvasKit.SkPaint();
        paint.setBlendMode(this.blendMode);
        paint.setAntiAlias(false);
        paint.setFilterQuality(CanvasKit.FilterQuality.None);
        this.canvas.drawImage(image, 0, 0, paint);
        //this.canvas.flush();
        paint.delete();
        image.delete();
        // surface.dispose();
        destroyPMASurface(surface);
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
        const path = new CanvasKit.SkPath();

        // path.arcTo({fLeft: l, fTop: t, fRight: r, fBottom: b}, a0, sweep, true);
        path.addArc([l, t, r, b], a0, sweep);
        if (inner > 0) {
            const rx = inner * (r - l) / 2;
            const ry = inner * (b - t) / 2;
            path.arcToOval([cx - rx, cy - ry, cx + rx, cy + ry], a0 + sweep, -sweep, !close);

            if (close) {
                path.arcToOval([l, t, r, b], a0, 0, false);
                path.close();
            }
        } else {
            if (close) {
                path.lineTo(cx, cy);
                path.close();
            }
        }
        path.transform(convertMatrix(matrix));
        return path;
    }

    private createRectanglePath(cmd: RenderCommand, matrix: Matrix2D): SkPath {
        const l = cmd.v[0];
        const t = cmd.v[1];
        const r = cmd.v[2];
        const b = cmd.v[3];
        const path = new CanvasKit.SkPath();
        const maxRadius = Math.min((b - t) / 2, (r - l) / 2);
        const r1 = Math.min(maxRadius, cmd.v[4]);
        const r2 = Math.min(maxRadius, cmd.v[5]);
        const r3 = Math.min(maxRadius, cmd.v[6]);
        const r4 = Math.min(maxRadius, cmd.v[7]);
        path.moveTo(l, t + r1);
        path.arcToOval([l, t, l + r1 * 2, t + r1 * 2], -180, 90, false);
        path.lineTo(r - r2, t);
        path.arcToOval([r - r2 * 2, t, r, t + r2 * 2], -90, 90, false);
        path.lineTo(r, b - r3);
        path.arcToOval([r - r3 * 2, b - r3 * 2, r, b], 0, 90, false);
        path.lineTo(l + r4, b);
        path.arcToOval([l, b - r4 * 2, l + r4 * 2, b], 90, 90, false);
        path.close();
        path.transform(convertMatrix(matrix));
        return path;
    }

    drawCmdPath(cmd: RenderCommand, path: SkPath) {
        let paint = this.setFillStyle(cmd.fill);
        if (paint) {
            paint.setStyle(CanvasKit.PaintStyle.Fill);
            this.canvas.drawPath(path, paint);
            //this.canvas.flush();
        }
        paint = this.setStrokeStyle(cmd.stroke);
        if (paint) {
            paint.setStyle(CanvasKit.PaintStyle.Stroke);
            this.canvas.drawPath(path, paint);
            //this.canvas.flush();
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
                break;

            case RenderOp.curve_to:
                if (this.path !== undefined) {
                    this.path.quadTo(cmd.v[0], cmd.v[1], cmd.v[2], cmd.v[3]);
                }
                break;

            case RenderOp.move_to:
                if (this.path !== undefined) {
                    this.path.moveTo(cmd.v[0], cmd.v[1]);
                }
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
            }
                break;

            case RenderOp.bitmap:
                if (cmd.bitmap !== undefined) {
                    this.drawBitmap(cmd.bitmap);
                }
                break;
        }
    }

    private open() {
        if (!this.open_flag_) {
            if (this.path !== undefined) {
                this.path.delete();
            }
            this.path = new CanvasKit.SkPath();
            this.path.setFillType(CanvasKit.FillType.EvenOdd);
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
                    setPaintColor(paint, c.r, c.g, c.b, c.a);
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
                        this.bitmapFillImage = new BitmapFillInstance(fillStyle.bitmap);
                        paint.setShader(this.bitmapFillImage.makeShader(fillStyle, this.transform));
                    } else {
                        paint = this.paintSolidFill;
                        setPaintColor(paint, 0, 0, 0, 0)
                    }
                } else {
                    paint.setShader(createFillShader(fillStyle, this.transform));
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
                paint.setStrokeCap(CanvasKit.StrokeCap.Butt);
                break;
            case LineCaps.round:
                paint.setStrokeCap(CanvasKit.StrokeCap.Round);
                break;
            case LineCaps.square:
                paint.setStrokeCap(CanvasKit.StrokeCap.Square);
                break;
        }

        switch (solid.joints) {
            case LineJoints.miter:
                paint.setStrokeJoin(CanvasKit.StrokeJoin.Miter);
                break;
            case LineJoints.round:
                paint.setStrokeJoin(CanvasKit.StrokeJoin.Round);
                break;
            case LineJoints.bevel:
                paint.setStrokeJoin(CanvasKit.StrokeJoin.Bevel);
                break;
        }

        paint.setStrokeWidth(solid.weight);
        paint.setStrokeMiter(solid.miterLimit);
        paint.setBlendMode(this.blendMode);

        return paint;
    }

    private close() {
        if (this.open_flag_) {
            if (this.path !== undefined) {
                //this.path.close();

                if (this.fill_flag_) {
                    const paint = this.setFillStyle(this.fill_style_);
                    if (paint) {
                        paint.setStyle(CanvasKit.PaintStyle.Fill);
                        this.canvas.drawPath(this.path, paint);
                    }
                }

                if (this.stroke_flag_) {
                    const paint = this.setStrokeStyle(this.stroke_style_);
                    if (paint) {
                        paint.setStyle(CanvasKit.PaintStyle.Stroke);
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