import {Entity} from "../../ecs";
import {Display2D} from "./Display2D";
import {Transform2D} from "./Transform2D";
import {Vec2} from "@highduck/math";
import {Bounds2D} from "./Bounds2D";

const TMP_V2 = new Vec2();

const displayMap = Display2D.map;
const transformMap = Transform2D.map;
const boundsMap = Bounds2D.map;

// x, y - coordinates in parent space
export function hitTest(e: Entity, x: number, y: number): Entity | undefined {
    if (!e.visible || !e.touchable) {
        return undefined;
    }

    const transform = transformMap.get(e.index);
    if (transform !== undefined) {
        TMP_V2.x = x;
        TMP_V2.y = y;
        transform.matrix.transformInverseWith(TMP_V2);
        x = TMP_V2.x;
        y = TMP_V2.y;

        if (transform.scissors !== undefined && !transform.scissors.contains(x, y)) {
            return undefined;
        }

        if (transform.hitArea !== undefined) {
            return transform.hitArea.contains(x, y) ? e : undefined;
        }

        const bounds = boundsMap.get(e.index);
        if (bounds !== undefined && !bounds.contains(x, y)) {
            return undefined;
        }
    }

    let it = e.childLast;
    while (it !== undefined) {
        const hit = hitTest(it, x, y);
        if (hit !== undefined) {
            return hit;
        }
        it = it.siblingPrev;
    }

    const display = displayMap.get(e.index);
    if (display !== undefined && display.hitTest(x, y)) {
        return e;
    }

    return undefined;
}