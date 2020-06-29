import {Contact} from "../Contact";
import {EdgeShape} from "./EdgeShape";
import {ChainShape} from "./ChainShape";
import {CircleShape} from "./CircleShape";
import {assert} from "../util/common";
import {Transform} from "../common/Transform";
import {Vec2} from "../common/Vec2";
import {ContactFeatureType, Manifold, ManifoldType} from "../Manifold";
import {Fixture} from "../Fixture";

Contact.addType(EdgeShape.TYPE, CircleShape.TYPE, EdgeCircleContact);
Contact.addType(ChainShape.TYPE, CircleShape.TYPE, ChainCircleContact);

function EdgeCircleContact(manifold: Manifold,
                           xfA: Transform, fixtureA: Fixture, indexA: number,
                           xfB: Transform, fixtureB: Fixture, indexB: number) {
    PLANCK_ASSERT && assert(fixtureA.getType() === EdgeShape.TYPE);
    PLANCK_ASSERT && assert(fixtureB.getType() === CircleShape.TYPE);
    const a = fixtureA.getShape() as unknown as EdgeShape;
    const b = fixtureB.getShape() as unknown as CircleShape;
    CollideEdgeCircle(manifold, a, xfA, b, xfB);
}

function ChainCircleContact(manifold: Manifold,
                            xfA: Transform, fixtureA: Fixture, indexA: number,
                            xfB: Transform, fixtureB: Fixture, indexB: number) {
    PLANCK_ASSERT && assert(fixtureA.getType() == ChainShape.TYPE);
    PLANCK_ASSERT && assert(fixtureB.getType() == CircleShape.TYPE);

    const chain = fixtureA.getShape() as unknown as ChainShape;
    const edge = new EdgeShape();
    chain.getChildEdge(edge, indexA);

    const a = edge;
    const b = fixtureB.getShape() as unknown as CircleShape;

    CollideEdgeCircle(manifold, a, xfA, b, xfB);
}

// Compute contact points for edge versus circle.
// This accounts for edge connectivity.
function CollideEdgeCircle(manifold: Manifold,
                           edgeA: EdgeShape, xfA: Transform,
                           circleB: CircleShape, xfB: Transform) {
    manifold.pointCount = 0;

    // Compute circle in frame of edge
    const Q = Transform.mulTVec2(xfA, Transform.mulVec2(xfB, circleB.m_p));

    const A = edgeA.m_vertex1;
    const B = edgeA.m_vertex2;
    const e = Vec2.sub(B, A);

    // Barycentric coordinates
    const u = Vec2.dot(e, Vec2.sub(B, Q));
    const v = Vec2.dot(e, Vec2.sub(Q, A));

    const radius = edgeA.m_radius + circleB.m_radius;

    // Region A
    if (v <= 0.0) {
        const P = Vec2.clone(A);
        const d = Vec2.sub(Q, P);
        const dd = Vec2.dot(d, d);
        if (dd > radius * radius) {
            return;
        }

        // Is there an edge connected to A?
        if (edgeA.m_hasVertex0) {
            const A1 = edgeA.m_vertex0;
            const B1 = A;
            const e1 = Vec2.sub(B1, A1);
            const u1 = Vec2.dot(e1, Vec2.sub(B1, Q));

            // Is the circle in Region AB of the previous edge?
            if (u1 > 0.0) {
                return;
            }
        }

        manifold.type = ManifoldType.e_circles;
        manifold.localNormal.setZero();
        manifold.localPoint.copyFrom(P);
        manifold.pointCount = 1;
        const mp0 = manifold.points[0];
        mp0.localPoint.copyFrom(circleB.m_p);
        mp0.cf.indexA = 0;
        mp0.cf.typeA = ContactFeatureType.e_vertex;
        mp0.cf.indexB = 0;
        mp0.cf.typeB = ContactFeatureType.e_vertex;
        return;
    }

    // Region B
    if (u <= 0.0) {
        const P = Vec2.clone(B);
        const d = Vec2.sub(Q, P);
        const dd = Vec2.dot(d, d);
        if (dd > radius * radius) {
            return;
        }

        // Is there an edge connected to B?
        if (edgeA.m_hasVertex3) {
            const B2 = edgeA.m_vertex3;
            const A2 = B;
            const e2 = Vec2.sub(B2, A2);
            const v2 = Vec2.dot(e2, Vec2.sub(Q, A2));

            // Is the circle in Region AB of the next edge?
            if (v2 > 0.0) {
                return;
            }
        }

        manifold.type = ManifoldType.e_circles;
        manifold.localNormal.setZero();
        manifold.localPoint.copyFrom(P);
        manifold.pointCount = 1;
        const mp0 = manifold.points[0];
        mp0.localPoint.copyFrom(circleB.m_p);
        mp0.cf.indexA = 1;
        mp0.cf.typeA = ContactFeatureType.e_vertex;
        mp0.cf.indexB = 0;
        mp0.cf.typeB = ContactFeatureType.e_vertex;
        return;
    }

    // Region AB
    const den = Vec2.dot(e, e);
    PLANCK_ASSERT && assert(den > 0.0);
    const P = Vec2.combine(u / den, A, v / den, B);
    const d = Vec2.sub(Q, P);
    const dd = Vec2.dot(d, d);
    if (dd > radius * radius) {
        return;
    }

    const n = new Vec2(-e.y, e.x);
    if (Vec2.dot(n, Vec2.sub(Q, A)) < 0.0) {
        n.set(-n.x, -n.y);
    }
    n.normalize();

    manifold.type = ManifoldType.e_faceA;
    manifold.localNormal.copyFrom(n);
    manifold.localPoint.copyFrom(A);
    manifold.pointCount = 1;

    const mp0 = manifold.points[0];
    mp0.localPoint.copyFrom(circleB.m_p);
    mp0.cf.indexA = 0;
    mp0.cf.typeA = ContactFeatureType.e_face;
    mp0.cf.indexB = 0;
    mp0.cf.typeB = ContactFeatureType.e_vertex;
}
