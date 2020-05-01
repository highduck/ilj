import {ColorTransform} from "../xfl/ColorTransform";
import {BlendMode} from "../xfl/dom";
import {Matrix2D} from "@highduck/math";

export class transform_model {
    readonly matrix = new Matrix2D();
    readonly color = new ColorTransform();
    blend_mode = BlendMode.normal;

    multiply(r: transform_model): this {
        return this.mult(r.matrix, r.color, r.blend_mode);
    }

    copyFrom(r: transform_model): this {
        this.matrix.copyFrom(r.matrix);
        this.color.copyFrom(r.color);
        this.blend_mode = r.blend_mode;
        return this;
    }

    mult(matrix: Matrix2D, color: ColorTransform, blend_mode: BlendMode): this {
        this.matrix.mult(matrix);
        this.color.mult(color);
        this.blend_mode = (blend_mode === BlendMode.last ? this.blend_mode : blend_mode);
        return this;
    }
}