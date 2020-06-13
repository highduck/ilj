export function writeUInt32LE(buf: Uint8Array, value: number, offset: number) {
    buf[offset++] = (value & 0xff);
    buf[offset++] = (value >>> 8) & 0xFF;
    buf[offset++] = (value >>> 16) & 0xFF;
    buf[offset++] = (value >>> 24) & 0xFF;
}

export function writeUInt16LE(buf: Uint8Array, value: number, offset: number) {
    buf[offset++] = (value & 0xff);
    buf[offset++] = (value >>> 8) & 0xFF;
}

export function writeInt32LE(buf: Uint8Array, value: number, offset: number) {
    buf[offset++] = value & 0xff;
    buf[offset++] = (value >>> 8) & 0xFF;
    buf[offset++] = (value >>> 16) & 0xFF;
    buf[offset++] = value >>> 24;
}

export function readUInt32LE(buf: Uint8Array, offset: number): number {
    return ((buf[offset]) |
        (buf[offset + 1] << 8) |
        (buf[offset + 2] << 16)) +
        (buf[offset + 3] * 0x1000000);
}

export function readUInt16LE(buf: Uint8Array, offset: number): number {
    return buf[offset] | (buf[offset + 1] << 8);
}

/////
export function readBigUInt64LE(data: Uint8Array, index: number) {
    const buf = Buffer.from(data.slice(index, index + 8));
    buf.swap64();
    return parseInt(`0x${buf.toString('hex')}`);
}

export function toBuffer(input: any) {
    if (Buffer.isBuffer(input)) {
        return input;
    }
    if (input.length === 0) {
        return Buffer.alloc(0)
    }
    return Buffer.from(input, 'utf8');
}

export function toU8s(input: string | Buffer | Uint8Array): Uint8Array {
    if (typeof input === 'string') {
        return encodeString(input);
    }
    return input;
}

export function readUInt64LE(buffer: Uint8Array, offset: number): number {
    return (readUInt32LE(buffer, offset + 4) << 4) + readUInt32LE(buffer, offset);
}

export function decodeString(buf: Uint8Array, encoding?: BufferEncoding): string {
    return Buffer.from(buf).toString(encoding);
}

export function encodeString(str: string, encoding?: BufferEncoding): Uint8Array {
    return Buffer.from(str, encoding);
}