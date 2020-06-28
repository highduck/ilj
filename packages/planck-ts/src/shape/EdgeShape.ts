import {Shape, ShapeType} from "../Shape";
import {Settings} from "../Settings";
import {Vec2} from "../common/Vec2";
import {Rot} from "../common/Rot";
import {Transform} from "../common/Transform";
import {DistanceProxy} from "../collision/Distance";
import {MassData} from "../MassData";
import {AABB} from "../collision/AABB";
import {RayCastInput, RayCastOutput} from "../collision/RayCastOptions";

/**
 * A line segment (edge) shape. These can be connected in chains or loops to
 * other edge shapes. The connectivity information is used to ensure correct
 * contact normals.
 */
export class EdgeShape extends Shape {
    static TYPE: ShapeType = 'edge';

    m_vertex1:Vec2;
    m_vertex2:Vec2;

    // Optional adjacent vertices. These are used for smooth collision.
    // Used by chain shape.
    m_vertex0 = new Vec2(0, 0);
    m_vertex3 = new Vec2(0, 0);
    m_hasVertex0 = false;
    m_hasVertex3 = false;

    constructor(v1?: Vec2, v2?: Vec2) {
        super(EdgeShape.TYPE);
        this.m_radius = Settings.polygonRadius;

        // These are the edge vertices
        this.m_vertex1 = v1 ? Vec2.clone(v1) : Vec2.zero();
        this.m_vertex2 = v2 ? Vec2.clone(v2) : Vec2.zero();
    }


    // _serialize() {
    //     return {
    //         type: this.m_type,
    //
    //         vertex1: this.m_vertex1,
    //         vertex2: this.m_vertex2,
    //
    //         vertex0: this.m_vertex0,
    //         vertex3: this.m_vertex3,
    //         hasVertex0: this.m_hasVertex0,
    //         hasVertex3: this.m_hasVertex3,
    //     };
    // }
    //
    // static _deserialize(data) {
    //     const shape = new EdgeShape(data.vertex1, data.vertex2);
    //     if (data.hasVertex0) {
    //         shape.setPrev(data.vertex0);
    //     }
    //     if (data.hasVertex3) {
    //         shape.setNext(data.vertex3);
    //     }
    //     return shape;
    // }

    setNext(v3?: Vec2) {
        if (v3) {
            this.m_vertex3.copyFrom(v3);
            this.m_hasVertex3 = true;
        } else {
            this.m_vertex3.setZero();
            this.m_hasVertex3 = false;
        }
        return this;
    }

    setPrev(v0?: Vec2) {
        if (v0) {
            this.m_vertex0.copyFrom(v0);
            this.m_hasVertex0 = true;
        } else {
            this.m_vertex0.setZero();
            this.m_hasVertex0 = false;
        }
        return this;
    }

    /**
     * Set this as an isolated edge.
     */
    _set(v1: Vec2, v2: Vec2) {
        this.m_vertex1.copyFrom(v1);
        this.m_vertex2.copyFrom(v2);
        this.m_hasVertex0 = false;
        this.m_hasVertex3 = false;
        return this;
    }

    /**
     * @deprecated
     */
    _clone() {
        const clone = new EdgeShape();
        clone.m_type = this.m_type;
        clone.m_radius = this.m_radius;
        clone.m_vertex1.copyFrom(this.m_vertex1);
        clone.m_vertex2.copyFrom(this.m_vertex2);
        clone.m_vertex0.copyFrom(this.m_vertex0);
        clone.m_vertex3.copyFrom(this.m_vertex3);
        clone.m_hasVertex0 = this.m_hasVertex0;
        clone.m_hasVertex3 = this.m_hasVertex3;
        return clone;
    }

    getChildCount() {
        return 1;
    }

    testPoint(xf:Transform, p:Vec2) {
        return false;
    }

// p = p1 + t * d
// v = v1 + s * e
// p1 + t * d = v1 + s * e
// s * e - t * d = p1 - v1
    rayCast(output:RayCastOutput, input:RayCastInput, xf:Transform, childIndex:number) {
        // NOT_USED(childIndex);

        // Put the ray into the edge's frame of reference.
        const p1 = Rot.mulTVec2(xf.q, Vec2.sub(input.p1, xf.p));
        const p2 = Rot.mulTVec2(xf.q, Vec2.sub(input.p2, xf.p));
        const d = Vec2.sub(p2, p1);

        const v1 = this.m_vertex1;
        const v2 = this.m_vertex2;
        const e = Vec2.sub(v2, v1);
        const normal = new Vec2(e.y, -e.x);
        normal.normalize();

        // q = p1 + t * d
        // dot(normal, q - v1) = 0
        // dot(normal, p1 - v1) + t * dot(normal, d) = 0
        const numerator = Vec2.dot(normal, Vec2.sub(v1, p1));
        const denominator = Vec2.dot(normal, d);

        if (denominator === 0.0) {
            return false;
        }

        const t = numerator / denominator;
        if (t < 0.0 || input.maxFraction < t) {
            return false;
        }

        const q = Vec2.add(p1, Vec2.mul(t, d));

        // q = v1 + s * r
        // s = dot(q - v1, r) / dot(r, r)
        const r = Vec2.sub(v2, v1);
        const rr = Vec2.dot(r, r);
        if (rr === 0.0) {
            return false;
        }

        const s = Vec2.dot(Vec2.sub(q, v1), r) / rr;
        if (s < 0.0 || 1.0 < s) {
            return false;
        }

        output.fraction = t;
        if (numerator > 0.0) {
            output.normal = Rot.mulVec2(xf.q, normal).neg();
        } else {
            output.normal = Rot.mulVec2(xf.q, normal);
        }
        return true;
    }

    computeAABB(aabb:AABB, xf:Transform, childIndex:number) {
        const v1 = Transform.mulVec2(xf, this.m_vertex1);
        const v2 = Transform.mulVec2(xf, this.m_vertex2);

        aabb.combinePoints(v1, v2);
        aabb.extend(this.m_radius)
    }

    computeMass(massData:MassData, density:number) {
        massData.mass = 0.0;
        massData.center.setCombine(0.5, this.m_vertex1, 0.5, this.m_vertex2);
        massData.I = 0.0;
    }

    computeDistanceProxy(proxy:DistanceProxy) {
        proxy.m_vertices.push(this.m_vertex1);
        proxy.m_vertices.push(this.m_vertex2);
        proxy.m_count = 2;
        proxy.m_radius = this.m_radius;
    }
}

Shape.TYPES[EdgeShape.TYPE] = EdgeShape;