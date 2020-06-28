import {Vec2} from "./Vec2";
import {Rot} from "./Rot";
import {Transform} from "./Transform";

/**
 * @prop {Vec2} c location
 * @prop {float} a angle
 */
export class Position {
    readonly c = Vec2.zero();
    a = 0.0;

    getTransform(xf: Transform, p: Vec2) {
        xf.q.setAngle(this.a);
        xf.p.copyFrom(Vec2.sub(this.c, Rot.mulVec2(xf.q, p)));
        return xf;
    }
}