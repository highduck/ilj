import { RandomEngine } from './engine';

// const MAX_LIMIT = 0x80000000;
const MAX_LIMIT = 0x7fffffff;

export class Lcg32 implements RandomEngine {
  // c++ version : a = 1103515245, c = 12345
  constructor(
    public seed = +new Date() & 0x3fffffff,
    readonly a = 1664525,
    readonly c = 1013904223,
    readonly max = MAX_LIMIT,
  ) {}

  next(): number {
    const v = this.seed * this.a + this.c;
    const cl = v % this.max;
    this.seed = cl | 0;
    return this.seed;
  }
}
