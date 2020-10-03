import {DecodedBitmap} from "./dom";
import {BufferReader} from "./BufferReader";
import {logError} from "./debug";
import jpeg from 'jpeg-js';
import pako from 'pako';

export function decodeBitmap(data: Uint8Array): DecodedBitmap {
    const reader = new BufferReader(data.buffer);
    const sig = reader.readU16();
    if (sig === Signature.ARGB) {
        return readBitmapARGB(reader);
    } else if (sig === Signature.CLUT) {
        return readBitmap256(reader);
    } else if (sig === Signature.JPEG) {
        return readBitmapJPEG(reader);
    }

    throw `Unknown signature: 0x${sig.toString(16).toUpperCase()}`;
}

// thanks to https://github.com/charrea6/flash-hd-upscaler/blob/master/images.py
const enum Signature {
    JPEG = 0xD8FF,
    ARGB = 0x0503,
    CLUT = 0x0303
}

interface Header {
    stride: number;
    width: number;
    height: number;
    flags: number;
}

function readHeader(reader: BufferReader): Header {
    const stride = reader.readU16();
    const width = reader.readU16();
    const height = reader.readU16();
    reader.readU32(); // widthHigh
    const widthTwips = reader.readU32();
    reader.readU32(); // heightHigh
    const heightTwips = reader.readU32();
    const flags = reader.readU8();

    // simple validation twips to pixels
    if (widthTwips !== width * 20 || heightTwips !== height * 20) {
        throw "Header bitmap size information corrupted";
    }

    return {
        stride,
        width,
        height,
        flags
    };
}

// to ARGB to RGBA for Google Skia default surface format
// un-multiply by alpha :(
function convertPixelFormat(data: Uint8Array) {
    for (let i = 0; i < data.length; i += 4) {
        const a = data[i];
        const r = data[i + 1];
        const g = data[i + 2];
        const b = data[i + 3];
        if (a < 255 && a > 0) {
            const k = 255 / a;
            data[i] = Math.min(255, r * k) | 0;
            data[i + 1] = Math.min(255, g * k) | 0;
            data[i + 2] = Math.min(255, b * k) | 0;
        } else {
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }
        data[i + 3] = a;
    }
}

function unzipChunks(reader: BufferReader, dest: Uint8Array): number {
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

    // const result = zlib.unzipSync(buffer);
    const result = pako.inflate(buffer);
    dest.set(result, 0);
    return result.length;
}

function readBitmapARGB(reader: BufferReader): DecodedBitmap {
    const desc = readHeader(reader);
    const pixels = new Uint8Array(desc.width * desc.height * 4);
    if ((reader.readU8() & 1) !== 0) {
        // compressed
        const written = unzipChunks(reader, pixels);
        if (written !== pixels.length) {
            throw "Buffer unzip error";
        }
    } else {
        // copy raw pixels
        pixels.set(new Uint8Array(reader.buf, reader.pos, pixels.length));
    }

    convertPixelFormat(pixels);

    return {
        width: desc.width,
        height: desc.height,
        data: pixels
    };
}

function readBitmap256(reader: BufferReader): DecodedBitmap {
    const desc = readHeader(reader);
    let nColors = reader.readU8();
    if (nColors === 0) {
        nColors = 0xFF;
    }
    reader.readU16(); // read padding to align
    const colorTable = new Uint32Array(nColors);
    for (let i = 0; i < nColors; ++i) {
        colorTable[i] = reader.readU32();
    }
    if (colorTable.length > 0 && (desc.flags & 0x1) !== 0) {
        // transparent
        colorTable[0] = 0x0;
    }
    const p8 = new Uint8Array(desc.stride * desc.height);
    const written = unzipChunks(reader, p8);
    if (written !== p8.length) {
        logError("bitmap decompress error");
    }

    const pixels = new Uint8Array(desc.width * desc.height * 4);
    const buff = new Uint32Array(pixels.buffer);
    for (let i = 0; i < buff.length; ++i) {
        buff[i] = colorTable[p8[i]];
    }
    return {
        width: desc.width,
        height: desc.height,
        data: pixels
    };
}

function readBitmapJPEG(reader: BufferReader) {
    // read jpeg from the data buffer beginning
    const result = jpeg.decode(reader.buf, {useTArray: true, formatAsRGBA: true});
    return {
        width: result.width,
        height: result.height,
        data: result.data
    };
}