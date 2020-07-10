import {Entity, Passport} from "./Entity";
import {Query2, Query3, QueryN} from "./Query";
import {IntMap} from "../ds/IntMap";
import {ComponentClass} from "./Component";

// 0x7FF << BITS_COUNT_INDEX
const VERSION_MASK = 0x7FF00000;
const VERSION_INC = 0x00100000;
// const VERSION_BITS_SHIFT = 20;

const INDEX_MASK = 0xFFFFF;

// const INDEX_BITS_COUNT = 11;

// TYPE ID -> [Entity Index -> Component Data]
const maps = new IntMap<IntMap<object>>();
const list: Passport[] = [];
/**
 Entity Index -> Entity

 - set Entity Index and Object
 - delete Entity Index and Object
 query 0: values() and size
 query N: get Entity object by Entity Index
 **/
export const objs = new IntMap<Entity>();

let _next = 0;
let _available = 0;

// entities in use right now
// getUsedCount
const stats = {
    usedEntities: 0,
    usedTypes: 0
};

export function ECS_stats() {
    stats.usedEntities = list.length - _available;
    stats.usedTypes = maps.size;
    return stats;
}

export function checkEntityPassport(passport: Passport): boolean {
    return (list[passport & INDEX_MASK] & VERSION_MASK) === (passport & VERSION_MASK);
}

export function deleteEntityComponent(passport: Passport, componentID: number) {
    maps.get(componentID)?.delete(passport & INDEX_MASK);
}

export function ensureComponentMap(componentID: number): IntMap<object> {
    let storage = maps.get(componentID);
    if (storage === undefined) {
        maps.set(componentID, storage = new IntMap());
    }
    return storage;
}

export function getEntities(): Entity[] {
    return objs.values;
}

export function getComponents<T extends object>(type: ComponentClass<T>): T[] {
    return ensureComponentMap(type.COMP_ID).values as T[];
}

export function ECS_query2<T1 extends object, T2 extends object>(type1: ComponentClass<T1>, type2: ComponentClass<T2>): Query2<T1, T2> {
    return new Query2<T1, T2>(objs,
        ensureComponentMap(type1.COMP_ID) as IntMap<T1>,
        ensureComponentMap(type2.COMP_ID) as IntMap<T2>
    );
}

export function ECS_query3<T1 extends object, T2 extends object, T3 extends object>(type1: ComponentClass<T1>, type2: ComponentClass<T2>, type3: ComponentClass<T3>): Query3<T1, T2, T3> {
    return new Query3<T1, T2, T3>(objs,
        ensureComponentMap(type1.COMP_ID) as IntMap<T1>,
        ensureComponentMap(type2.COMP_ID) as IntMap<T2>,
        ensureComponentMap(type3.COMP_ID) as IntMap<T3>
    );
}

export function ECS_queryN<Tn extends object>(types: ComponentClass[]): QueryN<Tn> {
    const map: IntMap<Tn>[] = [];
    for (let i = 0; i < types.length; ++i) {
        map[i] = ensureComponentMap(types[i].COMP_ID) as IntMap<Tn>;
    }
    return new QueryN<Tn>(objs, map);
}

// TODO: batch allocator
// allocate_n(amount:number, out:Entity[]) {}

export function _deallocate(passport: Passport) {
    const i = passport & INDEX_MASK;
    // increase VERSION
    list[i] = _next | ((passport & VERSION_MASK) + VERSION_INC);
    _next = i;
    ++_available;
}

export function _allocate(): Passport {
    if (_available !== 0) {
        const node = list[_next];
        const e = _next | (node & VERSION_MASK); // assign new INDEX
        list[_next] = e;
        _next = node & INDEX_MASK;
        --_available;
        return e;
    }
    // there will be initial VERSION = 0
    // returns new length - 1 to point prev
    const e = list.length;
    list[e] = e;
    return e;
}
