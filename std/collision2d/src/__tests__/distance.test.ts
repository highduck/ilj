import {distanceToRect} from '..';
import {Recta, Vec2} from "@highduck/math";

test('distance to rect', ()=> {
  expect(distanceToRect(new Recta(0, 0, 1, 1), new Vec2(0, 0))).toBeCloseTo(0);
  expect(distanceToRect(new Recta(0, 0, 1, 1), new Vec2(2, 2))).toBeCloseTo(Math.sqrt(2));
  expect(distanceToRect(new Recta(0, 0, 1, 1), new Vec2(0.5, -1))).toBeCloseTo(1);
});
