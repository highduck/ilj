import {Shape, ShapeType} from "../Shape";
import {Settings} from "../Settings";
import {assert} from "../util/common";
import {Vec2} from "../common/Vec2";
import {Transform} from "../common/Transform";
import {EdgeShape} from "./EdgeShape";
import {DistanceProxy} from "../collision/Distance";
import {MassData} from "../MassData";
import {RayCastInput, RayCastOutput} from "../collision/RayCastOptions";
import {AABB} from "../collision/AABB";


/**
 * A chain shape is a free form sequence of line segments. The chain has
 * two-sided collision, so you can use inside and outside collision. Therefore,
 * you may use any winding order. Connectivity information is used to create
 * smooth collisions.
 *
 * WARNING: The chain will not collide properly if there are self-intersections.
 */
export class ChainShape extends Shape {
    static TYPE: ShapeType = 'chain';

    m_vertices: Vec2[] = [];
    m_count = 0;
    m_prevVertex: undefined | Vec2 = undefined;
    m_nextVertex: undefined | Vec2 = undefined;
    m_hasPrevVertex = false;
    m_hasNextVertex = false;

    m_isLoop: boolean;

    constructor(vertices?: Vec2[], loop: boolean = false) {
        super(ChainShape.TYPE);
        this.m_radius = Settings.polygonRadius;
        this.m_isLoop = loop;

        if (vertices && vertices.length) {
            if (loop) {
                this._createLoop(vertices);
            } else {
                this._createChain(vertices);
            }
        }
    }

    // TODO: serialization
    // _serialize() {
    //     return {
    //         type: this.m_type,
    //         vertices: this.m_vertices,
    //         isLoop: this.m_isLoop,
    //         hasPrevVertex: this.m_hasPrevVertex,
    //         hasNextVertex: this.m_hasNextVertex,
    //         prevVertex: this.m_prevVertex,
    //         nextVertex: this.m_nextVertex
    //     };
    // }
    //
    // static _deserialize(data) {
    //     const shape = new ChainShape(data.vertices.map(Vec2._deserialize), data.isLoop);
    //     if (data.prevVertex) {
    //         shape._setPrevVertex(data.prevVertex);
    //     }
    //     if (data.nextVertex) {
    //         shape._setNextVertex(data.nextVertex);
    //     }
    //     return shape;
    // }

    // clear() {
    //     this.m_vertices.length = 0;
    //     this.m_count = 0;
    // }

    /**
     * Create a loop. This automatically adjusts connectivity.
     *
     * @param vertices an array of vertices, these are copied
     * @param count the vertex count
     */
    private _createLoop(vertices: Vec2[]) {
        if (PLANCK_ASSERT) {
            assert(this.m_vertices.length == 0 && this.m_count == 0);
            assert(vertices.length >= 3);
            for (let i = 1; i < vertices.length; ++i) {
                const v1 = vertices[i - 1];
                const v2 = vertices[i];
                // If the code crashes here, it means your vertices are too close together.
                assert(Vec2.distanceSquared(v1, v2) > Settings.linearSlopSquared);
            }
        }

        this.m_vertices.length = 0;
        this.m_count = vertices.length + 1;
        for (let i = 0; i < vertices.length; ++i) {
            this.m_vertices[i] = vertices[i].clone();
        }
        this.m_vertices[vertices.length] = vertices[0].clone();
        this.m_prevVertex = this.m_vertices[this.m_count - 2];
        this.m_nextVertex = this.m_vertices[1];
        this.m_hasPrevVertex = true;
        this.m_hasNextVertex = true;
        return this;
    }

    /**
     * Create a chain with isolated end vertices.
     *
     * @param vertices an array of vertices, these are copied
     * @param count the vertex count
     */
    private _createChain(vertices: Vec2[]) {
        if (PLANCK_ASSERT) {
            assert(this.m_vertices.length == 0 && this.m_count == 0);
            assert(vertices.length >= 2);
            for (let i = 1; i < vertices.length; ++i) {
                // If the code crashes here, it means your vertices are too close together.
                const v1 = vertices[i - 1];
                const v2 = vertices[i];
                assert(Vec2.distanceSquared(v1, v2) > Settings.linearSlopSquared);
            }
        }

        this.m_count = vertices.length;
        for (let i = 0; i < vertices.length; ++i) {
            this.m_vertices[i] = vertices[i].clone();
        }

        this.m_hasPrevVertex = false;
        this.m_hasNextVertex = false;
        this.m_prevVertex = undefined;
        this.m_nextVertex = undefined;
        return this;
    }

    /**
     * Establish connectivity to a vertex that precedes the first vertex. Don't call
     * this for loops.
     */
    private _setPrevVertex(prevVertex: Vec2) {
        this.m_prevVertex = prevVertex;
        this.m_hasPrevVertex = true;
    }

    /**
     * Establish connectivity to a vertex that follows the last vertex. Don't call
     * this for loops.
     */
    private _setNextVertex(nextVertex: Vec2) {
        this.m_nextVertex = nextVertex;
        this.m_hasNextVertex = true;
    }

    /**
     * @deprecated
     */
    _clone() {
        const clone = new ChainShape(this.m_vertices);
        clone._createChain(this.m_vertices);
        clone.m_type = this.m_type;
        clone.m_radius = this.m_radius;
        clone.m_prevVertex = this.m_prevVertex;
        clone.m_nextVertex = this.m_nextVertex;
        clone.m_hasPrevVertex = this.m_hasPrevVertex;
        clone.m_hasNextVertex = this.m_hasNextVertex;
        return clone;
    }

    getChildCount() {
        // edge count = vertex count - 1
        return this.m_count - 1;
    }

// Get a child edge.
    getChildEdge(edge: EdgeShape, childIndex: number) {
        PLANCK_ASSERT && assert(0 <= childIndex && childIndex < this.m_count - 1);
        edge.m_type = EdgeShape.TYPE;
        edge.m_radius = this.m_radius;

        edge.m_vertex1 = this.m_vertices[childIndex];
        edge.m_vertex2 = this.m_vertices[childIndex + 1];

        if (childIndex > 0) {
            edge.m_vertex0 = this.m_vertices[childIndex - 1];
            edge.m_hasVertex0 = true;
        } else {
            edge.m_vertex0 = this.m_prevVertex!;
            edge.m_hasVertex0 = this.m_hasPrevVertex;
        }

        if (childIndex < this.m_count - 2) {
            edge.m_vertex3 = this.m_vertices[childIndex + 2];
            edge.m_hasVertex3 = true;
        } else {
            edge.m_vertex3 = this.m_nextVertex!;
            edge.m_hasVertex3 = this.m_hasNextVertex;
        }
    }

    getVertex(index: number) {
        PLANCK_ASSERT && assert(0 <= index && index <= this.m_count);
        if (index < this.m_count) {
            return this.m_vertices[index];
        } else {
            return this.m_vertices[0];
        }
    }

    /**
     * This always return false.
     */
    testPoint(xf: Transform, p: Vec2) {
        return false;
    }

    rayCast(output: RayCastOutput, input: RayCastInput, xf: Transform, childIndex: number) {
        PLANCK_ASSERT && assert(0 <= childIndex && childIndex < this.m_count);

        const edgeShape = new EdgeShape(this.getVertex(childIndex), this.getVertex(childIndex + 1));
        return edgeShape.rayCast(output, input, xf, 0);
    }

    computeAABB(aabb: AABB, xf: Transform, childIndex: number) {
        PLANCK_ASSERT && assert(0 <= childIndex && childIndex < this.m_count);

        const v1 = Transform.mulVec2(xf, this.getVertex(childIndex));
        const v2 = Transform.mulVec2(xf, this.getVertex(childIndex + 1));

        aabb.combinePoints(v1, v2);
    }

    /**
     * Chains have zero mass.
     */
    computeMass(massData: MassData, density: number) {
        massData.mass = 0.0;
        massData.center.setZero();
        massData.I = 0.0;
    }

    computeDistanceProxy(proxy: DistanceProxy, childIndex: number) {
        PLANCK_ASSERT && assert(0 <= childIndex && childIndex < this.m_count);
        proxy.m_buffer[0] = this.getVertex(childIndex);
        proxy.m_buffer[1] = this.getVertex(childIndex + 1);
        proxy.m_vertices = proxy.m_buffer;
        proxy.m_count = 2;
        proxy.m_radius = this.m_radius;
    }
}

Shape.TYPES[ChainShape.TYPE] = ChainShape;
