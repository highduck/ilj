import {readUInt32LE, writeInt32LE} from "./buffer";

let CRC_32_TABLE: undefined | Uint32Array = undefined;

function createCRC32Table() {
    const b = new Uint8Array(4);
    const table = new Uint32Array(256);
    for (let n = 0; n < table.length; ++n) {
        let c = n;
        for (let k = 8; --k >= 0;) {
            if ((c & 1) !== 0) {
                c = 0xEDB88320 ^ (c >>> 1);
            } else {
                c = c >>> 1;
            }
        }
        if (c < 0) {
            writeInt32LE(b, c, 0);
            c = readUInt32LE(b, 0);
        }
        table[n] = c;
    }
    return table;
}

export function crc32(buf: Uint8Array): number {
    if (CRC_32_TABLE === undefined) {
        CRC_32_TABLE = createCRC32Table();
    }
    let crc = 0;
    let off = 0;
    let len = buf.length;
    let c1 = ~crc;
    while (--len >= 0) {
        c1 = CRC_32_TABLE[(c1 ^ buf[off++]) & 0xFF] ^ (c1 >>> 8);
    }
    crc = ~c1;
    const b = new Uint8Array(4);
    writeInt32LE(b, crc & 0xFFFFFFFF, 0);
    return readUInt32LE(b, 0);
}