import {Entity, Passport} from "./Entity";
import {Query0, Query1, Query2, Query3, QueryN} from "./Query";
import {Engine} from "../Engine";
import {ConstructorWithID} from "../util/TypeID";

// const BITS_COUNT_VERSION = 11;
const BITS_COUNT_INDEX = 20;
const MASK_VERSION_CLAMP = 0x7FF;
const MASK_VERSION = 0x7FF << BITS_COUNT_INDEX;
const MASK_INDEX = 0xFFFFF;

export class World {
    readonly maps = new Map<number, Map<number, object>>();
    readonly list: Passport[] = [];
    readonly objs = new Map<number, Entity>();

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
        this.objs.set(e.passport & MASK_INDEX, e);
        return e;
    }

    check(passport: Passport): boolean {
        return (this.list[passport & MASK_INDEX] & MASK_VERSION) == (passport & MASK_VERSION);
    }

    delete(passport: Passport, typeID: number) {
        this.maps.get(typeID)?.delete(passport & MASK_INDEX);
    }

    ensure(typeID: number): Map<number, object> {
        let storage = this.maps.get(typeID);
        if (storage === undefined) {
            this.maps.set(typeID, storage = new Map<number, object>());
        }
        return storage;
    }

    query(): Query0;
    query<T>(type: ConstructorWithID<T>): Query1<T>;
    query<T1, T2>(type1: ConstructorWithID<T1>, type2: ConstructorWithID<T2>): Query2<T1, T2>;
    query<T1, T2, T3>(type1: ConstructorWithID<T1>, type2: ConstructorWithID<T2>, type3: ConstructorWithID<T3>): Query3<T1, T2, T3>;
    query<Tn>(...types: ConstructorWithID<object>[]): QueryN<Tn>;
    query(...types: ConstructorWithID<object>[]) {
        const sz = types.length;
        if (sz === 0) {
            return new Query0(this.objs);
        } else if (sz === 1) {
            return new Query1(this.objs,
                this.ensure(types[0].TYPE_ID)
            );
        } else if (sz === 2) {
            return new Query2(this.objs,
                this.ensure(types[0].TYPE_ID),
                this.ensure(types[1].TYPE_ID)
            );
        } else if (sz === 3) {
            return new Query3(this.objs,
                this.ensure(types[0].TYPE_ID),
                this.ensure(types[1].TYPE_ID),
                this.ensure(types[2].TYPE_ID)
            );
        }
        return new QueryN(this.objs, types.map(t => this.ensure(t.TYPE_ID)));
    }

    // TODO: batch allocator
    // allocate_n(amount:number, out:Entity[]) {}

    _deallocate(passport: Passport) {
        const i = passport & MASK_INDEX;
        this.list[i] = this._next |
            ((((passport >>> BITS_COUNT_INDEX) + 1) & MASK_VERSION_CLAMP) << BITS_COUNT_INDEX); // increase VERSION
        this._next = i;
        ++this._available;
    }

    _allocate(): Passport {
        if (this._available !== 0) {
            const node = this.list[this._next];
            const e = this._next | (node & MASK_VERSION); // assign new INDEX
            this.list[this._next] = e;
            this._next = node & MASK_INDEX;
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
