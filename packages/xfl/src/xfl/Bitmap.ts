import {Bitmap} from "./types";
import {Entry} from "./Entry";
import zlib from 'zlib';

class bitmap_desc_t {
    tag1 = 0; // uint8
    tag2 = 0; // uint8
    stride = 0; // uint16_t
    width = 0; //uint16_t
    height = 0;//uint16_t
    widthHigh = 0; //uint32_t
    widthTwips = 0; //uint32_t
    heightHigh = 0; //uint32_t
    heightTwips = 0; //uint32_t
    alpha = 0; // flags , uint8_t
    compressed = 0; // flags, uint8_t

    read(reader: BufferReader) {
        this.tag1 = reader.readU8();
        this.tag2 = reader.readU8();
        if (this.tag1 === 0x3 && this.tag2 === 0x5) {
            this.stride = reader.readU16();
            this.width = reader.readU16();
            this.height = reader.readU16();
            this.widthHigh = reader.readU32();
            this.widthTwips = reader.readU32();
            this.heightHigh = reader.readU32();
            this.heightTwips = reader.readU32();

            console.assert(this.widthTwips === this.width * 20,
                `${this.widthTwips} | ${this.width}`);
            console.assert(this.heightTwips === this.height * 20,
                `${this.heightTwips} | ${this.height}`);

            this.alpha = reader.readU8();
            this.compressed = reader.readU8();
        } else {
            console.error("unsupported dat");
        }
    }
}

// to A-B-G-R for Google Skia default surface format
function convertColors(data: Uint8Array) {
    for (let i = 0; i < data.length; i += 4) {
        const a = data[i];
        const r = data[i + 1];
        const g = data[i + 2];
        const b = data[i + 3];
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = a;
    }
}

class BufferReader {

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

    readU32() {
        const v = this.u32[this.pos >>> 2];
        this.pos += 4;
        return v;
    }

    seek(offset: number) {
        this.pos += offset;
    }
}

function uncompress(reader: BufferReader, dest: Uint8Array, destSize: number): number {
    let chunkSize = reader.readU16();
    const buffers = [];
    let allSize = 0;
    while (chunkSize > 0) {
        allSize += chunkSize;
        console.log('pos: ' + reader.pos, ' chunkSize: ' + chunkSize, ' bufsize: ' + reader.buf.byteLength);
        console.log();
        buffers.push(new Uint8Array(reader.buf, reader.pos, chunkSize));
        reader.seek(chunkSize);
        // unaligned reading... :(
        chunkSize = reader.readU8() | (reader.readU8() << 8);
    }

    const buffer = new Uint8Array(allSize);
    let off = 0;
    for (const b of buffers) {
        buffer.set(b, off);
        off += b.length;
    }

    const sz = destSize;
    const resbuffer = zlib.unzipSync(buffer);
    dest.set(resbuffer, 0);
    return resbuffer.length;
}

export function load_bitmap(entry: Entry): Bitmap {
    const bitmap = new Bitmap();
    const data = entry.buffer().buffer;
    const desc = new bitmap_desc_t();
    const reader = new BufferReader(data);
    desc.read(reader);

    bitmap.width = desc.width;
    bitmap.height = desc.height;
    bitmap.bpp = Math.trunc(desc.stride / bitmap.width);
    bitmap.alpha = desc.alpha !== 0;
    bitmap.data = new Uint8Array(bitmap.width * bitmap.height * bitmap.bpp);
    const bm_size = bitmap.data.length;
    if (desc.compressed !== 0) {
        const written = uncompress(reader, bitmap.data, bm_size);
        if (written !== bm_size) {
            console.error("bitmap decompress error");
        }
    } else {
        bitmap.data.set(new Uint8Array(reader.buf, reader.pos, bm_size));
        reader.pos += bm_size;
    }

    convertColors(bitmap.data);

    return bitmap;
}