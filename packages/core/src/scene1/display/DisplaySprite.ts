import {Drawer} from "../../drawer/Drawer";
import {Recta, Vec2} from "@highduck/math";
import {AssetRef} from "../../util/Resources";
import {Sprite} from "../Sprite";
import {Display2D, Display2DComponent} from "./Display2D";
import {SpriteFlag} from "@highduck/anijson";
import {ComponentTypeA} from "../../ecs";

const TMP_RC = new Recta();

const nine_patch_indices = new Uint16Array([
    0, 1, 5, 5, 4, 0,
    1, 1 + 1, 1 + 5, 1 + 5, 1 + 4, 1,
    2, 2 + 1, 2 + 5, 2 + 5, 2 + 4, 2,
    4, 4 + 1, 4 + 5, 4 + 5, 4 + 4, 4,
    5, 5 + 1, 5 + 5, 5 + 5, 5 + 4, 5,
    6, 6 + 1, 6 + 5, 6 + 5, 6 + 4, 6,
    8, 8 + 1, 8 + 5, 8 + 5, 8 + 4, 8,
    9, 9 + 1, 9 + 5, 9 + 5, 9 + 4, 9,
    10, 10 + 1, 10 + 5, 10 + 5, 10 + 4, 10
]);

function drawGrid(drawer: Drawer, rect: Recta, grid: Recta, target: Recta, inNormalUV: boolean) {
    const x = rect.x;
    const y = rect.y;
    const width = rect.width;
    const height = rect.height;
    const tx = target.x;
    const ty = target.y;
    const tw = target.width;
    const th = target.height;

    const x0 = tx;
    const x1 = tx + grid.x - x;
    const x2 = tx + tw - ((x + width) - grid.right);
    const x3 = tx + tw;

    const y0 = ty;
    const y1 = ty + grid.y - y;
    const y2 = ty + th - ((y + height) - grid.bottom);
    const y3 = ty + th;

    // const uv = TEMP_UV.copyFrom(drawer.state.uv);
    // drawer.state.uv.set(0, 0, 1, 1);

    // let u0 = uv.x;
    // let u1 = uv.x + uv.width * (grid.x - x) / width;
    // let u2 = uv.right - uv.width * (((x + width) - grid.right) / width);
    // let u3 = uv.right;
    //
    // let v0 = uv.y;
    // let v1 = uv.y + uv.height * (grid.y - y) / height;
    // let v2 = uv.bottom - uv.height * (((y + height) - grid.bottom) / height);
    // let v3 = uv.bottom;
    const u0 = 0;
    const u1 = (grid.x - x) / width;
    const u2 = 1 - (((x + width) - grid.right) / width);
    const u3 = 1;

    const v0 = 0;
    const v1 = (grid.y - y) / height;
    const v2 = 1 - (((y + height) - grid.bottom) / height);
    const v3 = 1;

    drawer.prepare();
    drawer.triangles(4 * 4, nine_patch_indices.length);
    const cm = drawer.vertexColorMultiplier;
    const co = drawer.vertexColorOffset;
    /////
    if (inNormalUV) {
        drawer.writeVertex(x0, y0, u0, v0, cm, co);
        drawer.writeVertex(x1, y0, u1, v0, cm, co);
        drawer.writeVertex(x2, y0, u2, v0, cm, co);
        drawer.writeVertex(x3, y0, u3, v0, cm, co);

        drawer.writeVertex(x0, y1, u0, v1, cm, co);
        drawer.writeVertex(x1, y1, u1, v1, cm, co);
        drawer.writeVertex(x2, y1, u2, v1, cm, co);
        drawer.writeVertex(x3, y1, u3, v1, cm, co);

        drawer.writeVertex(x0, y2, u0, v2, cm, co);
        drawer.writeVertex(x1, y2, u1, v2, cm, co);
        drawer.writeVertex(x2, y2, u2, v2, cm, co);
        drawer.writeVertex(x3, y2, u3, v2, cm, co);

        drawer.writeVertex(x0, y3, u0, v3, cm, co);
        drawer.writeVertex(x1, y3, u1, v3, cm, co);
        drawer.writeVertex(x2, y3, u2, v3, cm, co);
        drawer.writeVertex(x3, y3, u3, v3, cm, co);
    } else {
        drawer.writeVertex(x0, y0, u0, v0, cm, co);
        drawer.writeVertex(x1, y0, u0, v1, cm, co);
        drawer.writeVertex(x2, y0, u0, v2, cm, co);
        drawer.writeVertex(x3, y0, u0, v3, cm, co);

        drawer.writeVertex(x0, y1, u1, v0, cm, co);
        drawer.writeVertex(x1, y1, u1, v1, cm, co);
        drawer.writeVertex(x2, y1, u1, v2, cm, co);
        drawer.writeVertex(x3, y1, u1, v3, cm, co);

        drawer.writeVertex(x0, y2, u2, v0, cm, co);
        drawer.writeVertex(x1, y2, u2, v1, cm, co);
        drawer.writeVertex(x2, y2, u2, v2, cm, co);
        drawer.writeVertex(x3, y2, u2, v3, cm, co);

        drawer.writeVertex(x0, y3, u3, v0, cm, co);
        drawer.writeVertex(x1, y3, u3, v1, cm, co);
        drawer.writeVertex(x2, y3, u3, v2, cm, co);
        drawer.writeVertex(x3, y3, u3, v3, cm, co);
    }

    drawer.writeIndices(nine_patch_indices);
}

export class DisplaySpriteComponent extends Display2DComponent {
    sprite: AssetRef<Sprite> = AssetRef.NONE;
    scaleGrid: Recta | null = null;
    readonly scale = new Vec2(1.0, 1.0);
    manualTarget: Recta | null = null;

    constructor() {
        super();
    }

    draw(drawer: Drawer) {
        const spr = this.sprite.data;
        if (spr === null || spr.texture.data === null) {
            return;
        }

        drawer.state
            .setTexture(spr.texture.data)
            .setTextureCoordsRect(spr.tex);

        if (this.scaleGrid) {
            drawer.state.saveMatrix().scale(1.0 / this.scale.x, 1.0 / this.scale.y);
            let target = this.manualTarget;
            if (!target) {
                target = TMP_RC
                    .set(spr.rect.x + 1, spr.rect.y + 1, spr.rect.width - 2, spr.rect.height - 2)
                    .scale(this.scale.x, this.scale.y);
            }

            /*#__NOINLINE__*/
            drawGrid(drawer, spr.rect, this.scaleGrid, target, (spr.flags & SpriteFlag.Rotated) === 0);
            drawer.state.restoreMatrix();
        } else {
            drawer.quadFast(spr.rect.x, spr.rect.y, spr.rect.width, spr.rect.height,
                (spr.flags & SpriteFlag.Rotated) === 0);
        }
    }

    getBounds(out: Recta): void {
        const spr = this.sprite.data;
        if (spr !== null) {
            out.copyFrom(spr.rect);
            if (this.scaleGrid !== null) {
                out.expand(1.0, 1.0);
            }
        } else {
            out.set(0.0, 0.0, 0.0, 0.0);
        }
    }
}

export const DisplaySprite = new ComponentTypeA(DisplaySpriteComponent, Display2D);