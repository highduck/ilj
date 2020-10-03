import { absSMI, signSMI } from '..';

// test('smi type', () => {
//   process.env.DEBUG = 'true';
//   expect(() => absSMI(2 ** 32)).toThrowError('not SMI');
//   expect(() => absSMI(0.01)).toThrowError('not SMI');
//   expect(() => signSMI(2 ** 32)).toThrowError('not SMI');
//   expect(() => signSMI(-0.01)).toThrowError('not SMI');
// });

test('smi math', () => {
  expect(absSMI(-100)).toBe(100);
  expect(absSMI(1900)).toBe(1900);
  expect(signSMI(-100)).toBe(-1);
  expect(signSMI(0)).toBe(0);
  expect(signSMI(1111)).toBe(1);
});
