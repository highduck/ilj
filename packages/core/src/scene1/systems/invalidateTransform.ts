import {Transform2D, Transform2D_Data} from "../display/Transform2D";
import {Entity} from "../../ecs/Entity";
import {Color4, Matrix2D} from "@highduck/math";

const transformsMap = Transform2D.map;

export function invalidateTransform() {
    invalidateTransformNode(Entity.root, Transform2D_Data.IDENTITY);
}

function invalidateTransformNode(e: Entity, parent: Transform2D_Data) {
    let tr = transformsMap.get(e.index);
    if (tr !== undefined) {
        tr.buildLocalMatrix();
        Matrix2D.multiply(parent.worldMatrix, tr.matrix, tr.worldMatrix);
        Color4._combine(
            parent.worldColorMultiplier, parent.worldColorOffset,
            tr.colorMultiplier, tr.colorOffset,
            tr.worldColorMultiplier, tr.worldColorOffset
        );
        parent = tr;
    }

    let it = e.childFirst;
    while (it !== undefined) {
        invalidateTransformNode(it, parent);
        it = it.siblingNext;
    }
}

// export function invalidateTransform() {
//     const transforms = Engine.current.world.components(Transform2D)
//     for (let i = 0; i < transforms.length; ++i) {
//         transforms[i].buildLocalMatrix();
//     }
// }
//
// export function invalidateTransform() {
//     invalidateTransformSimple(Engine.current.root, Matrix2D.IDENTITY, Color4.ONE, Color4.ZERO);
// }
//
// export function invalidateTransform2() {
//     const map = Engine.current.world.ensure(Transform2D.TYPE_ID) as IntMap<Transform2D>;
//     invalidateTransformSimple2(map, Engine.current.root, Matrix2D.IDENTITY, Color4.ONE, Color4.ZERO);
// }

//
// function invalidateTransformSimple(e: Entity, parentWorldMatrix: Matrix2D, parentWorldColorMultiplier: Color4, parentWorldColorOffset: Color4) {
//     let tr = e.tryGet(Transform2D);
//     if (tr !== undefined) {
//         tr.buildLocalMatrix();
//         Matrix2D.mult(parentWorldMatrix, tr.matrix, tr.worldMatrix);
//         parentWorldMatrix = tr.worldMatrix;
//
//         const off = tr.colorOffset;
//         const mul = tr.colorMultiplier;
//         const woff = tr.worldColorOffset;
//         const wmul = tr.worldColorMultiplier;
//
//         woff.r = off.r * parentWorldColorMultiplier.r + parentWorldColorOffset.r;
//         woff.g = off.g * parentWorldColorMultiplier.g + parentWorldColorOffset.g;
//         woff.b = off.b * parentWorldColorMultiplier.b + parentWorldColorOffset.b;
//         woff.a = off.a + parentWorldColorOffset.a;
//         wmul.r = parentWorldColorMultiplier.r * mul.r;
//         wmul.g = parentWorldColorMultiplier.g * mul.g;
//         wmul.b = parentWorldColorMultiplier.b * mul.b;
//         wmul.a = parentWorldColorMultiplier.a * mul.a;
//
//         parentWorldColorMultiplier = wmul;
//         parentWorldColorOffset = woff;
//     }
//
//     let it = e.childFirst;
//     while (it !== undefined) {
//         invalidateTransformSimple(it, parentWorldMatrix, parentWorldColorMultiplier, parentWorldColorOffset);
//         it = it.siblingNext;
//     }
// }
//
// function invalidateTransformSimple2(map: IntMap<Transform2D>, e: Entity, parentWorldMatrix: Matrix2D, parentWorldColorMultiplier: Color4, parentWorldColorOffset: Color4) {
//     let tr = map.get(e.passport & 0xFFFFF);
//     if (tr !== undefined) {
//         tr.buildLocalMatrix();
//         Matrix2D.mult(parentWorldMatrix, tr.matrix, tr.worldMatrix);
//         parentWorldMatrix = tr.worldMatrix;
//
//         const off = tr.colorOffset;
//         const mul = tr.colorMultiplier;
//         const woff = tr.worldColorOffset;
//         const wmul = tr.worldColorMultiplier;
//
//         woff.r = off.r * parentWorldColorMultiplier.r + parentWorldColorOffset.r;
//         woff.g = off.g * parentWorldColorMultiplier.g + parentWorldColorOffset.g;
//         woff.b = off.b * parentWorldColorMultiplier.b + parentWorldColorOffset.b;
//         woff.a = off.a + parentWorldColorOffset.a;
//         wmul.r = parentWorldColorMultiplier.r * mul.r;
//         wmul.g = parentWorldColorMultiplier.g * mul.g;
//         wmul.b = parentWorldColorMultiplier.b * mul.b;
//         wmul.a = parentWorldColorMultiplier.a * mul.a;
//
//         parentWorldColorMultiplier = wmul;
//         parentWorldColorOffset = woff;
//     }
//
//     let it = e.childFirst;
//     while (it !== undefined) {
//         invalidateTransformSimple2(map, it, parentWorldMatrix, parentWorldColorMultiplier, parentWorldColorOffset);
//         it = it.siblingNext;
//     }
// }


//
// export function invalidateTransformLinear(e: Entity) {
//     let current = e.childFirst;
//     let prev = e;
//     let parentTransform = Transform2D.IDENTITY;
//     while (current !== undefined) {
//
//         // if (depth === max_depth) {
//         //     //yield current and his siblings;
//         //     prev = current;
//         //     current = current.parent;
//         //     --depth;
//         // } else
//         if (current.childFirst !== undefined && (prev === current.parent || prev === current.siblingPrev)) {
//             prev = current;
//             current = current.childFirst;
//
//             const pt = prev.tryGet(Transform2D);
//             if (pt !== undefined) {
//                 parentMatrix = pt.worldMatrix;
//             }
//
//             const t = current.tryGet(Transform2D);
//             if (t !== undefined) {
//                 t.buildLocalMatrix();
//                 Matrix2D.mult(parentMatrix, t.matrix, t.worldMatrix);
//             }
//
//             // this.enterNode(current);
//         } else if (current.siblingNext !== undefined) {
//             // at this point, we know prev is a child of current
//             // this.exitNode(current);
//             prev = current;
//             current = current.siblingNext;
//
//             const t = current.tryGet(Transform2D);
//             if (t !== undefined) {
//                 t.buildLocalMatrix();
//                 Matrix2D.mult(parentMatrix, t.matrix, t.worldMatrix);
//             }
//
//             //this.enterNode(current);
//         } else {
//             // exhausted the parent's children
//             // this.exitNode(current);
//             prev = current;
//             current = current.parent;
//         }
//     }
// }