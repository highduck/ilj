import { readBigUInt64LE, readUInt64LE } from '../buffer';

test('readBigUInt64LE', () => {
  const data = new Uint8Array([0, 0, 0, 0, 1, 0, 0, 0]);
  expect(readBigUInt64LE(data, 0)).toStrictEqual(0x100000000);
  expect(readUInt64LE(data, 0)).toStrictEqual(0x100000000);
});
