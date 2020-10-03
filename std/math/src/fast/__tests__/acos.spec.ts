import { acos } from '..';

test('acos NaN cases', () => {
  expect(acos(-1.1)).toBeNaN();
  expect(acos(1.1)).toBeNaN();
  expect(acos(Infinity)).toBeNaN();
  expect(acos(-Infinity)).toBeNaN();
  expect(acos(NaN)).toBeNaN();
});

test('acos corners', () => {
  expect(acos(-1)).toBeCloseTo(Math.acos(-1), 6);
  expect(acos(1)).toBeCloseTo(Math.acos(1), 6);
});

test('acos zero precision', () => {
  expect(acos(0)).toBeCloseTo(Math.acos(0), 7);
});

test('acos range precision', () => {
  const N = 10;
  for (let i = 0; i <= N; ++i) {
    const a = -1.0 + (2.0 * i) / N;
    expect(acos(a)).toBeCloseTo(Math.acos(a), 4);
  }
});
