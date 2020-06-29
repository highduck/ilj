import {Contact} from "../Contact";
import {EdgeShape} from "./EdgeShape";
import {ChainShape} from "./ChainShape";
import {PolygonShape} from "./PolygonShape";
import {assert} from "../util/common";
import {Transform} from "../common/Transform";
import {Vec2} from "../common/Vec2";
import {Settings} from "../Settings";
import {clipSegmentToLine, ClipVertex, ClipVertexPair, ContactFeatureType, Manifold, ManifoldType} from "../Manifold";
import {Rot} from "../common/Rot";
import {Fixture} from "../Fixture";

Contact.addType(EdgeShape.TYPE, PolygonShape.TYPE, EdgePolygonContact);
Contact.addType(ChainShape.TYPE, PolygonShape.TYPE, ChainPolygonContact);

function EdgePolygonContact(manifold: Manifold,
                            xfA: Transform, fixtureA: Fixture, indexA: number,
                            xfB: Transform, fixtureB: Fixture, indexB: number) {
    PLANCK_ASSERT && assert(fixtureA.getType() === EdgeShape.TYPE);
    PLANCK_ASSERT && assert(fixtureB.getType() === PolygonShape.TYPE);
    const a = fixtureA.getShape() as unknown as EdgeShape;
    const b = fixtureB.getShape() as unknown as PolygonShape;
    CollideEdgePolygon(manifold, a, xfA, b, xfB);
}

function ChainPolygonContact(manifold: Manifold,
                             xfA: Transform, fixtureA: Fixture, indexA: number,
                             xfB: Transform, fixtureB: Fixture, indexB: number) {
    PLANCK_ASSERT && assert(fixtureA.getType() === ChainShape.TYPE);
    PLANCK_ASSERT && assert(fixtureB.getType() === PolygonShape.TYPE);

    const chain = fixtureA.getShape() as unknown as ChainShape;
    const edge = new EdgeShape();
    chain.getChildEdge(edge, indexA);

    const b = fixtureB.getShape() as unknown as PolygonShape;

    CollideEdgePolygon(manifold, edge, xfA, b, xfB);
}

// EPAxis Type
const enum EPAxisType {
    e_unknown = -1,
    e_edgeA = 1,
    e_edgeB = 2
}

// VertexType unused?
const enum VertexType {
    e_isolated = 0,
    e_concave = 1,
    e_convex = 2
}

// This structure is used to keep track of the best separating axis.
class EPAxis {
    type: EPAxisType = EPAxisType.e_unknown; // Type
    index: number = 0;
    separation: number = 0;
}

// This holds polygon B expressed in frame A.
class TempPolygon {
    vertices: Vec2[] = []; // Vec2[Settings.maxPolygonVertices]
    normals: Vec2[] = []; // Vec2[Settings.maxPolygonVertices];
    count = 0;
}

// Reference face used for clipping
class ReferenceFace {
    i1 = 0;
    i2 = 0;
    v1 = Vec2.zero();
    v2 = Vec2.zero();
    normal = Vec2.zero();
    sideNormal1 = Vec2.zero();
    sideOffset1 = 0;
    sideNormal2 = Vec2.zero();
    sideOffset2 = 0;
}

// reused
const edgeAxis = new EPAxis();
const polygonAxis = new EPAxis();
const polygonBA = new TempPolygon();
const rf = new ReferenceFace();

const s_clipVertexPair0: ClipVertexPair = [new ClipVertex(), new ClipVertex()];
const s_clipVertexPair1: ClipVertexPair = [new ClipVertex(), new ClipVertex()];
const s_clipVertexPair2: ClipVertexPair = [new ClipVertex(), new ClipVertex()];

/**
 * This function collides and edge and a polygon, taking into account edge
 * adjacency.
 */
function CollideEdgePolygon(manifold: Manifold,
                            edgeA: EdgeShape, xfA: Transform,
                            polygonB: PolygonShape, xfB: Transform) {
    // Algorithm:
    // 1. Classify v1 and v2
    // 2. Classify polygon centroid as front or back
    // 3. Flip normal if necessary
    // 4. Initialize normal range to [-pi, pi] about face normal
    // 5. Adjust normal range according to adjacent edges
    // 6. Visit each separating axes, only accept axes within the range
    // 7. Return if _any_ axis indicates separation
    // 8. Clip

    let m_type1, m_type2; // VertexType unused?

    const xf = Transform.mulTXf(xfA, xfB);

    const centroidB = Transform.mulVec2(xf, polygonB.m_centroid);

    const v0 = edgeA.m_vertex0;
    const v1 = edgeA.m_vertex1;
    const v2 = edgeA.m_vertex2;
    const v3 = edgeA.m_vertex3;

    const hasVertex0 = edgeA.m_hasVertex0;
    const hasVertex3 = edgeA.m_hasVertex3;

    const edge1 = Vec2.sub(v2, v1);
    edge1.normalize();
    let normal0!: Vec2;
    let offset0 = 0.0;
    const normal1 = new Vec2(edge1.y, -edge1.x);
    const offset1 = Vec2.dot(normal1, Vec2.sub(centroidB, v1));
    let normal2!: Vec2;
    let offset2 = 0.0;
    let convex1 = false;
    let convex2 = false;

    // Is there a preceding edge?
    if (hasVertex0) {
        const edge0 = Vec2.sub(v1, v0);
        edge0.normalize();
        normal0 = new Vec2(edge0.y, -edge0.x);
        convex1 = Vec2.cross(edge0, edge1) >= 0.0;
        offset0 = Vec2.dot(normal0, centroidB) - Vec2.dot(normal0, v0);
    }

    // Is there a following edge?
    if (hasVertex3) {
        const edge2 = Vec2.sub(v3, v2);
        edge2.normalize();
        normal2 = new Vec2(edge2.y, -edge2.x);
        convex2 = Vec2.cross(edge1, edge2) > 0.0;
        offset2 = Vec2.dot(normal2, centroidB) - Vec2.dot(normal2, v2);
    }

    let front: boolean;
    const normal = Vec2.zero();
    const lowerLimit = Vec2.zero();
    const upperLimit = Vec2.zero();

    // Determine front or back collision. Determine collision normal limits.
    if (hasVertex0 && hasVertex3) {
        if (convex1 && convex2) {
            front = offset0 >= 0.0 || offset1 >= 0.0 || offset2 >= 0.0;
            if (front) {
                normal.copyFrom(normal1);
                lowerLimit.copyFrom(normal0);
                upperLimit.copyFrom(normal2);
            } else {
                normal.setMul(-1, normal1);
                lowerLimit.setMul(-1, normal1);
                upperLimit.setMul(-1, normal1);
            }
        } else if (convex1) {
            front = offset0 >= 0.0 || (offset1 >= 0.0 && offset2 >= 0.0);
            if (front) {
                normal.copyFrom(normal1);
                lowerLimit.copyFrom(normal0);
                upperLimit.copyFrom(normal1);
            } else {
                normal.setMul(-1, normal1);
                lowerLimit.setMul(-1, normal2);
                upperLimit.setMul(-1, normal1);
            }
        } else if (convex2) {
            front = offset2 >= 0.0 || (offset0 >= 0.0 && offset1 >= 0.0);
            if (front) {
                normal.copyFrom(normal1);
                lowerLimit.copyFrom(normal1);
                upperLimit.copyFrom(normal2);
            } else {
                normal.setMul(-1, normal1);
                lowerLimit.setMul(-1, normal1);
                upperLimit.setMul(-1, normal0);
            }
        } else {
            front = offset0 >= 0.0 && offset1 >= 0.0 && offset2 >= 0.0;
            if (front) {
                normal.copyFrom(normal1);
                lowerLimit.copyFrom(normal1);
                upperLimit.copyFrom(normal1);
            } else {
                normal.setMul(-1, normal1);
                lowerLimit.setMul(-1, normal2);
                upperLimit.setMul(-1, normal0);
            }
        }
    } else if (hasVertex0) {
        if (convex1) {
            front = offset0 >= 0.0 || offset1 >= 0.0;
            if (front) {
                normal.copyFrom(normal1);
                lowerLimit.copyFrom(normal0);
                upperLimit.setMul(-1, normal1);
            } else {
                normal.setMul(-1, normal1);
                lowerLimit.copyFrom(normal1);
                upperLimit.setMul(-1, normal1);
            }
        } else {
            front = offset0 >= 0.0 && offset1 >= 0.0;
            if (front) {
                normal.copyFrom(normal1);
                lowerLimit.copyFrom(normal1);
                upperLimit.setMul(-1, normal1);
            } else {
                normal.setMul(-1, normal1);
                lowerLimit.copyFrom(normal1);
                upperLimit.setMul(-1, normal0);
            }
        }
    } else if (hasVertex3) {
        if (convex2) {
            front = offset1 >= 0.0 || offset2 >= 0.0;
            if (front) {
                normal.copyFrom(normal1);
                lowerLimit.setMul(-1, normal1);
                upperLimit.copyFrom(normal2);
            } else {
                normal.setMul(-1, normal1);
                lowerLimit.setMul(-1, normal1);
                upperLimit.copyFrom(normal1);
            }
        } else {
            front = offset1 >= 0.0 && offset2 >= 0.0;
            if (front) {
                normal.copyFrom(normal1);
                lowerLimit.setMul(-1, normal1);
                upperLimit.copyFrom(normal1);
            } else {
                normal.setMul(-1, normal1);
                lowerLimit.setMul(-1, normal2);
                upperLimit.copyFrom(normal1);
            }
        }
    } else {
        front = offset1 >= 0.0;
        if (front) {
            normal.copyFrom(normal1);
            lowerLimit.setMul(-1, normal1);
            upperLimit.setMul(-1, normal1);
        } else {
            normal.setMul(-1, normal1);
            lowerLimit.copyFrom(normal1);
            upperLimit.copyFrom(normal1);
        }
    }

    // Get polygonB in frameA
    polygonBA.count = polygonB.m_count;
    for (let i = 0; i < polygonB.m_count; ++i) {
        polygonBA.vertices[i] = Transform.mulVec2(xf, polygonB.m_vertices[i]);
        polygonBA.normals[i] = Rot.mulVec2(xf.q, polygonB.m_normals[i]);
    }

    const radius = 2.0 * Settings.polygonRadius;

    manifold.pointCount = 0;

    { // ComputeEdgeSeparation
        edgeAxis.type = EPAxisType.e_edgeA;
        edgeAxis.index = front ? 0 : 1;
        edgeAxis.separation = Infinity;

        for (let i = 0; i < polygonBA.count; ++i) {
            const s = Vec2.dot(normal, Vec2.sub(polygonBA.vertices[i], v1));
            if (s < edgeAxis.separation) {
                edgeAxis.separation = s;
            }
        }
    }

    // If no valid normal can be found than this edge should not collide.
    // if (edgeAxis.type === EPAxisType.e_unknown) {
    //     return;
    // }

    if (edgeAxis.separation > radius) {
        return;
    }

    { // ComputePolygonSeparation
        polygonAxis.type = EPAxisType.e_unknown;
        polygonAxis.index = -1;
        polygonAxis.separation = -Infinity;

        const perp = new Vec2(-normal.y, normal.x);

        for (let i = 0; i < polygonBA.count; ++i) {
            const n = Vec2.neg(polygonBA.normals[i]);

            const s1 = Vec2.dot(n, Vec2.sub(polygonBA.vertices[i], v1));
            const s2 = Vec2.dot(n, Vec2.sub(polygonBA.vertices[i], v2));
            const s = Math.min(s1, s2);

            if (s > radius) {
                // No collision
                polygonAxis.type = EPAxisType.e_edgeB;
                polygonAxis.index = i;
                polygonAxis.separation = s;
                break;
            }

            // Adjacency
            if (Vec2.dot(n, perp) >= 0.0) {
                if (Vec2.dot(Vec2.sub(n, upperLimit), normal) < -Settings.angularSlop) {
                    continue;
                }
            } else {
                if (Vec2.dot(Vec2.sub(n, lowerLimit), normal) < -Settings.angularSlop) {
                    continue;
                }
            }

            if (s > polygonAxis.separation) {
                polygonAxis.type = EPAxisType.e_edgeB;
                polygonAxis.index = i;
                polygonAxis.separation = s;
            }
        }
    }

    if (polygonAxis.type !== EPAxisType.e_unknown && polygonAxis.separation > radius) {
        return;
    }

    // Use hysteresis for jitter reduction.
    const k_relativeTol = 0.98;
    const k_absoluteTol = 0.001;

    let primaryAxis;
    if (polygonAxis.type === EPAxisType.e_unknown) {
        primaryAxis = edgeAxis;
    } else if (polygonAxis.separation > k_relativeTol * edgeAxis.separation + k_absoluteTol) {
        primaryAxis = polygonAxis;
    } else {
        primaryAxis = edgeAxis;
    }

    const ie = s_clipVertexPair0;

    if (primaryAxis.type === EPAxisType.e_edgeA) {
        manifold.type = ManifoldType.e_faceA;

        // Search for the polygon normal that is most anti-parallel to the edge
        // normal.
        let bestIndex = 0;
        let bestValue = Vec2.dot(normal, polygonBA.normals[0]);
        for (let i = 1; i < polygonBA.count; ++i) {
            const value = Vec2.dot(normal, polygonBA.normals[i]);
            if (value < bestValue) {
                bestValue = value;
                bestIndex = i;
            }
        }

        const i1 = bestIndex;
        const i2 = i1 + 1 < polygonBA.count ? i1 + 1 : 0;

        ie[0].v.copyFrom(polygonBA.vertices[i1]);
        ie[0].cf.indexA = 0;
        ie[0].cf.indexB = i1;
        ie[0].cf.typeA = ContactFeatureType.e_face;
        ie[0].cf.typeB = ContactFeatureType.e_vertex;

        ie[1].v.copyFrom(polygonBA.vertices[i2]);
        ie[1].cf.indexA = 0;
        ie[1].cf.indexB = i2;
        ie[1].cf.typeA = ContactFeatureType.e_face;
        ie[1].cf.typeB = ContactFeatureType.e_vertex;

        if (front) {
            rf.i1 = 0;
            rf.i2 = 1;
            rf.v1 = v1;
            rf.v2 = v2;
            rf.normal.copyFrom(normal1);
        } else {
            rf.i1 = 1;
            rf.i2 = 0;
            rf.v1 = v2;
            rf.v2 = v1;
            rf.normal.setMul(-1, normal1);
        }
    } else {
        manifold.type = ManifoldType.e_faceB;

        ie[0].v.copyFrom(v1);
        ie[0].cf.indexA = 0;
        ie[0].cf.indexB = primaryAxis.index;
        ie[0].cf.typeA = ContactFeatureType.e_vertex;
        ie[0].cf.typeB = ContactFeatureType.e_face;

        ie[1].v.copyFrom(v2);
        ie[1].cf.indexA = 0;
        ie[1].cf.indexB = primaryAxis.index;
        ie[1].cf.typeA = ContactFeatureType.e_vertex;
        ie[1].cf.typeB = ContactFeatureType.e_face;

        rf.i1 = primaryAxis.index;
        rf.i2 = rf.i1 + 1 < polygonBA.count ? rf.i1 + 1 : 0;
        rf.v1 = polygonBA.vertices[rf.i1];
        rf.v2 = polygonBA.vertices[rf.i2];
        rf.normal.copyFrom(polygonBA.normals[rf.i1]);
    }

    rf.sideNormal1.set(rf.normal.y, -rf.normal.x);
    rf.sideNormal2.setMul(-1, rf.sideNormal1);
    rf.sideOffset1 = Vec2.dot(rf.sideNormal1, rf.v1);
    rf.sideOffset2 = Vec2.dot(rf.sideNormal2, rf.v2);

    // Clip incident edge against extruded edge1 side edges.
    const clipPoints1 = s_clipVertexPair1;
    const clipPoints2 = s_clipVertexPair2;

    // Clip to box side 1
    let np = clipSegmentToLine(clipPoints1, ie, rf.sideNormal1, rf.sideOffset1, rf.i1);
    if (np < Settings.maxManifoldPoints) {
        return;
    }

    // Clip to negative box side 1
    np = clipSegmentToLine(clipPoints2, clipPoints1, rf.sideNormal2, rf.sideOffset2, rf.i2);
    if (np < Settings.maxManifoldPoints) {
        return;
    }

    // Now clipPoints2 contains the clipped points.
    if (primaryAxis.type === EPAxisType.e_edgeA) {
        manifold.localNormal.copyFrom(rf.normal);
        manifold.localPoint.copyFrom(rf.v1);
    } else {
        manifold.localNormal.copyFrom(polygonB.m_normals[rf.i1]);
        manifold.localPoint.copyFrom(polygonB.m_vertices[rf.i1]);
    }

    let pointCount = 0;
    for (let i = 0; i < Settings.maxManifoldPoints; ++i) {
        const separation = Vec2.dot(rf.normal, Vec2.sub(clipPoints2[i].v, rf.v1));

        if (separation <= radius) {
            const cp = manifold.points[pointCount]; // ManifoldPoint

            if (primaryAxis.type === EPAxisType.e_edgeA) {
                // cp.localPoint.copyFrom(Transform.mulTVec2(xf, clipPoints2[i].v));
                Transform._mulTVec2(xf, clipPoints2[i].v, cp.localPoint);

                cp.cf.copyFrom(clipPoints2[i].cf);
            } else {
                cp.localPoint.copyFrom(clipPoints2[i].v);
                cp.cf.typeA = clipPoints2[i].cf.typeB;
                cp.cf.typeB = clipPoints2[i].cf.typeA;
                cp.cf.indexA = clipPoints2[i].cf.indexB;
                cp.cf.indexB = clipPoints2[i].cf.indexA;
            }

            ++pointCount;
        }
    }

    manifold.pointCount = pointCount;
}
