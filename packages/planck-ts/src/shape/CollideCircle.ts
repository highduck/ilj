import {Contact} from "../Contact";
import {CircleShape} from "./CircleShape";
import {assert} from "../util/common";
import {Transform} from "../common/Transform";
import {Vec2} from "../common/Vec2";
import {ContactFeatureType, Manifold, ManifoldType} from "../Manifold";
import {Fixture} from "../Fixture";

Contact.addType(CircleShape.TYPE, CircleShape.TYPE, CircleCircleContact);

function CircleCircleContact(manifold: Manifold,
                             xfA: Transform, fixtureA: Fixture, indexA: number,
                             xfB: Transform, fixtureB: Fixture, indexB: number) {
    PLANCK_ASSERT && assert(fixtureA.getType() == CircleShape.TYPE);
    PLANCK_ASSERT && assert(fixtureB.getType() == CircleShape.TYPE);
    const a = fixtureA.getShape() as unknown as CircleShape;
    const b = fixtureB.getShape() as unknown as CircleShape;
    CollideCircles(manifold, a, xfA, b, xfB);
}

export function CollideCircles(manifold: Manifold,
                               circleA: CircleShape, xfA: Transform,
                               circleB: CircleShape, xfB: Transform) {
    manifold.pointCount = 0;

    const pA = Transform.mulVec2(xfA, circleA.m_p);
    const pB = Transform.mulVec2(xfB, circleB.m_p);

    const distSqr = Vec2.distanceSquared(pB, pA);
    const rA = circleA.m_radius;
    const rB = circleB.m_radius;
    const radius = rA + rB;
    if (distSqr > radius * radius) {
        return;
    }

    manifold.type = ManifoldType.e_circles;
    manifold.localPoint.copyFrom(circleA.m_p);
    manifold.localNormal.setZero();
    manifold.pointCount = 1;
    const mp0 = manifold.points[0];
    mp0.localPoint.copyFrom(circleB.m_p);
    mp0.cf.indexA = 0;
    mp0.cf.typeA = ContactFeatureType.e_vertex;
    mp0.cf.indexB = 0;
    mp0.cf.typeB = ContactFeatureType.e_vertex;
}