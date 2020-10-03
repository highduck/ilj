import { Lcg32 } from '..';

test('simple lcg32 check', () => {
  const lcg = new Lcg32();
  const seed = lcg.seed;
  const next = lcg.next();
  expect(next).not.toStrictEqual(seed);
  lcg.seed = seed;
  expect(lcg.next()).toStrictEqual(next);
});
