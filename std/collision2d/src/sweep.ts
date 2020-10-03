import {Recta, Vec2, Vec3} from "@highduck/math";
import {IntersectionResult} from "./intersectionResult";
import {intersectRayRect} from "./findIntersection";

const EPSILON = 1e-6;

const RC_TMP_0 = new Recta();

const V2_TMP_0 = new Vec2();
const V2_TMP_1 = new Vec2();
const V2_TMP_2 = new Vec2();
const V2_TMP_3 = new Vec2();

const V3_TMP_0 = new Vec3();
const V3_TMP_1 = new Vec3();

export function sweepCircles(c0: Readonly<Vec3>, c1: Readonly<Vec3>, delta: Readonly<Vec2>, result: IntersectionResult) {
  // reset
  result.reset();

  const sx = c1.x - c0.x;
  const sy = c1.y - c0.y;
  const r = c1.z + c0.z;
  const c = sx * sx + sy * sy - r * r;
  if (c < 0.0) {
    result.hit = true;
    result.u0 = 0.0;
    return result;
  }
  const a = delta.lengthSqr;
  if (a <= EPSILON) {
    return result;
  }
  const b = delta.x * sx + delta.y * sy; // dot(delta, s)
  if (b >= 0) {
    return result;
  }
  const d = b * b - a * c;
  if (d < 0) {
    return result;
  }
  result.u0 = (-b - Math.sqrt(d)) / a;
  result.hit = true; // result.u0;
  return result;
}

export function sweepRects(a0: Readonly<Recta>,
                           a1: Readonly<Recta>,
                           b0: Readonly<Recta>,
                           b1: Readonly<Recta>,
                           result: IntersectionResult): IntersectionResult {
  result.reset();

  if (a0.overlaps(b0)) {
    result.normal.set(
      a0.centerX < b0.centerX ? 1 : -1,
      a0.centerY < b0.centerY ? 1 : -1,
    );
// 			result.x = a0.centerX + 0.5 * (b0.centerX - a0.centerX);
// 			result.y = a0.centerY + 0.5 * (b0.centerY - a0.centerY);
    result.hit = true;
    return result;
  }

  const dx = (a1.x - a0.x) - (b1.x - b0.x);
  const dy = (a1.y - a0.y) - (b1.y - b0.y);
  let cx0 = b0.x - a0.right;
  let cx1 = b0.right - a0.x;
  let cy0 = b0.y - a0.bottom;
  let cy1 = b0.bottom - a0.y;
  if (dx <= 0) {
    [cx0, cx1] = [cx1, cx0];
  }
  if (dy <= 0) {
    [cy0, cy1] = [cy1, cy0];
  }
  let u0x = 1e5;
  let u1x = -1e5;
  let u0y = 1e5;
  let u1y = -1e5;

  if (dx !== 0.0) {
    u0x = cx0 / dx;
    u1x = cx1 / dx;
  }

  if (dy !== 0.0) {
    u0y = cy0 / dy;
    u1y = cy1 / dy;
  }

  result.u0 = Math.max(u0x, u0y);
  result.u1 = Math.min(u1x, u1y);
  result.ray = result.u0 <= result.u1;
  result.hit = result.ray && (result.u0 <= 1.0) && (result.u0 >= 0.0);

  if (u0x === result.u0) {
    result.normal.x = dx > 0.0 ? 1 : -1;
  }

  if (u0y === result.u0) {
    result.normal.y = dy > 0.0 ? 1 : -1;
  }

  return result;
}

export function sweepCircleRect(circle: Vec3,
                                circleDelta: Vec2,
                                rect: Recta,
                                rectDelta: Vec2,
                                result: IntersectionResult): IntersectionResult {
// TODO: optimize allocation
// 		var e = new rect_f(b.x - r, b.y - r, b.width + r * 2, b.height + r * 2);
// 		var ii = intersectRayRect(e, x, y, dx, dy);
// 		if(!ii.hit) {
// 			return ii;
// 		}
// 		var px = x + dx * ii.u0;
// 		var py = y + dy * ii.u0;
// 		var u = 0;
// 		var v = 0;
// 		if(px < b.x) u |= 1;
// 		if(px > b.right) v |= 1;
// 		if(py < b.y) u |= 2;
// 		if(py > b.bottom) v |= 2;
//
// 		var m = u + v;

  const origin = V2_TMP_0.set(circle.x, circle.y);
  const dir = V2_TMP_1.copyFrom(rectDelta).subtract(circleDelta);
  const dirOpposite = V2_TMP_2.copyFrom(dir).negate();
  const r = circle.z;
  const cp = V2_TMP_3.set(0, 0);
  let corner = false;

  let t0 = 1000000.0;
  const e = RC_TMP_0.set(rect.x - r, rect.y - r, rect.width + r * 2, rect.height + r * 2);

  intersectRayRect(e, origin, dirOpposite, result);
  if (!result.hit) {
    return result;
  }

  e.set(rect.x - r, rect.y, rect.width + r * 2, rect.height);
  intersectRayRect(e, origin, dirOpposite, result);
  if (result.hit && result.u0 <= 1.0) {
    t0 = Math.min(result.u0, t0);
  }

  e.set(rect.x, rect.y - r, rect.width, rect.height + 2 * r);
  intersectRayRect(e, origin, dirOpposite, result);
  if (result.hit && result.u0 <= 1.0) {
    t0 = Math.min(result.u0, t0);
  }

  const originCircle = V3_TMP_0.set(origin.x, origin.y, 0);
  const testCircle = V3_TMP_1.set(rect.x, rect.y, r);
  sweepCircles(originCircle, testCircle, dir, result);
  if (result.hit && result.u0 < t0) {
    t0 = result.u0;
    cp.set(testCircle.x, testCircle.y);
    corner = true;
  }

  sweepCircles(originCircle, testCircle.set(rect.right, rect.y, r), dir, result);
  if (result.hit && result.u0 < t0) {
    t0 = result.u0;
    cp.set(testCircle.x, testCircle.y);
    corner = true;
  }

  sweepCircles(originCircle, testCircle.set(rect.x, rect.bottom, r), dir, result);
  if (result.hit && result.u0 < t0) {
    t0 = result.u0;
    cp.set(testCircle.x, testCircle.y);
    corner = true;
  }

  sweepCircles(originCircle, testCircle.set(rect.right, rect.bottom, r), dir, result);
  if (result.hit && result.u0 < t0) {
    t0 = result.u0;
    cp.set(testCircle.x, testCircle.y);
    corner = true;
  }

  if (t0 <= 1 && t0 >= 0) {
    result.hit = true;
    origin.addScale(circleDelta, t0);
    if (corner) {
      // result.normal = origin - cp - rect_delta * t0;
      result.normal.copyFrom(origin).subtract(cp).addScale(rectDelta, -t0);
    } else {
      // reuse V2_TMP_3
      const b = V2_TMP_3.set(rect.x, rect.y).addScale(rectDelta, t0);
      if (origin.x >= b.x && origin.x <= b.x + rect.width) {
        result.normal.set(0, origin.y <= (b.y + rect.height * 0.5) ? -1 : 1);
      } else if (origin.y <= b.y + rect.height && origin.y >= b.y) {
        result.normal.set(origin.x <= (b.x + rect.width * 0.5) ? -1 : 1, 0);
      }
    }
  } else {
    result.hit = false;
  }
  result.u0 = t0;
  return result;
}
