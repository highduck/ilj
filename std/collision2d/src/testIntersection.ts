import { Recta, Vec2 } from '@highduck/math';

const V2_TMP_0 = new Vec2();

export function testRectLine(
  rect: Readonly<Recta>,
  p0: Readonly<Vec2>,
  p1: Readonly<Vec2>,
): boolean {
  // Calculate m and c for the equation for the line (y = mx+c)
  const m = (p1.y - p0.y) / (p1.x - p0.x);
  const c = p0.y - m * p0.x;

  const r = rect.right;

  // if the line is going up from right to left then the top intersect point is on the left
  let intersectionTop = m * rect.x + c;
  let intersectionBottom = m * r + c;
  if (m <= 0.0) {
    // otherwise it's on the right
    [intersectionTop, intersectionBottom] = [intersectionBottom, intersectionTop];
  }

  // work out the top and bottom extents for the triangle
  const trianglePointTop = p0.y < p1.y ? p0.y : p1.y;
  const trianglePointBottom = p0.y < p1.y ? p1.y : p0.y;

  // and calculate the overlap between those two bounds
  const overlapTop = intersectionTop > trianglePointTop ? intersectionTop : trianglePointTop;
  const overlapBottom =
    intersectionBottom < trianglePointBottom ? intersectionBottom : trianglePointBottom;

  // (topoverlap<botoverlap) :
  // if the intersection isn't the right way up then we have no overlap

  // (!((botoverlap<t) || (topoverlap>b)) :
  // If the bottom overlap is higher than the top of the rectangle or the top overlap is
  // lower than the bottom of the rectangle we don't have intersection. So return the negative
  // of that. Much faster than checking each of the points is within the bounds of the rectangle.
  return overlapTop < overlapBottom && overlapBottom >= rect.y && overlapTop <= rect.bottom;
}

export function testRectTriangle(rect: Recta, v0: Vec2, v1: Vec2, v2: Vec2): boolean {
  return testRectLine(rect, v0, v1) || testRectLine(rect, v1, v2) || testRectLine(rect, v2, v0);
}

export function testLineLine(
  a: Readonly<Vec2>,
  b: Readonly<Vec2>,
  c: Readonly<Vec2>,
  d: Readonly<Vec2>,
  segmentMode: boolean,
  intersection: Vec2,
): boolean {
  const a1 = b.y - a.y;
  const a2 = d.y - c.y;
  const b1 = a.x - b.x;
  const b2 = c.x - d.x;
  const c1 = b.x * a.y - a.x * b.y;
  const c2 = d.x * c.y - c.x * d.y;

  const D = a1 * b2 - a2 * b1;
  if (D === 0.0) {
    return false;
  }

  const ip = V2_TMP_0.set((b1 * c2 - b2 * c1) / D, (a2 * c1 - a1 * c2) / D);

  if (segmentMode) {
    let len = a.distanceSqr(b);
    if (ip.distanceSqr(b) > len || ip.distanceSqr(a) > len) {
      return false;
    }

    len = c.distanceSqr(d);
    if (ip.distanceSqr(d) > len || ip.distanceSqr(c) > len) {
      return false;
    }
  }

  intersection.copyFrom(ip);
  return true;
}

function sign(p1: Readonly<Vec2>, p2: Readonly<Vec2>, p3: Readonly<Vec2>): number {
  return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}

export function testTrianglePoint(
  point: Readonly<Vec2>,
  v0: Readonly<Vec2>,
  v1: Readonly<Vec2>,
  v2: Readonly<Vec2>,
): boolean {
  const m = sign(point, v1, v2) < 0.0;
  return m === sign(point, v0, v1) < 0.0 && m === sign(point, v2, v0) < 0.0;
}
