import {Buffer, BufferType} from "../graphics/Buffer";
import {Graphics} from "../graphics/Graphics";
import {VERTEX_2D} from "../graphics/VertexDecl";
import {assert} from "../util/assert";
import {BatcherState} from "./BatcherState";
import {BufferedBuffer} from "./BufferedBuffer";

const MAX_INDICES_LIMIT = 0x100000;
const MAX_VERTICES_LIMIT = 0xFFFF;

export class Batcher {

    readonly state = new BatcherState(this.graphics);

    private readonly vertexBuffer: BufferedBuffer;
    private readonly indexBuffer: BufferedBuffer;
    private readonly vertexMaxSize: number;
    private readonly vertexIndexMax: number;
    private verticesCount = 0;
    private indicesCount = 0;
    private nextVertexPointer = 0;
    private nextIndexPointer = 0;

    readonly vertexMemory: Uint8Array;
    readonly indexMemory: Uint16Array;
    vertexPointer = 0;
    indexPointer = 0;

    private readonly vertexSize: number;
    baseVertex = 0;

    uploadAsWebGL2: boolean;

    constructor(readonly graphics: Graphics) {
        this.uploadAsWebGL2 = graphics.gl instanceof WebGL2RenderingContext;

        const vertexMaxSize = VERTEX_2D.size;
        const verticesLimit = MAX_VERTICES_LIMIT;
        const indicesLimit = MAX_INDICES_LIMIT;

        if (!!DEBUG) {
            assert(vertexMaxSize > 0 && vertexMaxSize % 4 === 0);
            assert(verticesLimit > 0 && verticesLimit <= MAX_VERTICES_LIMIT);
            assert(indicesLimit > 0 && indicesLimit <= MAX_INDICES_LIMIT);
        }

        this.vertexSize = vertexMaxSize;
        this.vertexMaxSize = vertexMaxSize;
        this.vertexIndexMax = verticesLimit - 1;

        this.nextIndexPointer = 0;

        this.vertexMemory = new Uint8Array(verticesLimit * vertexMaxSize);
        this.indexMemory = new Uint16Array(indicesLimit);

        this.vertexBuffer = new BufferedBuffer(this.graphics, BufferType.Vertex);
        this.indexBuffer = new BufferedBuffer(this.graphics, BufferType.Index);
    }

    getVertexIndex(baseVertex = 0): number {
        return this.baseVertex + baseVertex;
    }

    dispose() {
        this.vertexBuffer.dispose();
        this.indexBuffer.dispose();
    }

    nextFrame() {
        this.vertexBuffer.nextFrame();
        this.indexBuffer.nextFrame();
    }

    draw() {
//        glGenVertexArrays(1, &vao);
//        glCheckError();
//        glBindVertexArray(vao);
//        glCheckError();

        if (this.state.curr.program) {
            const program = this.state.curr.program;

            const vb = this.vertexBuffer.request();
            const ib = this.indexBuffer.request();
            if (this.uploadAsWebGL2) {
                vb.upload2(this.vertexMemory, 0, this.nextVertexPointer << 2);
                ib.upload2(this.indexMemory, 0, this.nextIndexPointer << 1);
            } else {
                vb.upload(this.vertexMemory, 0, this.nextVertexPointer << 2);
                ib.upload(this.indexMemory, 0, this.nextIndexPointer << 1);
            }

            program.bindAttributes();
            program.bindImage();

            this.graphics.drawTriangles(this.indicesCount);

            program.unbindAttributes();

//        glBindVertexArray(0);
//        glCheckError();
//        glDeleteVertexArrays(1, &vao);
//        glCheckError();
        }

        // reset stream pointers
        this.nextIndexPointer = 0;
        this.indicesCount = 0;
        this.nextVertexPointer = 0;
        this.verticesCount = 0;
    }

    allocTriangles(verticesCount: number, indicesCount: number) {
        if (this.state.anyChanged || (this.verticesCount + verticesCount) > this.vertexIndexMax) {
            this.flush();
            this.state.invalidate();
        }

        this.baseVertex = this.verticesCount;
        this.indexPointer = this.nextIndexPointer;
        this.nextIndexPointer += indicesCount;
        this.indicesCount += indicesCount;

        this.vertexPointer = this.nextVertexPointer;
        this.nextVertexPointer += (verticesCount * this.vertexSize) >>> 2;
        this.verticesCount += verticesCount;
    }

    flush() {
        this.state.apply();
        if (this.verticesCount > 0) {
            this.draw();
        }
    }

    invalidateForce(): void {
        // if (this.state.changed || true) {
        this.flush();
        this.state.invalidate();
        // }

        // mesh.bind();

        this.state.apply();
    }

    drawMesh(vb: Buffer, ib: Buffer, indicesCount: number) {
        if (this.state.curr.program) {
            const program = this.state.curr.program;
            this.graphics.gl.bindBuffer(vb.type, vb);
            this.graphics.gl.bindBuffer(ib.type, ib);
            program.bindAttributes();
            program.bindImage();
            this.graphics.drawTriangles(indicesCount);
            program.unbindAttributes();
        }
    }

}
