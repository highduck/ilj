import {Vec2} from "@highduck/math";

export class IntersectionResult {

  // future collision
  ray = false;

  // frame collision
  hit = false;

  // contact normal
  readonly normal = new Vec2();

  // contact position
  readonly contact = new Vec2();

  // normalized time of first collision
  u0 = NaN;

  // normalized time of second collision
  u1 = NaN;

  constructor() {
    this.u0 = this.u1 = 0.0;
  }
  reset() {
    this.ray = false;
    this.hit = false;
    this.normal.set(0.0, 0.0);
    this.contact.set(0.0, 0.0);
    this.u0 = 0.0;
    this.u1 = 0.0;
  }
}
