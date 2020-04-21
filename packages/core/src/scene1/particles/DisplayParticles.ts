import {ParticleLayer} from "./ParticleLayer";
import {declTypeID} from "../../util/TypeID";
import {Display2D} from "../display/Display2D";
import {Drawer} from "../../drawer/Drawer";

export class DisplayParticles extends Display2D {
    static TYPE_ID = declTypeID(Display2D);

    draw(drawer: Drawer) {
        const layer = this.entity.tryGet(ParticleLayer);
        if (layer) {
            if (layer.cycled) {
                for (const p of layer.particles) {
                    p.drawCycled(drawer);
                }
            } else {
                for (const p of layer.particles) {
                    p.draw(drawer, 0);
                }
            }
        }
    }
}