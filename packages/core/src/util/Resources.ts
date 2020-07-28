import {IntMap} from "../ds/IntMap";
import {StringMap} from "../ds/StringMap";

export class AssetRef<T extends object> {

    static readonly NONE: Readonly<AssetRef<any>> = new AssetRef(null);

    constructor(public data: T | null) {
    }

    get(): T | null {
        return this.data;
    }

    reset(instance: T | null) {
        const oldData = this.data;
        if (oldData !== null &&
            typeof (oldData as any).dispose === 'function') {
            (oldData as any).dispose();
        }
        this.data = instance;
    }
}

let resourceTypeId = 0;

export const _resourceTypes = new IntMap<ResourceType<any>>();

export class ResourceType<T extends object> {
    readonly id = resourceTypeId++;
    readonly map: StringMap<AssetRef<T>> = new StringMap();

    constructor(readonly ctor: { new(...args: any[]): T; }) {
        _resourceTypes.set(this.id, this);
    }

    get(name: string): AssetRef<T> {
        let s = this.map.get(name);
        if (s === undefined) {
            this.map.set(name, s = new AssetRef<T>(null));
        }
        return s;
    }

    data(name: string): T | null {
        const a = this.map.get(name);
        return a !== undefined ? a.data : null;
    }

    require(name: string): T {
        const a = this.map.get(name);
        if (a === undefined || a.data === null) {
            throw `Resource ${name} required, but not found`;
        }
        return a.data;
    }

    reset(name: string, data: T): AssetRef<T> {
        const s = this.get(name);
        s.reset(data);
        return s;
    }
}