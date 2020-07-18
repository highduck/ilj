import {Entity, EntityMap} from "./Entity";
import {IntMap} from "../ds/IntMap";
import {_registerComponentType, addComponentToEntityList, Component, NextComponentID} from "./Component";

export class EntityComponentType<T extends { entity?: Entity, dispose?(): void }> implements Component<T> {
    readonly iid: number;
    readonly id: number;
    readonly map: IntMap<T>;

    constructor(readonly identity: { new(entity: Entity): T },
                base?: Component<any>) {
        this.iid = NextComponentID();
        if (base !== undefined) {
            this.id = base.id;
            this.map = base.map;
        } else {
            this.id = this.iid;
            this.map = new IntMap<T>();
        }
        _registerComponentType(this);
    }

    bind(entityIndex: number): T {
        const data = new this.identity(EntityMap.get(entityIndex)!);
        this.map.set(entityIndex, data);
        addComponentToEntityList(entityIndex, this.id);
        return data;
    }

    unbind(entityIndex: number): void {
        const data = this.map.get(entityIndex);
        if (data !== undefined) {
            data.dispose !== undefined && data.dispose();
            data.entity = undefined;
            this.map.delete(entityIndex);
        }
    }

    components(): T[] {
        return this.map.values;
    }

    entities(): number[] {
        return this.map.keys;
    }
}