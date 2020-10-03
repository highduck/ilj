import {Display2D, Display2DComponent} from "./Display2D";
import {Recta, Color32_ARGB} from "@highduck/math";
import {Drawer} from "../../drawer/Drawer";
import {Sprite} from "../Sprite";
import {ComponentTypeA} from "../../ecs";
import {AssetRef} from "../../util/Resources";

export class DisplayArcComponent extends Display2DComponent {
    angle0 = NaN;
    angle1 = NaN;
    radius = NaN;
    lineWidth = NaN;
    segments = NaN;
    colorInner: Color32_ARGB = 0xFFFFFFFF;
    colorOuter: Color32_ARGB = 0xFFFFFFFF;
    sprite: AssetRef<Sprite> = AssetRef.NONE;

    constructor() {
        super();

        this.angle0 = 0.0;
        this.angle1 = 2.0 * Math.PI;
        this.radius = 10.0;
        this.lineWidth = 10.0;
        this.segments = 50.0;
    }

    draw(drawer: Drawer) {
        const spr = this.sprite.data;
        if (spr) {
            if (spr.texture.data) {
                drawer.state.setTexture(spr.texture.data)
                    .setTextureCoords(spr.tex.centerX, spr.tex.y, 0.0, spr.tex.height)
            }
        } else {
            drawer.state.setEmptyTexture();
        }

        const off = -0.5 * Math.PI;
        drawer.lineArc(
            0, 0,
            this.radius,
            this.angle0 + off,
            this.angle1 + off,
            this.lineWidth,
            this.segments,
            this.colorInner,
            this.colorOuter
        );
    }

    getBounds(out: Recta): void {
        const s = this.radius + this.lineWidth;
        out.set(-s, -s, 2 * s, 2 * s);
    }
}

export const DisplayArc = new ComponentTypeA(DisplayArcComponent, Display2D);