class BatchWriter {
    f32: Float32Array;
    u32: Uint32Array;
    indices: Uint16Array;

    vi = 0;
    ii = 0;

    baseVertex = 0;

    constructor(vertexMemoryBuffer:ArrayBufferLike, indexMemory:Uint16Array) {
        this.f32 = new Float32Array(vertexMemoryBuffer, 0);
        this.u32 = new Uint32Array(vertexMemoryBuffer, 0);
        this.indices = indexMemory;
    }
    
    getVertexIndex(baseVertex:number): number {
        return this.baseVertex + baseVertex;
    }


}