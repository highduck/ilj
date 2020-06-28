import {Vec2} from "../common/Vec2";

export interface RayCastInput {
    p1: Vec2;
    p2: Vec2;
    maxFraction: number;
}

export interface RayCastOutput {
    normal: Vec2;
    fraction: number;
}