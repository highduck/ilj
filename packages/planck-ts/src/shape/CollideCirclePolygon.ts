import {Contact} from "../Contact";
import {PolygonShape} from "./PolygonShape";
import {CircleShape} from "./CircleShape";
import {assert} from "../util/common";
import {Transform} from "../common/Transform";
import {Vec2} from "../common/Vec2";
import {MathUtil} from "../common/Math";
import {ContactFeatureType, Manifold, ManifoldType} from "../Manifold";
import {Fixture} from "../Fixture";

const CollidePolygonCircle_faceCenter = new Vec2(0, 0);
const CollidePolygonCircle_sub_0 = new Vec2(0, 0);
const CollidePolygonCircle_sub_1 = new Vec2(0, 0);

Contact.addType(PolygonShape.TYPE, CircleShape.TYPE, PolygonCircleContact);

function PolygonCircleContact(manifold: Manifold,
                              xfA: Transform, fixtureA: Fixture, indexA: number,
                              xfB: Transform, fixtureB: Fixture, indexB: number) {
    PLANCK_ASSERT && assert(fixtureA.getType() === PolygonShape.TYPE);
    PLANCK_ASSERT && assert(fixtureB.getType() === CircleShape.TYPE);
    const a = fixtureA.getShape() as unknown as PolygonShape;
    const b = fixtureB.getShape() as unknown as CircleShape;
    CollidePolygonCircle(manifold, a, xfA, b, xfB);
}

function CollidePolygonCircle(manifold: Manifold,
                              polygonA: PolygonShape, xfA: Transform,
                              circleB: CircleShape, xfB: Transform) {
    manifold.pointCount = 0;

    const sub_0 = CollidePolygonCircle_sub_0;
    const sub_1 = CollidePolygonCircle_sub_1;

    // Compute circle position in the frame of the polygon.
    const c = Transform.mulVec2(xfB, circleB.m_p);
    const cLocal = Transform.mulTVec2(xfA, c);

    // Find the min separating edge.
    let normalIndex = 0;
    let separation = -Infinity;
    const radius = polygonA.m_radius + circleB.m_radius;
    const vertexCount = polygonA.m_count;
    const vertices = polygonA.m_vertices;
    const normals = polygonA.m_normals;

    for (let i = 0; i < vertexCount; ++i) {
        // const s = Vec2.dot(normals[i], Vec2.sub(cLocal, vertices[i]));
        Vec2._sub(cLocal, vertices[i], sub_0);
        const s = Vec2.dot(normals[i], sub_0);

        if (s > radius) {
            // Early out.
            return;
        }

        if (s > separation) {
            separation = s;
            normalIndex = i;
        }
    }

    // Vertices that subtend the incident face.
    const vertIndex1 = normalIndex;
    const vertIndex2 = vertIndex1 + 1 < vertexCount ? vertIndex1 + 1 : 0;
    const v1 = vertices[vertIndex1];
    const v2 = vertices[vertIndex2];

    // If the center is inside the polygon ...
    if (separation < MathUtil.EPSILON) {
        manifold.pointCount = 1;
        manifold.type = ManifoldType.e_faceA;
        manifold.localNormal.copyFrom(normals[normalIndex]);
        manifold.localPoint.setCombine(0.5, v1, 0.5, v2);
        manifold.points[0].localPoint.copyFrom(circleB.m_p);
        manifold.points[0].cf.indexA = 0;
        manifold.points[0].cf.typeA = ContactFeatureType.e_vertex;
        manifold.points[0].cf.indexB = 0;
        manifold.points[0].cf.typeB = ContactFeatureType.e_vertex;
        return;
    }

    // Compute barycentric coordinates

    // const u1 = Vec2.dot(Vec2.sub(cLocal, v1), Vec2.sub(v2, v1));
    Vec2._sub(cLocal, v1, sub_0);
    Vec2._sub(v2, v1, sub_1);
    const u1 = Vec2.dot(sub_0, sub_1);

    // const u2 = Vec2.dot(Vec2.sub(cLocal, v2), Vec2.sub(v1, v2));
    Vec2._sub(cLocal, v2, sub_0);
    Vec2._sub(v1, v2, sub_1);
    const u2 = Vec2.dot(sub_0, sub_1);

    if (u1 <= 0.0) {
        if (Vec2.distanceSquared(cLocal, v1) > radius * radius) {
            return;
        }

        manifold.pointCount = 1;
        manifold.type = ManifoldType.e_faceA;
        manifold.localNormal.setCombine(1, cLocal, -1, v1);
        manifold.localNormal.normalize();
        manifold.localPoint.copyFrom(v1);
        manifold.points[0].localPoint.copyFrom(circleB.m_p);
        manifold.points[0].cf.indexA = 0;
        manifold.points[0].cf.typeA = ContactFeatureType.e_vertex;
        manifold.points[0].cf.indexB = 0;
        manifold.points[0].cf.typeB = ContactFeatureType.e_vertex;
    } else if (u2 <= 0.0) {
        if (Vec2.distanceSquared(cLocal, v2) > radius * radius) {
            return;
        }

        manifold.pointCount = 1;
        manifold.type = ManifoldType.e_faceA;
        manifold.localNormal.setCombine(1, cLocal, -1, v2);
        manifold.localNormal.normalize();
        manifold.localPoint.copyFrom(v2);
        manifold.points[0].localPoint.copyFrom(circleB.m_p);
        manifold.points[0].cf.indexA = 0;
        manifold.points[0].cf.typeA = ContactFeatureType.e_vertex;
        manifold.points[0].cf.indexB = 0;
        manifold.points[0].cf.typeB = ContactFeatureType.e_vertex;
    } else {
        const faceCenter = CollidePolygonCircle_faceCenter;
        Vec2._mid(v1, v2, faceCenter);
        const separation = Vec2.dot(cLocal, normals[vertIndex1]) - Vec2.dot(faceCenter, normals[vertIndex1]);
        if (separation > radius) {
            return;
        }

        manifold.pointCount = 1;
        manifold.type = ManifoldType.e_faceA;
        manifold.localNormal.copyFrom(normals[vertIndex1]);
        manifold.localPoint.copyFrom(faceCenter);
        manifold.points[0].localPoint.copyFrom(circleB.m_p);
        manifold.points[0].cf.indexA = 0;
        manifold.points[0].cf.typeA = ContactFeatureType.e_vertex;
        manifold.points[0].cf.indexB = 0;
        manifold.points[0].cf.typeB = ContactFeatureType.e_vertex;
    }
}
