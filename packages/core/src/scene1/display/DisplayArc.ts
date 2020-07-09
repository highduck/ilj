import {Display2D} from "./Display2D";
import {Color32_ARGB, Rect} from "@highduck/math";
import {Drawer} from "../../drawer/Drawer";
import {Sprite} from "../Sprite";
import {declTypeID} from "../../util/TypeID";
import {Resources} from "../../util/Resources";

const TEMP_RECT = new Rect();

export class DisplayArc extends Display2D {
    static TYPE_ID = declTypeID(Display2D);

    angle0 = 0;
    angle1 = 2 * Math.PI;
    radius = 10;
    lineWidth = 10;
    segments = 50;
    colorInner: Color32_ARGB = 0xFFFFFFFF;
    colorOuter: Color32_ARGB = 0xFFFFFFFF;
    sprite?: string = undefined;

    constructor() {
        super();
    }

    draw(drawer: Drawer) {
        if (this.sprite) {
            const spr = Resources.get(Sprite, this.sprite).data;
            if (spr && spr.texture.data) {
                TEMP_RECT.set(spr.tex.centerX, spr.tex.y, 0, spr.tex.height);
                drawer.state.setTextureRegion(spr.texture.data, TEMP_RECT);
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

    getBounds(out: Rect): Rect {
        const s = this.radius + this.lineWidth;
        out.set(-s, -s, 2 * s, 2 * s);
        return out;
    }
}