import {Entity} from "../../ecs";
import {Display2D} from "./Display2D";
import {Transform2D} from "./Transform2D";
import {Recta, Vec2} from "@highduck/math";
import {Bounds2D} from "./Bounds2D";

const TMP_V2 = new Vec2();

const displayMap = Display2D.map;
const transformMap = Transform2D.map;
const boundsMap = Bounds2D.map;
const RECT_TMP = new Recta();

// x, y - coordinates in parent space
export function hitTest(e: Entity, x: number, y: number): Entity | null {
    if (!(e.visible && e.touchable)) {
        return null;
    }

    let lx = x;
    let ly = y;
    const transform = transformMap.get(e.index);
    if (transform !== undefined) {
        TMP_V2.x = lx;
        TMP_V2.y = ly;
        transform.matrix.transformInverseWith(TMP_V2);
        lx = TMP_V2.x;
        ly = TMP_V2.y;

        if (transform.flagScissors && !transform.scissors.contains(lx, ly)) {
            return null;
        }

        if (transform.flagHitArea) {
            return transform.hitArea.contains(lx, ly) ? e : null;
        }

        const bounds = boundsMap.get(e.index);
        if (bounds !== undefined && !bounds.contains(lx, ly)) {
            return null;
        }
    }

    let it = e.childLast;
    while (it !== null) {
        const hit = hitTest(it, lx, ly);
        if (hit !== null) {
            return hit;
        }
        it = it.siblingPrev;
    }

    const display = displayMap.get(e.index);
    if (display !== undefined) {
        display.getBounds(RECT_TMP);
        if (RECT_TMP.contains(lx, ly)) {
            // TODO pixel test
            return e;
        }
    }

    return null;
}

//
// const HitTargetsVector:number[] = [];
//
// export function populateHitTargets(e: Entity) {
//     if (!(e.visible && e.touchable)) {
//         return;
//     }
//
//     const transform = transformMap.get(e.index);
//     if (transform !== undefined) {
//         TMP_V2.x = x;
//         TMP_V2.y = y;
//         transform.matrix.transformInverseWith(TMP_V2);
//         x = TMP_V2.x;
//         y = TMP_V2.y;
//
//         if (transform.flagScissors && !transform.scissors.contains(x, y)) {
//             return null;
//         }
//
//         if (transform.flagHitArea) {
//             return transform.hitArea.contains(x, y) ? e : null;
//         }
//
//         const bounds = boundsMap.get(e.index);
//         if (bounds !== undefined && !bounds.contains(x, y)) {
//             return null;
//         }
//     }
//
//     let it = e.childLast;
//     while (it !== null) {
//         const hit = hitTest(it, x, y);
//         if (hit !== null) {
//             return hit;
//         }
//         it = it.siblingPrev;
//     }
//
//     const display = displayMap.get(e.index);
//     if (display !== undefined && display.hitTest(x, y)) {
//         return e;
//     }
//
//     return null;
// }