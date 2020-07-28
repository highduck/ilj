import {Entity, EntityMap} from "./Entity";
import {IntMap} from "../ds/IntMap";
import {_registerComponentType, addComponentToEntityList, Component, NextComponentID} from "./Component";

export class EntityComponentType<T extends { entity: Entity, dispose(): void }> implements Component<T> {
    readonly iid: number;
    readonly id: number;
    readonly map: IntMap<T>;

    constructor(readonly identity: { new(entity: Entity): T },
                base?: Component<any>) {
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
        const data = new this.identity(EntityMap.get(entityIndex)!);
        this.map.set(entityIndex, data);
        addComponentToEntityList(entityIndex, this.id);
        return data;
    }

    unbind(entityIndex: number): void {
        const data = this.map.get(entityIndex);
        if (data !== undefined) {
            data.dispose();
            this.map.delete(entityIndex);
        }
    }
}