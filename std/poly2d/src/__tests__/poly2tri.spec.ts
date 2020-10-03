import { Poly2Tri } from '..';

test('general test', () => {
  const poly2tri = new Poly2Tri();
  poly2tri.region([1.0, 1.0, 0.0, 1.0, 0.0, 0.0]);
  const indices0 = poly2tri.triangulate(0);
  const indices1 = poly2tri.triangulate(1);
  expect(indices0).toStrictEqual(new Uint16Array([0, 1, 2]));
  expect(indices1).toStrictEqual(new Uint16Array([1, 2, 3]));
});
