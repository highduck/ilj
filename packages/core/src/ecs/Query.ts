import {Entity, EntityMap} from "./Entity";
import {IntMap} from "../ds/IntMap";
import {Component} from "./Component";

function mapsSortFunction(a: IntMap<any>, b: IntMap<any>) {
    return a.keys.length - b.keys.length;
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

        this.types.sort(mapsSortFunction);
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
        this.types.sort(mapsSortFunction);
        const keys = this.types[0].keys;
        for (let i = 0; i < keys.length; ++i) {
            const index = keys[i];
            if (this.types[1].has(index)) {
                yield this.objs.get(index) as Entity;
            }
        }
    }

    * [Symbol.iterator](): IterableIterator<[T1, T2]> {
        this.types.sort(mapsSortFunction);
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
        this.types.sort(mapsSortFunction);
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
        this.types.sort(mapsSortFunction);
        const keys = this.types[0].keys;
        for (let i = 0; i < keys.length; ++i) {
            const index = keys[i];
            if (this.types[1].has(index) && this.types[2].has(index)) {
                yield this.objs.get(index) as Entity;
            }
        }
    }

    * [Symbol.iterator](): IterableIterator<[T1, T2, T3]> {
        this.types.sort(mapsSortFunction);
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

        this.types.sort(mapsSortFunction);
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
        this.types.sort(mapsSortFunction);
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
        this.types.sort(mapsSortFunction);
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

//// pooled version

export class QueryPool2<T1, T2> {
    private readonly types: [IntMap<T1>, IntMap<T2>];

    r1: Array<T1> = [];
    r2: Array<T2> = [];
    count = 0;

    //private objs: IntMap<Entity>,
    constructor(private map1: IntMap<T1>,
                private map2: IntMap<T2>) {
        this.types = [map1, map2];
    }

    update() {
        const r1 = this.r1;
        const r2 = this.r2;
        let count = 0;
        this.types.sort(mapsSortFunction);
        const keys = this.types[0].keys;
        const check1 = this.types[1].map;
        for (let i = 0; i < keys.length; ++i) {
            const index = keys[i];
            if (check1[index] !== undefined) {
                r1[count] = this.map1.get(index) as T1;
                r2[count] = this.map2.get(index) as T2;
                ++count;
            }
        }
        this.count = count;
        r1.length = count;
        r2.length = count;
    }
}


export function getComponents<T>(type: Component<T>): T[] {
    return type.map.values;
}

export function ECS_query2<T1, T2>(type1: Component<T1>, type2: Component<T2>): Query2<T1, T2> {
    return new Query2<T1, T2>(EntityMap, type1.map, type2.map);
}

export function ECS_query3<T1, T2, T3>(type1: Component<T1>, type2: Component<T2>, type3: Component<T3>): Query3<T1, T2, T3> {
    return new Query3<T1, T2, T3>(EntityMap, type1.map, type2.map, type3.map);
}

export function ECS_queryN<Tn>(types: Component<any>[]): QueryN<Tn> {
    const map: IntMap<Tn>[] = [];
    for (let i = 0; i < types.length; ++i) {
        map[i] = types[i].map as IntMap<Tn>;
    }
    return new QueryN<Tn>(EntityMap, map);
}
