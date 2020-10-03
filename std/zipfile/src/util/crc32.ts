const CRC_32_TABLE = createCRC32Table();

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let n = 0; n < table.length; ++n) {
    let c = n;
    for (let k = 8; --k >= 0; ) {
      if ((c & 1) !== 0) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c >>> 0;
  }
  return table;
}

export function crc32(buf: Uint8Array): number {
  let c1 = ~0;
  for (let i = 0; i < buf.length; ++i) {
    c1 = CRC_32_TABLE[(c1 ^ buf[i]) & 0xff] ^ (c1 >>> 8);
  }
  return ~c1 >>> 0;
}
