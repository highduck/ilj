import {Color32_ARGB, Recta} from "@highduck/math";
import {Drawer} from "../../drawer/Drawer";
import {Display2D, Display2DComponent} from "./Display2D";
import {ComponentTypeA} from "../../ecs";

export class DisplayQuadComponent extends Display2DComponent {
    readonly rect: Recta = new Recta(0, 0, 1, 1);
    readonly colors: [Color32_ARGB, Color32_ARGB, Color32_ARGB, Color32_ARGB] = [0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF];

    constructor() {
        super();
    }

    set color(c: number) {
        this.colors.fill(c);
    }

    setColorTop(c: Color32_ARGB) {
        this.colors[0] = this.colors[1] = c;
    }

    setColorBottom(c: Color32_ARGB) {
        this.colors[2] = this.colors[3] = c;
    }

    setHalfExtents(halfWidth: number, halfHeight: number): this {
        this.rect.set(-halfWidth, -halfHeight, 2 * halfWidth, 2 * halfHeight);
        return this;
    }

    draw(drawer: Drawer) {
        drawer.state.setEmptyTexture();
        drawer.quadColor4(this.rect.x,
            this.rect.y, this.rect.width, this.rect.height,
            this.colors[0], this.colors[1], this.colors[2], this.colors[3]);
    }

    getBounds(out: Recta): void {
        out.copyFrom(this.rect);
    }

    setGradientVertical(top: Color32_ARGB, bottom: Color32_ARGB) {
        this.colors[0] = this.colors[1] = top;
        this.colors[2] = this.colors[3] = bottom;
    }

    setGradientHorizontal(left: Color32_ARGB, right: Color32_ARGB) {
        this.colors[0] = this.colors[3] = left;
        this.colors[1] = this.colors[2] = right;
    }
}

export const DisplayQuad = new ComponentTypeA(DisplayQuadComponent, Display2D);