import {Buffer, BufferType, BufferUsage} from "../graphics/Buffer";
import {Graphics} from "../graphics/Graphics";

export class BufferedBuffer {

    private readonly buffers: Buffer[] = [];
    private next: number = 0;
    private frame: number = 0;

    constructor(readonly graphics: Graphics,
                readonly type: BufferType,
                // triple-buffering
                readonly frames: number = 3) {
    }

    request(): Buffer {
        if (this.next === this.buffers.length) {
            this.buffers.push(new Buffer(this.graphics, this.type, BufferUsage.Dynamic));
        }
        return this.buffers[this.next++];
    }

    nextFrame() {
        ++this.frame;
        if (this.frame >= this.frames) {
            this.frame = 0;
            this.next = 0;
        }
    }

    dispose() {
        for (let i = 0; i < this.buffers.length; ++i) {
            this.buffers[i].dispose();
        }
    }
}
