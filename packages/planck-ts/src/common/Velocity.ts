import {Vec2} from "./Vec2";

/**
 * @prop {Vec2} v linear
 * @prop {float} w angular
 */
export class Velocity {
    readonly v = Vec2.zero();
    w = 0.0;
}