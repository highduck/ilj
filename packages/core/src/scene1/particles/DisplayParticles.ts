import {ParticleLayer} from "./ParticleLayer";
import {declTypeID} from "../../util/TypeID";
import {Display2D} from "../display/Display2D";
import {Drawer} from "../../drawer/Drawer";

export class DisplayParticles extends Display2D {
    static TYPE_ID = declTypeID(Display2D);

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