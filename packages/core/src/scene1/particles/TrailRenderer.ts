import {declTypeID} from "../../util/TypeID";
import {Trail} from "./Trail";
import {Display2D} from "../display/Display2D";
import {Drawer} from "../../drawer/Drawer";
import {Sprite} from "../Sprite";
import {AssetRef} from "../../util/Resources";
import {SpriteFlag} from "@highduck/anijson";

export class TrailRenderer extends Display2D {
    static TYPE_ID = declTypeID(Display2D);

    sprite?: AssetRef<Sprite>;

    draw(drawer: Drawer) {
        const trail = this.entity.get(Trail);
        const nodes = trail._nodes;
        const vx = trail.vx;
        const vy = trail.vy;
        const columns = nodes.length;
        const quads = columns - 1;
        if (quads > 0 && vx.length > 0) {
            let rotated = false;
            if (this.sprite !== undefined) {
                const spriteData = this.sprite.data;
                if (spriteData !== undefined && spriteData.texture.data !== undefined) {
                    drawer.state.setTextureRegion(spriteData.texture.data, spriteData.tex);
                    rotated = (spriteData.flags & SpriteFlag.Rotated) !== 0;
                } else {
                    // Nothing to draw yet
                    return;
                }
            } else {
                drawer.state.setEmptyTexture();
            }
            drawer.prepare();
            drawer.triangles(columns * 2, quads * 6);

            let v = 0;
            let nodeIdx = 0;

            const uv = drawer.state.uv;
            // const u0 = rotated ? uv.x : uv.centerX;
            // const v0 = rotated ? uv.centerY : uv.y;
            // const u1 = rotated ? uv.right : uv.centerX;
            // const v1 = rotated ? uv.centerY : uv.bottom;
            const u0 = rotated ? 0 : 0.5;
            const v0 = rotated ? 0.5 : 0;
            const u1 = rotated ? 1 : 0.5;
            const v1 = rotated ? 0.5 : 1;
            for (let i = 0; i < columns; ++i) {
                const e0 = nodes[nodeIdx].energy;
                const cm0 = drawer.state.calcVertexColorMultiplierForAlpha(e0);
                const co = drawer.vertexColorOffset;
                // const cm0 = 0xFFFFFFFF;
                // const co = 0x0;
                drawer.writeVertex(vx[v], vy[v], u0, v0, cm0, co);
                drawer.writeVertex(vx[v + 1], vy[v + 1], u1, v1, cm0, co);

                if (i < quads) {
                    drawer.writeQuadIndices(0, 2, 3, 1, v);
                }

                v += 2;
                ++nodeIdx;
            }
        }
    }
}