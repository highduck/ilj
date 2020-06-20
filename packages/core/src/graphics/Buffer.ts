import {Graphics} from "./Graphics";

const GL = WebGLRenderingContext;

export enum BufferUsage {
    Static = GL.STATIC_DRAW,
    // dynamic instead of stream (emscripten guide)
    Dynamic = GL.DYNAMIC_DRAW
}

export enum BufferType {
    Vertex = GL.ARRAY_BUFFER,
    Index = GL.ELEMENT_ARRAY_BUFFER
}

export class Buffer {
    buffer: WebGLBuffer;
    size = 0;

    constructor(private graphics: Graphics, public type: BufferType, public usage: BufferUsage) {
        const buffer = graphics.gl.createBuffer();
        if (buffer == null) {
            throw new Error("gl.createBuffer");
        }
        this.buffer = buffer;
    }

    dispose() {
        this.graphics.gl.deleteBuffer(this.buffer);
    }

    upload(data: Uint8Array) {
        const GL = this.graphics.gl;
        GL.bindBuffer(this.type, this.buffer);
        if (data.byteLength > this.size) {
            GL.bufferData(this.type, data, this.usage);
            this.size = data.byteLength;
        } else {
            // GL.bufferData(this.type, this.size, this.usage);
            GL.bufferSubData(this.type, 0, data);
        }
    }
}
