import {Trail} from "./Trail";
import {Display2D, Display2DComponent} from "../display/Display2D";
import {Drawer} from "../../drawer/Drawer";
import {Sprite} from "../Sprite";
import {AssetRef} from "../../util/Resources";
import {SpriteFlag} from "@highduck/anijson";
import {Entity, EntityComponentType} from "../../ecs";

export class TrailRendererComponent extends Display2DComponent {
    sprite: AssetRef<Sprite> = AssetRef.NONE;

    constructor(readonly entity: Entity) {
        super();
    }

    draw(drawer: Drawer) {
        const trail = this.entity.get(Trail);
        const nodes = trail._nodes;
        const columns = nodes.count;
        const quads = columns - 1;
        const vertices = trail.vertices;
        if (quads > 0 && vertices.count > 0) {
            let rotated = false;
            if (this.sprite !== AssetRef.NONE) {
                const spriteData = this.sprite.data;
                if (spriteData !== null && spriteData.texture.data !== null) {
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
            let baseVertex = 0;

            // const uv = drawer.state.uv;
            // const u0 = rotated ? uv.x : uv.centerX;
            // const v0 = rotated ? uv.centerY : uv.y;
            // const u1 = rotated ? uv.right : uv.centerX;
            // const v1 = rotated ? uv.centerY : uv.bottom;
            const u0 = rotated ? 0 : 0.5;
            const v0 = rotated ? 0.5 : 0;
            const u1 = rotated ? 1 : 0.5;
            const v1 = rotated ? 0.5 : 1;
            for (let i = 0; i < columns; ++i) {
                const e0 = nodes.get(nodeIdx).energy;
                const cm0 = drawer.state.calcVertexColorMultiplierForAlpha(e0);
                const co = drawer.vertexColorOffset;
                // const cm0 = 0xFFFFFFFF;
                // const co = 0x0;
                drawer.writeVertex(vertices.get(v), vertices.get(v + 1), u0, v0, cm0, co);
                drawer.writeVertex(vertices.get(v + 2), vertices.get(v + 3), u1, v1, cm0, co);

                if (i < quads) {
                    drawer.writeQuadIndices(0, 2, 3, 1, baseVertex);
                }

                ++nodeIdx;
                baseVertex += 2;
                v += 4;
            }
        }
    }

    dispose() {
    }
}

export const TrailRenderer = new EntityComponentType(TrailRendererComponent, Display2D);