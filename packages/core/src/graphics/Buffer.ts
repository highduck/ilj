import {Graphics} from "./Graphics";

export enum BufferUsage {
    Static = 35044, // GL.STATIC_DRAW
    // dynamic instead of stream (emscripten guide)
    Dynamic = 35048, //GL.DYNAMIC_DRAW
}

export enum BufferType {
    Vertex = 34962, //GL.ARRAY_BUFFER
    Index = 34963 //GL.ELEMENT_ARRAY_BUFFER
}

export class Buffer {
    buffer: WebGLBuffer;
    size: number;

    constructor(private graphics: Graphics, public type: BufferType, public usage: BufferUsage) {
        const buffer = graphics.gl.createBuffer();
        if (buffer == null) {
            throw new Error("gl.createBuffer");
        }
        this.buffer = buffer;
        this.size = 0;
    }

    dispose() {
        this.graphics.gl.deleteBuffer(this.buffer);
    }

    upload(data: ArrayBufferView, start: number, length: number) {
        //WebGL2RenderingContext
        const GL = this.graphics.gl;
        GL.bindBuffer(this.type, this.buffer);
        if (length !== data.byteLength) {
            data = new Uint8Array(data.buffer, start, length);
        }
        if (length > this.size
            //    || (this.type === BufferType.Index && length < this.size)
        ) {
            GL.bufferData(this.type, data, this.usage);
            this.size = length;
        } else {
            // GL.bufferData(this.type, this.size, this.usage);
            GL.bufferSubData(this.type, 0, data);
        }
    }

    upload2(data: ArrayBufferView, start: number, length: number) {
        const GL = this.graphics.gl as WebGL2RenderingContext;
        GL.bindBuffer(this.type, this.buffer);
        if (length > this.size
            //    || (this.type === BufferType.Index && length < this.size)
        ) {
            GL.bufferData(this.type, data, this.usage, start, length);
            this.size = length;
        } else {
            GL.bufferSubData(this.type, 0, data, start, length);
        }
    }
}
