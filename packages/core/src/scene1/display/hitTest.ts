import {Entity, Transform2D, Transform2D_Data} from "../..";
import {Display2D, Display2DComponent} from "./Display2D";
import {Vec2} from "@highduck/math";

const TMP_V2 = new Vec2();
const Display2D_ID = Display2D.id;

// x, y - coordinates in parent space
export function hitTest(e: Entity, x: number, y: number): Entity | undefined {
    if (!e.visible || !e.touchable) {
        return undefined;
    }

    const transform = e.components.get(Transform2D.id) as (Transform2D_Data | undefined);
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
    }

    let it = e.childLast;
    while (it !== undefined) {
        const hit = hitTest(it, x, y);
        if (hit !== undefined) {
            return hit;
        }
        it = it.siblingPrev;
    }

    const display = e.components.get(Display2D_ID) as Display2DComponent | undefined;
    if (display !== undefined && display.hitTest(x, y)) {
        return e;
    }

    return undefined;
}