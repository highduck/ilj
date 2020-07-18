import {Rect} from "@highduck/math";
import {Drawer} from "../../drawer/Drawer";
import {ComponentTypeA} from "../../ecs";

const RECT_TMP = new Rect();

/* eslint-disable @typescript-eslint/no-unused-vars */
export class Display2DComponent {
    draw(drawer: Drawer): void {
    }

    hitTest(x: number, y: number): boolean {
        return this.getBounds(RECT_TMP).contains(x, y);
    }

    getBounds(out: Rect): Rect {
        return out.set(0, 0, 0, 0);
    }
}

export const Display2D = new ComponentTypeA(Display2DComponent);