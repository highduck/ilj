
export class BufferReader {

    pos = 0;
    u8: Uint8Array;
    u16: Uint16Array;
    u32: Uint32Array;

    constructor(readonly buf: ArrayBuffer) {
        this.u8 = new Uint8Array(this.buf, 0);
        this.u16 = new Uint16Array(this.buf, 0, this.buf.byteLength >>> 1);
        this.u32 = new Uint32Array(this.buf, 0, this.buf.byteLength >>> 2);
    }

    readU8() {
        return this.u8[this.pos++];
    }

    readU16() {
        const v = this.u16[this.pos >>> 1];
        this.pos += 2;
        return v;
    }

    readU16_unaligned() {
        return this.readU8() | (this.readU8() << 8);
    }

    readU32() {
        const v = this.u32[this.pos >>> 2];
        this.pos += 4;
        return v;
    }

    seek(offset: number) {
        this.pos += offset;
    }
}
