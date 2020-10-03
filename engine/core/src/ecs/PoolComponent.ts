import {_registerComponentType, addComponentToEntityList, Component, NextComponentID} from "./Component";
import {IntMap} from "../ds/IntMap";
import {ObjectPool} from "../ds/ObjectPool";

export class PoolComponentType<T extends { reset(): void; }> implements Component<T> {
    readonly pool: ObjectPool<T>;
    readonly iid: number;
    readonly id: number;
    readonly map: IntMap<T>;

    constructor(readonly identity: { new(): T },
                initialCount:number, base?: Component<any>) {
        this.pool = new ObjectPool<T>(identity, initialCount);
        this.iid = NextComponentID();
        this.id = this.iid;
        this.map = new IntMap<T>();
        if (base !== undefined) {
            this.id = base.id;
            this.map = base.map;
        }
        _registerComponentType(this);
    }

    bind(entityIndex: number): T {
        const data = this.pool.get();
        this.map.set(entityIndex, data);
        addComponentToEntityList(entityIndex, this.id);
        return data;
    }

    unbind(entityIndex: number): void {
        const r = this.map.getAndDelete(entityIndex);
        r.reset();
        this.pool.retain(r);
    }
}
