import {BlendMode} from "@highduck/xfl";
import {Color4, Matrix2D} from "@highduck/math";

export class TransformModel {
    readonly matrix = new Matrix2D();
    readonly colorMultiplier = new Color4(1, 1, 1, 1);
    readonly colorOffset = new Color4(0, 0, 0, 0);
    blendMode = BlendMode.normal;

    multiply(r: TransformModel): this {
        return this.mult(r.matrix, r.colorMultiplier, r.colorOffset, r.blendMode);
    }

    copyFrom(r: TransformModel): this {
        this.matrix.copyFrom(r.matrix);
        this.colorMultiplier.copyFrom(r.colorMultiplier);
        this.colorOffset.copyFrom(r.colorOffset);
        this.blendMode = r.blendMode;
        return this;
    }

    mult(matrix: Matrix2D, colorMultiplier: Color4, colorOffset: Color4, blendMode: BlendMode): this {
        this.matrix.multiplyWith(matrix);
        //  color concat
        this.colorOffset.set(
            this.colorOffset.r + colorOffset.r * this.colorMultiplier.r,
            this.colorOffset.g + colorOffset.g * this.colorMultiplier.g,
            this.colorOffset.b + colorOffset.b * this.colorMultiplier.b,
            this.colorOffset.a + colorOffset.a * this.colorMultiplier.a
        );
        this.colorMultiplier.multiply(colorMultiplier);

        this.blendMode = (blendMode === BlendMode.last ? this.blendMode : blendMode);

        return this;
    }

    transformColor(c: Color4) {
        c.multiply(this.colorMultiplier).add(this.colorOffset);
    }
}