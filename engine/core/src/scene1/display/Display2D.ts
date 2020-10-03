import {Recta} from "@highduck/math";
import {Drawer} from "../../drawer/Drawer";
import {ComponentTypeA} from "../../ecs";

/* eslint-disable @typescript-eslint/no-unused-vars */
export class Display2DComponent {
    draw(drawer: Drawer): void {
    }

    getBounds(out: Recta): void {
        out.set(0.0, 0.0, 0.0, 0.0);
    }
}

export const Display2D = new ComponentTypeA(Display2DComponent);