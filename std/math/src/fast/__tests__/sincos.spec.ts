import { cos, sin } from '..';

test('cos sin non allowed numbers just returns something', () => {
  // TODO: better to make Debug-assert on isFinite and test Exception (DEBUG) and Pass (RELEASE)
  expect(sin(Infinity)).toBeDefined();
  expect(sin(-Infinity)).toBeDefined();
  expect(cos(Infinity)).toBeDefined();
  expect(cos(-Infinity)).toBeDefined();
  expect(sin(NaN)).toBeDefined();
  expect(cos(NaN)).toBeDefined();
});

const testValues: number[] = [];
for (let a = -10; a < 10; a += 0.1) {
  testValues.push(a);
}

test('sin values', () => {
  for (const a of testValues) {
    expect(sin(a)).toBeCloseTo(Math.sin(a), 3);
  }
});

test('cos values', () => {
  for (const a of testValues) {
    expect(cos(a)).toBeCloseTo(Math.cos(a), 3);
  }
});
