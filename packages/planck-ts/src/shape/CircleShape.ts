import {Shape, ShapeType} from "../Shape";
import {Vec2} from "../common/Vec2";
import {Rot} from "../common/Rot";
import {MathUtil} from "../common/Math";
import {assert} from "../util/common";
import {DistanceProxy} from "../collision/Distance";
import {MassData} from "../MassData";
import {AABB} from "../collision/AABB";
import {Transform} from "../common/Transform";
import {RayCastInput, RayCastOutput} from "../collision/RayCastOptions";

export class CircleShape extends Shape {
    static TYPE: ShapeType = 'circle';

    readonly m_p: Vec2;

    // 0, 0, 1
    constructor(x: number, y: number, r: number) {
        super(CircleShape.TYPE);
        this.m_radius = r;
        this.m_p = new Vec2(x, y);
    }

    // _serialize():any {
    //     return {
    //         type: this.m_type,
    //         p: this.m_p,
    //         radius: this.m_radius,
    //     };
    // }
    //
    // static _deserialize(data:any) {
    //     return new CircleShape(data.p.x, data.p.y, data.radius);
    // }

    getRadius() {
        return this.m_radius;
    }

    getCenter() {
        return this.m_p;
    }

    getVertex(index: number) {
        PLANCK_ASSERT && assert(index === 0);
        return this.m_p;
    }

    getVertexCount(index: number) {
        return 1;
    }

    /**
     * @deprecated
     */
    _clone() {
        return new CircleShape(this.m_p.x, this.m_p.y, this.m_radius);
    }

    getChildCount() {
        return 1;
    }

    testPoint(xf: Transform, p: Vec2) {
        const center = Vec2.add(xf.p, Rot.mulVec2(xf.q, this.m_p));
        const d = Vec2.sub(p, center);
        return Vec2.dot(d, d) <= this.m_radius * this.m_radius;
    }

// Collision Detection in Interactive 3D Environments by Gino van den Bergen
// From Section 3.1.2
// x = s + a * r
// norm(x) = radius
    rayCast(output: RayCastOutput, input: RayCastInput, xf: Transform, childIndex: number) {

        const position = Vec2.add(xf.p, Rot.mulVec2(xf.q, this.m_p));
        const s = Vec2.sub(input.p1, position);
        const b = Vec2.dot(s, s) - this.m_radius * this.m_radius;

        // Solve quadratic equation.
        const r = Vec2.sub(input.p2, input.p1);
        const c = Vec2.dot(s, r);
        const rr = Vec2.dot(r, r);
        const sigma = c * c - rr * b;

        // Check for negative discriminant and short segment.
        if (sigma < 0.0 || rr < MathUtil.EPSILON) {
            return false;
        }

        // Find the point of intersection of the line with the circle.
        let a = -(c + Math.sqrt(sigma));

        const irr = 1.0 / rr;
        // Is the intersection point on the segment?
        if (0.0 <= a && a <= input.maxFraction * rr) {
            a *= irr;
            output.fraction = a;
            output.normal = Vec2.add(s, Vec2.mul(a, r));
            output.normal.normalize();
            return true;
        }

        return false;
    }

    computeAABB(aabb: AABB, xf: Transform, childIndex: number) {
        const p = Vec2.add(xf.p, Rot.mulVec2(xf.q, this.m_p));
        aabb.lowerBound.set(p.x - this.m_radius, p.y - this.m_radius);
        aabb.upperBound.set(p.x + this.m_radius, p.y + this.m_radius);
    }

    computeMass(massData: MassData, density: number) {
        const r2 = this.m_radius * this.m_radius;
        massData.mass = density * Math.PI * r2;
        massData.center.copyFrom(this.m_p);
        // inertia about the local origin
        massData.I = massData.mass * (0.5 * r2 + Vec2.dot(this.m_p, this.m_p));
    }

    computeDistanceProxy(proxy: DistanceProxy, childIndex: number) {
        proxy.m_vertices.push(this.m_p);
        proxy.m_count = 1;
        proxy.m_radius = this.m_radius;
    }
}

Shape.TYPES[CircleShape.TYPE] = CircleShape;