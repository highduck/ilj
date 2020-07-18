import {IntMap} from "../ds/IntMap";
import {_registerComponentType, Component, NextComponentID} from "./Component";

export class TagComponentType implements Component<null> {
    map = new IntMap<null>();
    iid: number;
    id: number;
    identity: number;

    constructor() {
        this.identity = this.id = this.iid = NextComponentID();
        _registerComponentType(this);
    }

    bind(entityIndex: number) {
        this.map.set(entityIndex, null);
        return null;
    }

    unbind(entityIndex: number) {
        this.map.delete(entityIndex);
    }

    components(): null[] {
        return this.map.values;
    }

    entities(): number[] {
        return this.map.keys;
    }
}
