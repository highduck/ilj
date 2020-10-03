import { toU8s } from '../buffer';
import { crc32 } from '../crc32';

test('crc32 default cases', () => {
  // Empty
  expect(crc32(new Uint8Array())).toStrictEqual(0);

  // Source: https://rosettacode.org/wiki/CRC-32
  expect(crc32(toU8s('The quick brown fox jumps over the lazy dog'))).toStrictEqual(0x414fa339);

  // Source: http://cryptomanager.com/tv.html
  expect(crc32(toU8s('various CRC algorithms input data'))).toStrictEqual(0x9bd366ae);

  // Source: http://www.febooti.com/products/filetweak/members/hash-and-crc/test-vectors/
  expect(crc32(toU8s('Test vector from febooti.com'))).toStrictEqual(0x0c877f61);

  // Source: https://github.com/froydnj/ironclad/blob/master/testing/test-vectors/crc32.testvec
  expect(crc32(toU8s('a'))).toStrictEqual(0xe8b7be43);
  expect(crc32(toU8s('abc'))).toStrictEqual(0x352441c2);
  expect(crc32(toU8s('message digest'))).toStrictEqual(0x20159d7f);
  expect(crc32(toU8s('abcdefghijklmnopqrstuvwxyz'))).toStrictEqual(0x4c2750bd);
  expect(
    crc32(toU8s('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')),
  ).toStrictEqual(0x1fc2e6d2);
  expect(
    crc32(
      toU8s('12345678901234567890123456789012345678901234567890123456789012345678901234567890'),
    ),
  ).toStrictEqual(0x7ca94a72);
});
