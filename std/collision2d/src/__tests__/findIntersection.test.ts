import {intersectRayRect} from "../findIntersection";
import {IntersectionResult} from "../intersectionResult";
import {Recta, Vec2} from "@highduck/math";

test('intersect ray vs rect', ()=>{
  const result = new IntersectionResult();
  intersectRayRect(new Recta(0, 0, 1, 1), new Vec2(-1, -1), new Vec2(2, 2), result);
  expect(result.hit).toBeTruthy();
  expect(result.u0).toBeCloseTo(0.5);

  intersectRayRect(new Recta(0, 0, 1, 1), new Vec2(-1, -1), new Vec2(-2, -2), result);
  expect(result.hit).toBeFalsy();
});
