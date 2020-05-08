import {Bitmap} from "./types";
import {Entry} from "./Entry";
import zlib from 'zlib';
import jpeg from 'jpeg-js';

// thanks to https://github.com/charrea6/flash-hd-upscaler/blob/master/images.py
const JPEG_MAGIC = 0xd8ff;
const ARGB_MAGIC = 0x0503;
const CLUT_MAGIC = 0x0303;

class BitmapDataDesc {
    magic = 0; // uint16
    stride = 0; // uint16_t
    width = 0; //uint16_t
    height = 0;//uint16_t
    widthHigh = 0; //uint32_t
    widthTwips = 0; //uint32_t
    heightHigh = 0; //uint32_t
    heightTwips = 0; //uint32_t
    private flags = 0; // flags , uint8_t

    read(reader: BufferReader) {
        this.magic = reader.readU16();
        console.info('magic', '0x' + this.magic.toString(16));

        if (this.magic === ARGB_MAGIC || this.magic === CLUT_MAGIC) {
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

            this.flags = reader.readU8();
            return true;
        } else if (this.magic === JPEG_MAGIC) {
            return true;
        } else {
            console.error('Unknown DAT image header tag: ' + this.magic.toString(16));
        }
        return false;
    }

    dump() {
        console.info('stride', this.stride);
        console.info('width', this.width);
        console.info('height', this.height);
        console.info('widthHigh', this.widthHigh);
        console.info('widthTwips', this.widthTwips);
        console.info('heightHigh', this.heightHigh);
        console.info('heightTwips', this.heightTwips);
        console.info('flags', '0x' + this.flags.toString(16));
    }

    get hasAlpha(): boolean {
        return (this.flags & 0x01) !== 0;
    }
}

// to ARGB to RGBA for Google Skia default surface format
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

function uncompress(reader: BufferReader, dest: Uint8Array): number {
    let chunkSize = reader.readU16_unaligned();
    const buffers = [];
    let allSize = 0;
    while (chunkSize > 0) {
        allSize += chunkSize;
        buffers.push(new Uint8Array(reader.buf, reader.pos, chunkSize));
        reader.seek(chunkSize);
        chunkSize = reader.readU16_unaligned();
    }

    const buffer = new Uint8Array(allSize);
    let off = 0;
    for (const b of buffers) {
        buffer.set(b, off);
        off += b.length;
    }

    const result = zlib.unzipSync(buffer);
    dest.set(result, 0);
    return result.length;
}

export function loadBitmap(entry: Entry): Bitmap {
    const data = entry.buffer().buffer;
    const reader = new BufferReader(data);
    const desc = new BitmapDataDesc();
    const success = desc.read(reader);
    if (!success) {
        console.error(`Bitmap data loading error`, '0x' + desc.magic.toString(16), entry.path);
    }

    const bitmap = new Bitmap();
    bitmap.width = desc.width;
    bitmap.height = desc.height;
    bitmap.bpp = 4;
    bitmap.alpha = true;

    if (desc.magic === ARGB_MAGIC) {
        const bitmapBytesLength = desc.stride * desc.height;
        bitmap.data = new Uint8Array(bitmap.width * bitmap.height * 4);
        // compressed or not?
        const compressed = (reader.readU8() & 1) !== 0;
        if (compressed) {
            const written = uncompress(reader, bitmap.data);
            if (written !== bitmapBytesLength) {
                console.error("bitmap decompress error");
            }
        } else {
            bitmap.data.set(new Uint8Array(reader.buf, reader.pos, bitmapBytesLength));
            reader.pos += bitmapBytesLength;
        }
        convertColors(bitmap.data);

    } else if (desc.magic === CLUT_MAGIC) {
        let nColors = reader.readU8();
        if (nColors === 0) {
            nColors = 0xFF;
        }
        reader.readU16(); // read align space
        //console.info(entry.path);
        const colorTable = new Uint32Array(nColors);
        for (let i = 0; i < nColors; ++i) {
            colorTable[i] = reader.readU32();
        }
        if (colorTable.length > 0 && desc.hasAlpha) {
            // transparent
            colorTable[0] = 0x0;
        }
        const dataLength = desc.stride * desc.height;
        const data = new Uint8Array(dataLength);
        const written = uncompress(reader, data);
        if (written !== dataLength) {
            console.error("bitmap decompress error");
        }

        const buff = new Uint32Array(bitmap.width * bitmap.height);
        for (let i = 0; i < dataLength; ++i) {
            buff[i] = colorTable[data[i]];
        }
        bitmap.data = new Uint8Array(buff.buffer);
    } else if (desc.magic === JPEG_MAGIC) {
        console.warn('jpeg reading...');
        const result = jpeg.decode(data, {useTArray: true, formatAsRGBA: true});
        bitmap.width = result.width;
        bitmap.height = result.height;
        bitmap.data = result.data;
    } else {
        desc.dump();
        throw 'Unknown bitmap format';
    }

    //savePNG('_' + entry.path + '.png', bitmap);

    return bitmap;
}