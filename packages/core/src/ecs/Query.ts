import {Entity} from "./Entity";

export class Query0 {
    constructor(private objs: Map<number, Entity>) {
    }

    count(): number {
        return this.objs.size;
    }

    [Symbol.iterator](): IterableIterator<Entity> {
        return this.objs.values();
    }
}

export class Query1<T> {
    constructor(private objs: Map<number, Entity>,
                private map1: Map<number, T>) {
    }

    count(): number {
        return this.map1.size;
    }

    * entities(): IterableIterator<Entity> {
        // 1-component query
        for (const index of this.map1.keys()) {
            yield this.objs.get(index) as Entity;
        }
    }

    [Symbol.iterator](): IterableIterator<T> {
        return this.map1.values();
    }
}

export class Query2<T1, T2> {
    private readonly types: [Map<number, T1>, Map<number, T2>];

    constructor(private objs: Map<number, Entity>,
                private map1: Map<number, T1>,
                private map2: Map<number, T2>) {
        this.types = [map1, map2];
    }

    count(): number {
        let i = 0;
        for (const e of this) {
            ++i;
        }
        return i;
    }

    * entities(): IterableIterator<Entity> {
        this.types.sort((a, b) => (a.size - b.size));
        for (const index of this.types[0].keys()) {
            if (this.types[1].has(index)) {
                yield this.objs.get(index) as Entity;
            }
        }
    }

    * [Symbol.iterator](): IterableIterator<[T1, T2]> {
        this.types.sort((a, b) => (a.size - b.size));
        for (const index of this.types[0].keys()) {
            if (this.types[1].has(index)) {
                yield [
                    this.map1.get(index) as T1,
                    this.map2.get(index) as T2
                ];
            }
        }
    }
}

export class Query3<T1, T2, T3> {
    private readonly types: [Map<number, T1>, Map<number, T2>, Map<number, T3>];

    constructor(private objs: Map<number, Entity>,
                private map1: Map<number, T1>,
                private map2: Map<number, T2>,
                private map3: Map<number, T3>) {
        this.types = [map1, map2, map3];
    }

    count(): number {
        let i = 0;
        for (const e of this) {
            ++i;
        }
        return i;
    }

    * entities(): IterableIterator<Entity> {
        this.types.sort((a, b) => (a.size - b.size));
        for (const index of this.types[0].keys()) {
            if (this.types[1].has(index) && this.types[2].has(index)) {
                yield this.objs.get(index) as Entity;
            }
        }
    }

    * [Symbol.iterator](): IterableIterator<[T1, T2, T3]> {
        this.types.sort((a, b) => (a.size - b.size));
        for (const index of this.types[0].keys()) {
            if (this.types[1].has(index)) {
                if (this.types[2].has(index)) {
                    yield [
                        this.map1.get(index) as T1,
                        this.map2.get(index) as T2,
                        this.map3.get(index) as T3,
                    ];
                }
            }
        }
    }
}

export class QueryN<T> {

    private readonly types: Array<Map<number, T>>;

    constructor(private objs: Map<number, Entity>,
                private maps: Array<Map<number, T>>) {
        this.types = maps.concat();
    }

    count(): number {
        let i = 0;
        for (const e of this) {
            ++i;
        }
        return i;
    }

    * entities(): IterableIterator<Entity> {
        this.types.sort((a, b) => (a.size - b.size));
        // N-components query
        primary:
            for (const index of this.types[0].keys()) {
                for (let i = 1; i < this.types.length; ++i) {
                    if (!this.types[i].has(index)) {
                        continue primary;
                    }
                }
                yield this.objs.get(index) as Entity;
            }
    }

    * [Symbol.iterator](): IterableIterator<T[]> {
        for (const e of this.entities()) {
            yield this.maps.map((type) => type.get(e.passport & 0xFFFFF)) as T[];
        }
    }
}
