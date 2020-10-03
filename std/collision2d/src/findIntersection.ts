import { Recta, Vec2 } from '@highduck/math';
import { IntersectionResult } from './intersectionResult';

const EPSILON = 1e-6;

export function intersectRayRect(
  rc: Recta,
  origin: Vec2,
  dir: Vec2,
  result: IntersectionResult,
): IntersectionResult {
  // reset
  result.reset();
  result.u1 = 1000000.0;

  if (Math.abs(dir.x) < EPSILON) {
    if (origin.x < rc.x || origin.x > rc.right) {
      return result;
    }
  } else {
    const ood = 1.0 / dir.x;
    let t1 = ood * (rc.x - origin.x);
    let t2 = ood * (rc.right - origin.x);
    if (t1 > t2) {
      // swap
      [t1, t2] = [t2, t1];
    }
    result.u0 = Math.max(result.u0, t1);
    result.u1 = Math.min(result.u1, t2);
    if (result.u0 > result.u1) {
      // fail
      return result;
    }
  }

  if (Math.abs(dir.y) < EPSILON) {
    if (origin.y < rc.y || origin.y > rc.bottom) {
      return result;
    }
  } else {
    const ood = 1.0 / dir.y;
    let t1 = ood * (rc.y - origin.y);
    let t2 = ood * (rc.bottom - origin.y);
    if (t1 > t2) {
      // swap
      [t1, t2] = [t2, t1];
    }
    result.u0 = Math.max(result.u0, t1);
    result.u1 = Math.min(result.u1, t2);
    if (result.u0 > result.u1) {
      // fail
      return result;
    }
  }
  result.ray = true;
  result.hit = true;
  // result.contact = origin + dir * result.u0;
  result.contact.copyFrom(origin).addScale(dir, result.u0);
  return result;
}
