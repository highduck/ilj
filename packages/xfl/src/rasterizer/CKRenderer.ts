import {CanvasKit, SkBlendMode, SkCanvas, SkPaint, SkPath, SkShader} from "canvaskit-wasm";
import {transform_model} from "../render/TransformModel";
import {Bitmap, FillStyle, StrokeStyle} from "../xfl/types";
import {RenderCommand} from "../render/RenderCommand";
import {BlendMode, FillType, LineCaps, LineJoints, SpreadMethod} from "../xfl/dom";
import {RenderOp} from "../render/RenderOp";
import {getCanvasKit} from "./CanvasKitHelpers";
import {Color4, Matrix2D, Vec2} from "@highduck/math";

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

function create_fill_pattern(ck: CanvasKit, fill: FillStyle, transform: transform_model): SkShader {
    let tileMode = ck.TileMode.Clamp;
    if (fill.spreadMethod === SpreadMethod.extend) {
        tileMode = ck.TileMode.Clamp;
    } else if (fill.spreadMethod === SpreadMethod.repeat) {
        tileMode = ck.TileMode.Repeat;
    } else if (fill.spreadMethod === SpreadMethod.reflect) {
        tileMode = ck.TileMode.Mirror;
    }

    let colors = [];
    let positions = [];
    let matrix = new Matrix2D();
    matrix.copyFrom(transform.matrix);
    matrix.mult(fill.matrix);

    for (const entry of fill.entries) {
        const color = new Color4();
        color.copyFrom(entry.color);
        transform.color.transform(color);
        colors.push(ck.Color(255 * color.r, 255 * color.g, 255 * color.b, color.a));
        positions.push(entry.ratio);
    }

    switch (fill.type) {
        case FillType.linear: {
            const p0 = new Vec2();
            const p1 = new Vec2();
            matrix.transform(-819.2, 0, p0);
            matrix.transform(819.2, 0, p1);
            // console.info(colors);
            // console.info(positions);
            return ck.MakeLinearGradientShader(
                [p0.x, p0.y],
                [p1.x, p1.y],
                colors,
                positions,
                tileMode.value,
                // [
                //     matrix.a, matrix.b, matrix.x,
                //     matrix.c, matrix.d, matrix.y,
                //     0, 0, 1,
                // ],
                null,
                0
            );
        }
        case FillType.radial: {
            const p0 = new Vec2();
            const p1 = new Vec2();
            matrix.transform(0, 0, p0);
            matrix.transform(819.2, 0, p1);
            const radius = p1.distance(p0);
            // console.info(colors);
            // console.info(positions);
            // console.info(p0.x, p0.y, radius);
            // return ck.MakeRadialGradientShader(
            return ck.MakeTwoPointConicalGradientShader(
                [p0.x, p0.y], 0,
                [p0.x, p0.y], radius,
                colors,
                positions,
                tileMode.value,
                // [
                //     matrix.a, matrix.b, matrix.x,
                //     matrix.c, matrix.d, matrix.y,
                //     0, 0, 1,
                // ],
                null,
                0
            );
        }
        default:
            throw "error";
    }
}

export class CKRenderer {
    readonly ck: CanvasKit;

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
    }

    dispose() {
        this.paintStroke.delete();
        this.paintSolidFill.delete();
        this.paintShaderFill.delete();
        if (this.path !== undefined) {
            this.path.delete();
        }
    }

    // private setBlendMode(mode: BlendMode) {
    // }

    set_transform(transform: transform_model) {
        this.transform.copyFrom(transform);
        // this.setBlendMode(transform.blend_mode);
        // this.paint.setBlendMode(convertBlendMode(this.ck, mode));
    }

    draw_bitmap(bitmap: Bitmap) {

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
        }
    }

    readonly transform = new transform_model();

    fill_flag_ = false;
    stroke_flag_ = false;
    open_flag_ = false;

    fill_style_: undefined | FillStyle = undefined;
    stroke_style_: undefined | StrokeStyle = undefined;

    paintStroke: SkPaint;
    paintSolidFill: SkPaint;
    paintShaderFill: SkPaint;

    path: undefined | SkPath = undefined;

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

    private fill() {
        let paint = this.paintSolidFill;
        if (this.fill_style_) {
            // this.paint.setColorf(1, 0, 0, 1);
            if (this.fill_style_.type === FillType.solid) {
                if (this.fill_style_.entries && this.fill_style_.entries.length > 0) {
                    const c = this.fill_style_.entries[0].color.copy();
                    this.transform.color.transform(c);
                    paint.setColorf(c.r, c.g, c.b, c.a);
                } else {
                    throw "bad data";
                }
            } else {
                paint = this.paintShaderFill;
                paint.setShader(create_fill_pattern(this.ck, this.fill_style_, this.transform));
            }

            if (this.path !== undefined) {
                // this.paint.setStyle(this.ck.PaintStyle.Stroke);
                this.canvas.drawPath(this.path, paint);
            }
        }

        // todo:
        // if (pattern) {
        //     cairo_set_source(ctx_, pattern);
        // }

        // cairo_set_fill_rule(ctx_, CAIRO_FILL_RULE_EVEN_ODD);


        // cairo_fill_preserve(ctx_);

        // todo:
        // if (pattern) {
        //     cairo_pattern_destroy(pattern);
        // }
    }

    private close() {
        if (this.open_flag_) {
            //cairo_close_path(ctx_);
            if (this.path !== undefined) {
                this.path.close();
            }

            if (this.fill_flag_) {
                // set fill style color
                this.fill();
            }
            const paint = this.paintStroke;

            if (this.stroke_flag_ && this.stroke_style_) {
                const solid = this.stroke_style_.solid;
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

                const c = solid.fill.copy();
                this.transform.color.transform(c);
                paint.setColorf(c.r, c.g, c.b, c.a);
                // this.paint.setColorf(1,0,0,1);
                // todo: cairo_stroke_preserve(ctx_);
                if (this.path !== undefined) {
                    this.canvas.drawPath(this.path, paint);
                }
            }
//        else if (fill_flag_) {
//            static solid_stroke hairline{};
//            hairline.fill = transform_.color.transform(fill_style_->entries[0].color);
//            hairline.weight = 0.15f;
//            set_solid_stroke(ctx_, hairline);
//            cairo_stroke(ctx_);
//        }

            this.stroke_flag_ = false;
            this.fill_flag_ = false;
            this.open_flag_ = false;
        }
    }
}