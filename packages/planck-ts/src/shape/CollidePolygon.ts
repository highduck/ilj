import {Contact} from "../Contact";
import {PolygonShape} from "./PolygonShape";
import {assert} from "../util/common";
import {Transform} from "../common/Transform";
import {Rot} from "../common/Rot";
import {Vec2} from "../common/Vec2";
import {clipSegmentToLine, ClipVertex, ClipVertexPair, ContactFeatureType, Manifold, ManifoldType} from "../Manifold";
import {Settings} from "../Settings";
import {Fixture} from "../Fixture";

Contact.addType(PolygonShape.TYPE, PolygonShape.TYPE, PolygonContact);

function PolygonContact(manifold: Manifold,
                        xfA: Transform, fixtureA: Fixture, indexA: number,
                        xfB: Transform, fixtureB: Fixture, indexB: number) {
    PLANCK_ASSERT && assert(fixtureA.getType() == PolygonShape.TYPE);
    PLANCK_ASSERT && assert(fixtureB.getType() == PolygonShape.TYPE);
    const a = fixtureA.getShape() as unknown as PolygonShape;
    const b = fixtureB.getShape() as unknown as PolygonShape;
    CollidePolygons(manifold, a, xfA, b, xfB);
}

let FindMaxSeparation_maxSeparation = 0;
let FindMaxSeparation_bestIndex = 0;

/**
 * Find the max separation between poly1 and poly2 using edge normals from
 * poly1.
 */
function FindMaxSeparation(poly1: PolygonShape, xf1: Transform, poly2: PolygonShape, xf2: Transform) {
    const count1 = poly1.m_count;
    const count2 = poly2.m_count;
    const n1s = poly1.m_normals;
    const v1s = poly1.m_vertices;
    const v2s = poly2.m_vertices;
    const xf = Transform.mulTXf(xf2, xf1);

    let bestIndex = 0;
    let maxSeparation = -Infinity;
    for (let i = 0; i < count1; ++i) {
        // Get poly1 normal in frame2.
        const n = Rot.mulVec2(xf.q, n1s[i]);
        const v1 = Transform.mulVec2(xf, v1s[i]);

        // Find deepest point for normal i.
        let si = Infinity;
        for (let j = 0; j < count2; ++j) {
            const sij = Vec2.dot(n, v2s[j]) - Vec2.dot(n, v1);
            if (sij < si) {
                si = sij;
            }
        }

        if (si > maxSeparation) {
            maxSeparation = si;
            bestIndex = i;
        }
    }

    // used to keep last FindMaxSeparation call values
    FindMaxSeparation_maxSeparation = maxSeparation;
    FindMaxSeparation_bestIndex = bestIndex;
}

/**
 * @param {int} edge1
 */
const s_FindIncidentEdge_normal = new Vec2(0, 0);
const s_clipVertexPair0:ClipVertexPair = [new ClipVertex(), new ClipVertex()];
const s_clipVertexPair1:ClipVertexPair = [new ClipVertex(), new ClipVertex()];
const s_clipVertexPair2:ClipVertexPair = [new ClipVertex(), new ClipVertex()];

function FindIncidentEdge(c0: ClipVertex, c1: ClipVertex,
                          poly1: PolygonShape, xf1: Transform, edge1: number,
                          poly2: PolygonShape, xf2: Transform) {
    const normals1 = poly1.m_normals;

    const count2 = poly2.m_count;
    const vertices2 = poly2.m_vertices;
    const normals2 = poly2.m_normals;

    PLANCK_ASSERT && assert(0 <= edge1 && edge1 < poly1.m_count);

    // Get the normal of the reference edge in poly2's frame.

    //const normal1 = Rot.mulTVec2(xf2.q, Rot.mulVec2(xf1.q, normals1[edge1]));
    const normal1 = s_FindIncidentEdge_normal;
    Rot._mulVec2(xf1.q, normals1[edge1], normal1);
    Rot._mulVec2(xf2.q, normal1, normal1);

    // Find the incident edge on poly2.
    let index = 0;
    let minDot = Infinity;
    for (let i = 0; i < count2; ++i) {
        const dot = Vec2.dot(normal1, normals2[i]);
        if (dot < minDot) {
            minDot = dot;
            index = i;
        }
    }

    // Build the clip vertices for the incident edge.
    Transform._mulVec2(xf2, vertices2[index], c0.v);
    c0.cf.indexA = edge1;
    c0.cf.indexB = index;
    c0.cf.typeA = ContactFeatureType.e_face;
    c0.cf.typeB = ContactFeatureType.e_vertex;

    index = index + 1 < count2 ? index + 1 : 0;
    Transform._mulVec2(xf2, vertices2[index], c1.v);
    c1.cf.indexA = edge1;
    c1.cf.indexB = index;
    c1.cf.typeA = ContactFeatureType.e_face;
    c1.cf.typeB = ContactFeatureType.e_vertex;
}

/**
 *
 * Find edge normal of max separation on A - return if separating axis is found<br>
 * Find edge normal of max separation on B - return if separation axis is found<br>
 * Choose reference edge as min(minA, minB)<br>
 * Find incident edge<br>
 * Clip
 *
 * The normal points from 1 to 2
 */
function CollidePolygons(manifold: Manifold, polyA: PolygonShape, xfA: Transform, polyB: PolygonShape, xfB: Transform) {
    manifold.pointCount = 0;
    const totalRadius = polyA.m_radius + polyB.m_radius;

    FindMaxSeparation(polyA, xfA, polyB, xfB);
    const edgeA = FindMaxSeparation_bestIndex;
    const separationA = FindMaxSeparation_maxSeparation;
    if (separationA > totalRadius)
        return;

    FindMaxSeparation(polyB, xfB, polyA, xfA);
    const edgeB = FindMaxSeparation_bestIndex;
    const separationB = FindMaxSeparation_maxSeparation;
    if (separationB > totalRadius)
        return;

    let poly1; // reference polygon
    let poly2; // incident polygon
    let xf1;
    let xf2;
    let edge1; // reference edge
    let flip;
    let k_tol = 0.1 * Settings.linearSlop;

    if (separationB > separationA + k_tol) {
        poly1 = polyB;
        poly2 = polyA;
        xf1 = xfB;
        xf2 = xfA;
        edge1 = edgeB;
        manifold.type = ManifoldType.e_faceB;
        flip = 1;
    } else {
        poly1 = polyA;
        poly2 = polyB;
        xf1 = xfA;
        xf2 = xfB;
        edge1 = edgeA;
        manifold.type = ManifoldType.e_faceA;
        flip = 0;
    }

    const incidentEdge = s_clipVertexPair0;
    FindIncidentEdge(incidentEdge[0], incidentEdge[1], poly1, xf1, edge1, poly2, xf2);

    const count1 = poly1.m_count;
    const vertices1 = poly1.m_vertices;

    const iv1 = edge1;
    const iv2 = edge1 + 1 < count1 ? edge1 + 1 : 0;

    let v11 = vertices1[iv1];
    let v12 = vertices1[iv2];

    const localTangent = Vec2.sub(v12, v11);
    localTangent.normalize();

    const localNormal = Vec2.crossVS(localTangent, 1.0);
    const planePoint = Vec2.combine(0.5, v11, 0.5, v12);

    const tangent = Rot.mulVec2(xf1.q, localTangent);
    const normal = Vec2.crossVS(tangent, 1.0);

    v11 = Transform.mulVec2(xf1, v11);
    v12 = Transform.mulVec2(xf1, v12);

    // Face offset.
    const frontOffset = Vec2.dot(normal, v11);

    // Side offsets, extended by polytope skin thickness.
    const sideOffset1 = -Vec2.dot(tangent, v11) + totalRadius;
    const sideOffset2 = Vec2.dot(tangent, v12) + totalRadius;

    // Clip incident edge against extruded edge1 side edges.
    const clipPoints1 = s_clipVertexPair1;
    const clipPoints2 = s_clipVertexPair2;

    // Clip to box side 1
    let np = clipSegmentToLine(clipPoints1, incidentEdge, Vec2.neg(tangent), sideOffset1, iv1);
    if (np < 2) {
        return;
    }

    // Clip to negative box side 1
    np = clipSegmentToLine(clipPoints2, clipPoints1, tangent, sideOffset2, iv2);
    if (np < 2) {
        return;
    }

    // Now clipPoints2 contains the clipped points.
    manifold.localNormal.copyFrom(localNormal);
    manifold.localPoint.copyFrom(planePoint);

    let pointCount = 0;
    for (let i = 0; i < clipPoints2.length/* maxManifoldPoints */; ++i) {
        const separation = Vec2.dot(normal, clipPoints2[i].v) - frontOffset;

        if (separation <= totalRadius) {
            const cp = manifold.points[pointCount]; // ManifoldPoint
            Transform._mulTVec2(xf2, clipPoints2[i].v, cp.localPoint);
            cp.cf.copyFrom(clipPoints2[i].cf);
            if (flip) {
                // Swap features
                const cf = cp.cf; // ContactFeature
                const indexA = cf.indexA;
                const indexB = cf.indexB;
                const typeA = cf.typeA;
                const typeB = cf.typeB;
                cf.indexA = indexB;
                cf.indexB = indexA;
                cf.typeA = typeB;
                cf.typeB = typeA;
            }
            ++pointCount;
        }
    }

    manifold.pointCount = pointCount;
}
