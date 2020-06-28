import {Vec2} from './common/Vec2';

/**
 * @typedef {Object} MassData This holds the mass data computed for a shape.
 *
 * @prop mass The mass of the shape, usually in kilograms.
 * @prop center The position of the shape's centroid relative to the shape's
 *       origin.
 * @prop I The rotational inertia of the shape about the local origin.
 */
export class MassData {
    mass = 0;
    readonly center = new Vec2(0.0, 0.0);
    I = 0;
}