import { abs, ceil, floor, round, sign } from '..';

test('abs number', () => {
  expect(abs(-1.0)).toBe(1);
  expect(abs(10.0)).toBe(10);
  expect(abs(-Infinity)).toBe(Infinity);
  expect(abs(Infinity)).toBe(Infinity);
  expect(abs(NaN)).toBeNaN();
});

test('0', () => {
  expect(ceil(0)).toBe(0);
  expect(ceil(-0)).toBe(-0);
  expect(ceil(-0.1)).toBe(0);
  expect(ceil(-1.1)).toBe(-1);
  expect(ceil(-1)).toBe(-1);
  expect(ceil(1.1)).toBe(2);
  expect(ceil(2)).toBe(2);

  expect(floor(0)).toBe(0);
  expect(floor(-0)).toBe(-0);
  expect(floor(-0.1)).toBe(-1);
  expect(floor(-1)).toBe(-1);
  expect(floor(1)).toBe(1);

  expect(round(0)).toBe(0);
  expect(round(-0)).toBe(0);
  /** **/
  expect(round(-0.5)).toBe(-1);
  expect(round(0.5)).toBe(1);

  expect(sign(0)).toBe(0);
  expect(sign(-0)).toBe(0);
  /** **/
  expect(sign(-0.5)).toBe(-1);
  expect(sign(0.5)).toBe(1);

  expect(abs(0)).toBe(0);
  expect(abs(-0)).toBe(-0);
  expect(abs(-1)).toBe(1);
  expect(abs(1)).toBe(1);
});

test('number utility functions', () => {
  for (let x = -5.0; x <= 5.0; x += 0.0125) {
    // Math ceil and round `-0.1` returns `-0`, so just convert to integer value `|0`
    expect(ceil(x)).toBe(Math.ceil(x) | 0);
    expect(floor(x)).toBe(Math.floor(x));
    expect(round(x)).toBe(Math.round(x) | 0);
    expect(sign(x)).toBe(Math.sign(x));
    expect(abs(x)).toBe(Math.abs(x));
  }
});
