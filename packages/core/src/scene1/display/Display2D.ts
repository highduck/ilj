import {Rect} from "@highduck/math";
import {Drawer} from "../../drawer/Drawer";
import {declTypeID} from "../../util/TypeID";
import {Entity} from "../../ecs/Entity";
import {Component} from "../..";

const RECT_TMP = new Rect();

/* eslint-disable @typescript-eslint/no-unused-vars */
export class Display2D extends Component() {
    draw(drawer: Drawer): void {

    }

    hitTest(x: number, y: number): boolean {
        return this.getBounds(RECT_TMP).contains(x, y);
    }

    getBounds(out: Rect): Rect {
        return out.set(0, 0, 0, 0);
    }
}