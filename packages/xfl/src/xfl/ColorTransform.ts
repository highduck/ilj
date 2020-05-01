import {Color32_ARGB, Color4} from "@highduck/math";

export class ColorTransform {
    readonly multiplier = new Color4(1, 1, 1, 1);
    readonly offset = new Color4(0, 0, 0, 0);

    copyFrom(o: ColorTransform): this {
        this.multiplier.copyFrom(o.multiplier);
        this.offset.copyFrom(o.offset);
        return this;
    }

    /**
     *
     * @param color - RGB part
     * @param intensity - float 0...1
     */
    tint(color: Color32_ARGB, intensity: number) {
        this.multiplier.r = 1 - intensity;
        this.multiplier.g = 1 - intensity;
        this.multiplier.b = 1 - intensity;
        this.offset.r = ((color >>> 16) & 0xFF) * intensity / 255.0;
        this.offset.g = ((color >>> 8) & 0xFF) * intensity / 255.0;
        this.offset.b = (color & 0xFF) * intensity / 255.0;
    }

    mult(right: ColorTransform): this {
        this.offset.set(
            this.offset.r + right.offset.r * this.multiplier.r,
            this.offset.g + right.offset.g * this.multiplier.g,
            this.offset.b + right.offset.b * this.multiplier.b,
            this.offset.a + right.offset.a * this.multiplier.a
        );
        this.multiplier.multiply(right.multiplier);
        return this;
    }

    transform(color: Color4) {
        color.multiply(this.multiplier).add(this.offset);
    }
}
