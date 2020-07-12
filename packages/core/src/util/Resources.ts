import {IntMap} from "../ds/IntMap";
import {StringMap} from "../ds/StringMap";

export class AssetRef<T> {

    static readonly NONE: Readonly<AssetRef<any>> = new AssetRef();

    constructor(public data?: T | undefined) {
    }

    get(): T | undefined {
        return this.data;
    }

    reset(instance?: T) {
        const oldData = this.data;
        if (oldData !== undefined &&
            typeof (oldData as any).dispose === 'function') {
            (oldData as any).dispose();
        }
        this.data = instance;
    }
}

let resourceTypeId = 0;

export const _resourceTypes = new IntMap<ResourceType<any>>();

export class ResourceType<T> {
    readonly id = resourceTypeId++;
    readonly map: StringMap<AssetRef<T>> = new StringMap();

    constructor(readonly ctor: { new(...args: any[]): T; }) {
        _resourceTypes.set(this.id, this);
    }

    get(name: string): AssetRef<T> {
        let s = this.map.get(name);
        if (s === undefined) {
            this.map.set(name, s = new AssetRef<T>());
        }
        return s;
    }

    data(name: string): T | undefined {
        return this.map.get(name)?.data;
    }

    require(name: string): T {
        const data = this.map.get(name)?.data;
        if (data === undefined) {
            throw `Resource ${name} required, but not found`;
        }
        return data;
    }

    reset(name: string, data: T): AssetRef<T> {
        const s = this.get(name);
        s.reset(data);
        return s;
    }
}