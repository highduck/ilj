import {ParticleLayer} from "./ParticleLayer";
import {Display2D, Display2DComponent} from "../display/Display2D";
import {Drawer} from "../../drawer/Drawer";
import {ComponentTypeA, Entity} from "../..";

export class ParticleRendererComponent extends Display2DComponent {
    readonly entity!: Entity;

    constructor() {
        super();
    }

    draw(drawer: Drawer) {
        const layer = this.entity.tryGet(ParticleLayer);
        if (layer) {
            const arr = layer.particles.primary;
            if (layer.cycled) {
                for (let i = 0, e = arr.length; i < e; ++i) {
                    arr[i].drawCycled(drawer);
                }
            } else {
                for (let i = 0, e = arr.length; i < e; ++i) {
                    arr[i].draw(drawer, 0);
                }
            }
        }
    }
}

export const ParticleRenderer = new ComponentTypeA(ParticleRendererComponent, Display2D);