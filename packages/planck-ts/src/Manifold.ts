import {Vec2} from "./common/Vec2";
import {Transform} from "./common/Transform";
import {Rot} from "./common/Rot";
import {MathUtil} from "./common/Math";

export const enum ManifoldType {
    e_circles = 0,
    e_faceA = 1,
    e_faceB = 2
}

export const enum ContactFeatureType {
    e_vertex = 0,
    e_face = 1
}

/**
 * A manifold point is a contact point belonging to a contact manifold. It holds
 * details related to the geometry and dynamics of the contact points.
 *
 * This structure is stored across time steps, so we keep it small.
 *
 * Note: impulses are used for internal caching and may not provide reliable
 * contact forces, especially for high speed collisions.
 *
 * @prop {Vec2} localPoint Usage depends on manifold type:<br>
 *       e_circles: the local center of circleB<br>
 *       e_faceA: the local center of cirlceB or the clip point of polygonB<br>
 *       e_faceB: the clip point of polygonA.
 * @prop normalImpulse The non-penetration impulse
 * @prop tangentImpulse The friction impulse
 * @prop {ContactID} id Uniquely identifies a contact point between two shapes
 *       to facilatate warm starting
 */
export class ManifoldPoint {
    readonly localPoint = new Vec2(0, 0);
    normalImpulse = 0;
    tangentImpulse = 0;
    readonly cf = new ContactFeature();
}


/**
 * A manifold for two touching convex shapes. Manifolds are created in `evaluate`
 * method of Contact subclasses.
 *
 * Supported manifold types are e_faceA or e_faceB for clip point versus plane
 * with radius and e_circles point versus point with radius.
 *
 * We store contacts in this way so that position correction can account for
 * movement, which is critical for continuous physics. All contact scenarios
 * must be expressed in one of these types. This structure is stored across time
 * steps, so we keep it small.
 *
 * @prop type e_circle, e_faceA, e_faceB
 * @prop localPoint Usage depends on manifold type:<br>
 *       e_circles: the local center of circleA <br>
 *       e_faceA: the center of faceA <br>
 *       e_faceB: the center of faceB
 * @prop localNormal Usage depends on manifold type:<br>
 *       e_circles: not used <br>
 *       e_faceA: the normal on polygonA <br>
 *       e_faceB: the normal on polygonB
 * @prop points The points of contact {ManifoldPoint[]}
 * @prop pointCount The number of manifold points
 */
export class Manifold {
    type = ManifoldType.e_circles
    readonly localNormal = Vec2.zero();
    readonly localPoint = Vec2.zero();
    readonly points = [new ManifoldPoint(), new ManifoldPoint()];
    pointCount = 0;

    constructor() {

    }

    /**
     * Evaluate the manifold with supplied transforms. This assumes modest motion
     * from the original state. This does not change the point count, impulses, etc.
     * The radii must come from the shapes that generated the manifold.
     */
    getWorldManifold(wm: WorldManifold, xfA: Transform, radiusA: number, xfB: Transform, radiusB: number) {
        if (this.pointCount === 0) {
            return;
        }

        const normal = wm.normal;
        const points = wm.points;
        const separations = wm.separations;

        // TODO: improve
        if (this.type === ManifoldType.e_circles) {
            normal.set(1, 0);
            const pointA = Transform.mulVec2(xfA, this.localPoint);
            const pointB = Transform.mulVec2(xfB, this.points[0].localPoint);
            const dist = Vec2.sub(pointB, pointA);
            if (Vec2.lengthSquared(dist) > MathUtil.SQUARED_EPSILON) {
                normal.copyFrom(dist);
                normal.normalize();
            }
            const cA = pointA.clone().addMul(radiusA, normal);
            const cB = pointB.clone().addMul(-radiusB, normal);
            points[0] = Vec2.mid(cA, cB);
            separations[0] = Vec2.dot(Vec2.sub(cB, cA), normal);
            points.length = 1;
            separations.length = 1;
        } else if (this.type === ManifoldType.e_faceA) {
            Rot._mulVec2(xfA.q, this.localNormal, normal);
            const planePoint = Transform.mulVec2(xfA, this.localPoint);

            for (let i = 0; i < this.pointCount; ++i) {
                const clipPoint = Transform.mulVec2(xfB, this.points[i].localPoint);
                const cA = Vec2.clone(clipPoint).addMul(radiusA - Vec2.dot(Vec2.sub(clipPoint, planePoint), normal), normal);
                const cB = Vec2.clone(clipPoint).subMul(radiusB, normal);
                points[i] = Vec2.mid(cA, cB);
                separations[i] = Vec2.dot(Vec2.sub(cB, cA), normal);
            }
            points.length = this.pointCount;
            separations.length = this.pointCount;
        } else if (this.type === ManifoldType.e_faceB) {
            Rot._mulVec2(xfB.q, this.localNormal, normal);
            const planePoint = Transform.mulVec2(xfB, this.localPoint);

            for (let i = 0; i < this.pointCount; ++i) {
                const clipPoint = Transform.mulVec2(xfA, this.points[i].localPoint);
                const cB = Vec2.combine(1, clipPoint, radiusB - Vec2.dot(Vec2.sub(clipPoint, planePoint), normal), normal);
                const cA = Vec2.combine(1, clipPoint, -radiusA, normal);
                points[i] = Vec2.mid(cA, cB);
                separations[i] = Vec2.dot(Vec2.sub(cA, cB), normal);
            }
            points.length = this.pointCount;
            separations.length = this.pointCount;
            // Ensure normal points from A to B.
            normal.mul(-1);
        }
        // mod by ref
        // wm.normal = normal;
        // wm.points = points;
        // wm.separations = separations;
    }
}

/**
 * The features that intersect to form the contact point.
 *
 * @prop indexA Feature index on shapeA
 * @prop indexB Feature index on shapeB
 * @prop typeA The feature type on shapeA
 * @prop typeB The feature type on shapeB
 */
class ContactFeature {
    indexA = 0;
    indexB = 0;
    typeA = ContactFeatureType.e_face;
    typeB = ContactFeatureType.e_face;

    copyFrom(o: ContactFeature) {
        this.indexA = o.indexA;
        this.indexB = o.indexB;
        this.typeA = o.typeA;
        this.typeB = o.typeB;
    }

    get key(): number {
        // TODO: cache value
        return this.indexA + this.indexB * 4 + this.typeA * 16 + this.typeB * 64;
    }
}

/**
 * This is used to compute the current state of a contact manifold.
 *
 * @prop normal World vector pointing from A to B
 * @prop points World contact point (point of intersection)
 * @prop separations A negative value indicates overlap, in meters
 */
export class WorldManifold {
    normal = new Vec2(0, 0);
    points: Vec2[] = []; // [maxManifoldPoints]
    separations: number[] = []; // float[maxManifoldPoints]

    reset() {
        this.points.length = 0;
        this.separations.length = 0;
        this.normal.set(0, 0);
    }
}

/**
 * This is used for determining the state of contact points.
 *
 * @prop {0} nullState Point does not exist
 * @prop {1} addState Point was added in the update
 * @prop {2} persistState Point persisted across the update
 * @prop {3} removeState Point was removed in the update
 */
const enum PointState {
    nullState = 0,
    addState = 1,
    persistState = 2,
    removeState = 3
}

/**
 * Compute the point states given two manifolds. The states pertain to the
 * transition from manifold1 to manifold2. So state1 is either persist or remove
 * while state2 is either add or persist.
 */
function getPointStates(state1: PointState[/*Settings.maxManifoldPoints*/],
                        state2: PointState[/*Settings.maxManifoldPoints*/],
                        manifold1: Manifold,
                        manifold2: Manifold) {
    // for (var i = 0; i < Settings.maxManifoldPoints; ++i) {
    // state1[i] = PointState.nullState;
    // state2[i] = PointState.nullState;
    // }

    // Detect persists and removes.
    for (let i = 0; i < manifold1.pointCount; ++i) {
        const contactID = manifold1.points[i].cf.key;
        state1[i] = PointState.removeState;
        for (let j = 0; j < manifold2.pointCount; ++j) {
            if (manifold2.points[j].cf.key == contactID) {
                state1[i] = PointState.persistState;
                break;
            }
        }
    }

    // Detect persists and adds.
    for (let i = 0; i < manifold2.pointCount; ++i) {
        const contactID = manifold2.points[i].cf.key;
        state2[i] = PointState.addState;
        for (let j = 0; j < manifold1.pointCount; ++j) {
            if (manifold1.points[j].cf.key === contactID) {
                state2[i] = PointState.persistState;
                break;
            }
        }
    }
}

/**
 * Used for computing contact manifolds.
 *
 * @prop {Vec2} v
 * @prop {ContactID} id
 */
export class ClipVertex {
    readonly v = new Vec2(0, 0);
    readonly cf = new ContactFeature();

    copyFrom(o: ClipVertex) {
        this.v.copyFrom(o.v);
        this.cf.copyFrom(o.cf);
    }
}

export type ClipVertexPair = [ClipVertex, ClipVertex];
//
// export const ClipVertexPool = new Pool<ClipVertexPair>({
//     create(): ClipVertexPair {
//         return [new ClipVertex(), new ClipVertex()]
//     }
// })

/**
 * Clipping for contact manifolds. Sutherland-Hodgman clipping.
 *
 * @param {ClipVertex[2]} vOut
 * @param {ClipVertex[2]} vIn
 */
export function clipSegmentToLine(vOut: ClipVertexPair,
                                  vIn: ClipVertexPair,
                                  normal: Vec2,
                                  offset: number,
                                  vertexIndexA: number): number {
    // Start with no output points
    let numOut = 0;
    const in0 = vIn[0];
    const in1 = vIn[1];
    // Calculate the distance of end points to the line
    const distance0 = Vec2.dot(normal, in0.v) - offset;
    const distance1 = Vec2.dot(normal, in1.v) - offset;

    // If the points are behind the plane
    if (distance0 <= 0.0) {
        vOut[numOut++].copyFrom(in0);
    }
    if (distance1 <= 0.0) {
        vOut[numOut++].copyFrom(in1);
    }

    // If the points are on different sides of the plane
    if (distance0 * distance1 < 0.0) {
        // Find intersection point of edge and plane
        const interp = distance0 / (distance0 - distance1);
        const mp = vOut[numOut++];
        mp.v.setCombine(1 - interp, in0.v, interp, in1.v);
        // VertexA is hitting edgeB.
        mp.cf.indexA = vertexIndexA;
        mp.cf.indexB = in0.cf.indexB;
        mp.cf.typeA = ContactFeatureType.e_vertex;
        mp.cf.typeB = ContactFeatureType.e_face;
    }

    return numOut;
}
