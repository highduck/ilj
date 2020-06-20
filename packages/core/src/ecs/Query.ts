import {Entity} from "./Entity";
import {IntMap} from "../util/IntMap";

export class Query0 {
    constructor(private objs: IntMap<Entity>) {
    }

    count(): number {
        return this.objs.keys.length;
    }

    [Symbol.iterator](): IterableIterator<Entity> {
        return this.objs.values[Symbol.iterator]();
    }

    entities(): ReadonlyArray<Entity> {
        return this.objs.values;
    }
}

export class Query1<T> {

    constructor(private objs: IntMap<Entity>,
                private map1: IntMap<T>) {
    }

    count(): number {
        return this.map1.keys.length;
    }

    * entities(): IterableIterator<Entity> {
        // 1-component query
        const keys = this.map1.keys;
        for (let i = 0; i < keys.length; ++i) {
            yield this.objs.get(/* index */ keys[i]) as Entity;
        }
    }

    [Symbol.iterator](): IterableIterator<T> {
        return this.map1.values[Symbol.iterator]();
    }

    get componentArray(): ReadonlyArray<T> {
        return this.map1.values;
    }

    // get entityArray(): ReadonlyArray<Entity> {
    //     return this.objs.values;
    // }
}

export class Query2<T1, T2> {
    private readonly types: [IntMap<T1>, IntMap<T2>];
    private result: [T1, T2] = ([] as unknown) as [T1, T2];

    constructor(private objs: IntMap<Entity>,
                private map1: IntMap<T1>,
                private map2: IntMap<T2>) {
        this.types = [map1, map2];
    }

    count(): number {
        let i = 0;

        this.types.sort((a, b) => (a.keys.length - b.keys.length));
        const keys = this.types[0].keys;
        for (let i = 0; i < keys.length; ++i) {
            const index = keys[i];
            if (this.types[1].has(index)) {
                ++i;
            }
        }

        return i;
    }

    * entities(): IterableIterator<Entity> {
        this.types.sort((a, b) => (a.keys.length - b.keys.length));
        const keys = this.types[0].keys;
        for (let i = 0; i < keys.length; ++i) {
            const index = keys[i];
            if (this.types[1].has(index)) {
                yield this.objs.get(index) as Entity;
            }
        }
    }

    * [Symbol.iterator](): IterableIterator<[T1, T2]> {
        this.types.sort((a, b) => (a.size - b.size));
        const keys = this.types[0].keys;
        const result = this.result;
        for (let i = 0; i < keys.length; ++i) {
            const index = keys[i];
            if (this.types[1].has(index)) {
                result[0] = this.map1.get(index) as T1;
                result[1] = this.map2.get(index) as T2;
                yield result;
            }
        }
    }
}

export class Query3<T1, T2, T3> {
    private readonly types: [IntMap<T1>, IntMap<T2>, IntMap<T3>];
    private result: [T1, T2, T3] = ([] as unknown) as [T1, T2, T3];

    constructor(private objs: IntMap<Entity>,
                private map1: IntMap<T1>,
                private map2: IntMap<T2>,
                private map3: IntMap<T3>) {
        this.types = [map1, map2, map3];
    }

    count(): number {
        let i = 0;
        this.types.sort((a, b) => (a.size - b.size));
        const keys = this.types[0].keys;
        for (let i = 0; i < keys.length; ++i) {
            const index = keys[i];
            if (this.types[1].has(index) && this.types[2].has(index)) {
                ++i;
            }
        }
        return i;
    }

    * entities(): IterableIterator<Entity> {
        this.types.sort((a, b) => (a.size - b.size));
        const keys = this.types[0].keys;
        for (let i = 0; i < keys.length; ++i) {
            const index = keys[i];
            if (this.types[1].has(index) && this.types[2].has(index)) {
                yield this.objs.get(index) as Entity;
            }
        }
    }

    * [Symbol.iterator](): IterableIterator<[T1, T2, T3]> {
        this.types.sort((a, b) => (a.size - b.size));
        const keys = this.types[0].keys;
        const result = this.result;
        for (let i = 0; i < keys.length; ++i) {
            const index = keys[i];
            if (this.types[1].has(index)) {
                if (this.types[2].has(index)) {
                    result[0] = this.map1.get(index) as T1;
                    result[1] = this.map2.get(index) as T2;
                    result[2] = this.map3.get(index) as T3;
                    yield result;
                }
            }
        }
    }
}

export class QueryN<T> {

    private readonly types: Array<IntMap<T>>;
    private tuple: T[] = [];

    constructor(private objs: IntMap<Entity>,
                private maps: Array<IntMap<T>>) {
        this.types = maps.concat();
    }

    count(): number {
        let i = 0;

        this.types.sort((a, b) => (a.size - b.size));
        // N-components query

        const keys = this.types[0].keys;
        primary:
            for (let i = 0; i < keys.length; ++i) {
                const index = keys[i];
                for (let i = 1; i < this.types.length; ++i) {
                    if (!this.types[i].has(index)) {
                        continue primary;
                    }
                }
                ++i;
            }
        return i;
    }

    * entities(): IterableIterator<Entity> {
        this.types.sort((a, b) => (a.size - b.size));
        // N-components query

        const keys = this.types[0].keys;
        primary:
            for (let i = 0; i < keys.length; ++i) {
                const index = keys[i];
                for (let i = 1; i < this.types.length; ++i) {
                    if (!this.types[i].has(index)) {
                        continue primary;
                    }
                }
                yield this.objs.get(index) as Entity;
            }
    }

    * [Symbol.iterator](): IterableIterator<T[]> {
        const result = this.tuple;
        // for (const e of this.entities()) {
        //     for (let i = 0; i < this.maps.length; ++i) {
        //         result[i] = this.maps[i].get(e.passport & 0xFFFFF) as T;
        //     }
        //     yield result;
        // }
        this.types.sort((a, b) => (a.size - b.size));
        // N-components query

        const keys = this.types[0].keys;
        primary:
            for (let i = 0; i < keys.length; ++i) {
                const index = keys[i];
                for (let i = 1; i < this.types.length; ++i) {
                    if (!this.types[i].has(index)) {
                        continue primary;
                    }
                }
                for (let i = 0; i < this.maps.length; ++i) {
                    result[i] = this.maps[i].get(index) as T;
                }
                yield result;
            }
    }
}
