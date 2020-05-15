import {CanvasKit, SkBlendMode, SkCanvas, SkPaint, SkPath} from "canvaskit-wasm";
import {TransformModel} from "../render/TransformModel";
import {Bitmap, FillStyle, StrokeStyle} from "../xfl/types";
import {RenderCommand} from "../render/RenderCommand";
import {FillType, LineCaps, LineJoints} from "../xfl/dom";
import {RenderOp} from "../render/RenderOp";
import {destroyPMASurface, getCanvasKit, makePMASurface} from "./SkiaHelpers";
import {Matrix2D} from "@highduck/math";
import {BitmapFillInstance} from "./BitmapFillShader";
import {convertBlendMode, convertMatrix, createFillShader, setPaintColor} from "./SkiaFunctions";

export class SkiaRenderer {
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
    bitmapFillImage: undefined | BitmapFillInstance = undefined;

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
        // const surface = this.ck.MakeSurface(bitmap.width, bitmap.height);
        surface.getCanvas().writePixels(bitmap.data, bitmap.width, bitmap.height, 0, 0);
        const image = surface.makeImageSnapshot();

        this.canvas.save();
        this.canvas.concat(convertMatrix(this.transform.matrix));
        const paint = new this.ck.SkPaint();
        paint.setBlendMode(this.blendMode);
        paint.setAntiAlias(false);
        paint.setFilterQuality(this.ck.FilterQuality.None);
        this.canvas.drawImage(image, 0, 0, paint);
        this.canvas.flush();
        paint.delete();
        image.delete();
        // surface.dispose();
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

        // path.arcTo({fLeft: l, fTop: t, fRight: r, fBottom: b}, a0, sweep, true);
        path.addArc({fLeft: l, fTop: t, fRight: r, fBottom: b}, a0, sweep);
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
        path.transform(convertMatrix(matrix));
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
        path.transform(convertMatrix(matrix));
        return path;
    }

    drawCmdPath(cmd: RenderCommand, path: SkPath) {
        let paint = this.setFillStyle(cmd.fill);
        if (paint) {
            paint.setStyle(this.ck.PaintStyle.Fill);
            this.canvas.drawPath(path, paint);
            this.canvas.flush();
        }
        paint = this.setStrokeStyle(cmd.stroke);
        if (paint) {
            paint.setStyle(this.ck.PaintStyle.Stroke);
            this.canvas.drawPath(path, paint);
            this.canvas.flush();
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
                    setPaintColor(this.ck, paint, c.r, c.g, c.b, c.a);
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
                        this.bitmapFillImage = new BitmapFillInstance(this.ck, fillStyle.bitmap);
                        paint.setShader(this.bitmapFillImage.makeShader(fillStyle, this.transform));
                    } else {
                        paint = this.paintSolidFill;
                        setPaintColor(this.ck, paint, 0, 0, 0, 0)
                    }
                } else {
                    paint.setShader(createFillShader(this.ck, fillStyle, this.transform));
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

    private close() {
        if (this.open_flag_) {
            if (this.path !== undefined) {
                //this.path.close();

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