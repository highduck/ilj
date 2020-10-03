import {ParticleLayer} from "./ParticleLayer";
import {Display2D, Display2DComponent} from "../display/Display2D";
import {Drawer} from "../../drawer/Drawer";
import {EntityComponentType, Entity} from "../../ecs";
import {Color4, Matrix2D} from "@highduck/math";

const s_matrix = new Matrix2D();
const s_colorMultiplier = new Color4();
const s_colorOffset = new Color4();

export class ParticleRendererComponent extends Display2DComponent {
    constructor(readonly entity: Entity) {
        super();
    }

    draw(drawer: Drawer) {
        const layer = this.entity.tryGet(ParticleLayer);
        if (layer) {
            s_matrix.copyFrom(drawer.state.matrix);
            s_colorMultiplier.copyFrom(drawer.state.colorMultiplier);
            s_colorOffset.copyFrom(drawer.state.colorOffset);
            drawer.state.saveTransform();
            const arr = layer.particles.primary;
            const len = layer.particles.length;
            if (layer.cycled) {
                for (let i = 0; i < len; ++i) {
                    arr[i].drawCycled(s_matrix, s_colorMultiplier, s_colorOffset, drawer);
                }
            } else {
                for (let i = 0; i < len; ++i) {
                    arr[i].draw(s_matrix, s_colorMultiplier, s_colorOffset, drawer, 0);
                }
            }
            drawer.state.restoreTransform();
        }
    }

    dispose() {

    }
}

export const ParticleRenderer = new EntityComponentType(ParticleRendererComponent, Display2D);