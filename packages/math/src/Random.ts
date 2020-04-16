/* tslint:disable:no-bitwise */
// tslint:disable:max-classes-per-file
// tslint:disable:interface-name

interface RandomEngine {
    readonly max: number;
    seed: number;

    next(): number;
}

// const MAX_LIMIT = 0x80000000;
const MAX_LIMIT = 0x7FFFFFFF;

class Lcg32 {
    seed: number;
    readonly a: number;
    readonly c: number;
    readonly max: number;

    // c++ version : a = 1103515245, c = 12345
    constructor(seed = +new Date(),
                a = 1664525,
                c = 1013904223,
                max = MAX_LIMIT) {
        this.a = a;
        this.c = c;
        this.max = max;
        this.seed = seed % max;
    }

    next(): number {
        return this.seed = (this.seed * this.a + this.c) % this.max;
    }
}

export class Random {
    constructor(private engine: RandomEngine = new Lcg32()) {
    }

    roll(maxExclusive: number) {
        return this.next() % maxExclusive;
    }

    next(): number {
        return this.engine.next();
    }

    random(): number {
        return this.next() / MAX_LIMIT;
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

    element<T>(array: T[]): T | undefined {
        const m = array.length;
        if (m <= 0) {
            return undefined;
        }
        const i = this.engine.next() % m;//this.roll(m);
        return array[i];
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

const RndDefault = new Random();
const RndGame = new Random();

export {RndDefault, RndGame};
