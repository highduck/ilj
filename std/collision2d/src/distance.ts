import {Recta, Vec2} from "@highduck/math";

export function distanceToRect(rc: Readonly<Recta>, p: Readonly<Vec2>): number {
  let s = 0.0;
  let d = 0.0;

  if (p.x < rc.x) {
    s = p.x - rc.x;
    d += s * s;
  } else if (p.x > rc.right) {
    s = p.x - rc.right;
    d += s * s;
  }

  if (p.y < rc.y) {
    s = p.y - rc.y;
    d += s * s;
  } else if (p.y > rc.bottom) {
    s = p.y - rc.bottom;
    d += s * s;
  }

  return Math.sqrt(d);
}
