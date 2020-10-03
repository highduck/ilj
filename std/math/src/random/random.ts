import { RandomEngine } from './engine';

export class Random {
  constructor(private engine: RandomEngine) {}

  roll(maxExclusive: number): number {
    return this.next() % maxExclusive | 0;
  }

  next(): number {
    return this.engine.next();
  }

  random(): number {
    return this.next() / this.engine.max;
  }

  range(min = 0, max = 1): number {
    return min + (max - min) * this.random();
  }

  integer(min: number, max: number): number {
    return min + this.roll(max - min + 1);
  }

  chance(prob = 0.5): boolean {
    return this.random() <= prob;
  }

  element<T>(array: T[]): T {
    const len = array.length;
    if (len <= 0) {
      throw new RangeError();
    }
    return array[this.roll(len)];
  }

  set seed(value: number) {
    this.engine.seed = value % this.engine.max;
  }

  get seed(): number {
    return this.engine.seed;
  }

  get maxLimit(): number {
    return this.engine.max;
  }
}
