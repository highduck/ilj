import {Entity, Passport} from "./Entity";
import {Query0, Query1, Query2, Query3, QueryN} from "./Query";
import {Engine} from "../Engine";
import {ConstructorWithID} from "../util/TypeID";
import {IntMap} from "../util/IntMap";

// 0x7FF << BITS_COUNT_INDEX
const VERSION_MASK = 0x7FF00000;
const VERSION_INC = 0x00100000;
// const VERSION_BITS_SHIFT = 20;

const INDEX_MASK = 0xFFFFF;

// const INDEX_BITS_COUNT = 11;

export class World {
    // TYPE ID -> [Entity Index -> Component Data]
    readonly maps: IntMap<IntMap<object>> = new IntMap();
    readonly list: Passport[] = [];

    /**
     Entity Index -> Entity

     - set Entity Index and Object
     - delete Entity Index and Object
     query 0: values() and size
     query N: get Entity object by Entity Index
     **/
    readonly objs = new IntMap<Entity>();

    private _next = 0;
    private _available = 0;

    readonly root = this.create();

    constructor(readonly engine: Engine) {
    }

    // entities in use right now
    get size(): number {
        return this.list.length - this._available;
    }

    create(): Entity {
        const e = new Entity(this, this._allocate());
        this.objs.set(e.passport & INDEX_MASK, e);
        return e;
    }

    check(passport: Passport): boolean {
        return (this.list[passport & INDEX_MASK] & VERSION_MASK) === (passport & VERSION_MASK);
    }

    delete(passport: Passport, typeID: number) {
        this.maps.get(typeID)?.delete(passport & INDEX_MASK);
    }

    ensure(typeID: number): IntMap<object> {
        let storage = this.maps.get(typeID);
        if (storage === undefined) {
            this.maps.set(typeID, storage = new IntMap());
        }
        return storage;
    }

    get entities(): Entity[] {
        return this.objs.values;
    }

    components<T extends object>(type: ConstructorWithID<T>): T[] {
        return this.ensure(type.TYPE_ID).values as T[];
    }

    query2<T1 extends object, T2 extends object>(type1: ConstructorWithID<T1>, type2: ConstructorWithID<T2>): Query2<T1, T2> {
        return new Query2<T1, T2>(this.objs,
            this.ensure(type1.TYPE_ID) as IntMap<T1>,
            this.ensure(type2.TYPE_ID) as IntMap<T2>
        );
    }

    query3<T1 extends object, T2 extends object, T3 extends object>(type1: ConstructorWithID<T1>, type2: ConstructorWithID<T2>, type3: ConstructorWithID<T3>): Query3<T1, T2, T3> {
        return new Query3<T1, T2, T3>(this.objs,
            this.ensure(type1.TYPE_ID) as IntMap<T1>,
            this.ensure(type2.TYPE_ID) as IntMap<T2>,
            this.ensure(type3.TYPE_ID) as IntMap<T3>
        );
    }

    queryN<Tn extends object>(types: ConstructorWithID<object>[]): QueryN<Tn> {
        const map: IntMap<Tn>[] = [];
        for (let i = 0; i < types.length; ++i) {
            map[i] = this.ensure(types[i].TYPE_ID) as IntMap<Tn>;
        }
        return new QueryN<Tn>(this.objs, map);
    }

    // TODO: batch allocator
    // allocate_n(amount:number, out:Entity[]) {}

    _deallocate(passport: Passport) {
        const i = passport & INDEX_MASK;
        // increase VERSION
        this.list[i] = this._next | ((passport & VERSION_MASK) + VERSION_INC);
        this._next = i;
        ++this._available;
    }

    _allocate(): Passport {
        if (this._available !== 0) {
            const node = this.list[this._next];
            const e = this._next | (node & VERSION_MASK); // assign new INDEX
            this.list[this._next] = e;
            this._next = node & INDEX_MASK;
            --this._available;
            return e;
        }
        // there will be initial VERSION = 0
        // returns new length - 1 to point prev
        const e = this.list.length;
        this.list[e] = e;
        return e;
    }
}
