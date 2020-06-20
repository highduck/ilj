import {Disposable} from "./Disposable";
import {ConstructorWithID} from "./TypeID";
import {IntMap} from "./IntMap";
import {StringMap} from "./StringMap";

function isDisposable(object: any): object is Disposable {
    return object && "dispose" in object;
}

export class AssetRef<T> {

    constructor(public data?: T | undefined) {
    }

    get(): T | undefined {
        return this.data;
    }

    reset(instance?: T) {
        if (isDisposable(this.data)) {
            this.data.dispose();
        }
        this.data = instance;
    }
}

class ResourcesRegistry {
    readonly table = new IntMap<StringMap<AssetRef<object>>>();

    get<T extends object>(type: ConstructorWithID<T>, name: string): AssetRef<T> {
        let m = this.table.get(type.TYPE_ID);

        if (!m) {
            m = new StringMap();
            this.table.set(type.TYPE_ID, m);
        }
        let s = m.get(name);
        if (s === undefined) {
            m.set(name, s = new AssetRef<T>());
        }
        return s as AssetRef<T>;
    }

    objects<T extends object>(type: ConstructorWithID<T>): undefined | AssetRef<T>[] {
        const m = this.table.get(type.TYPE_ID);
        return m !== undefined ? m.values as AssetRef<T>[] : undefined;
    }

    reset<T extends object>(type: ConstructorWithID<T>, name: string, data: T): AssetRef<T> {
        const ref = this.get(type, name);
        ref.reset(data);
        return ref;
    }

    require<T extends object>(type: ConstructorWithID<T>, name: string): T {
        const data = this.get(type, name).data;
        if (data === undefined) {
            throw new Error("not found");
        }
        return data;
    }

    data<T extends object>(type: ConstructorWithID<T>, name: string): T | undefined {
        return this.get(type, name).data;
    }
}

export const Resources = new ResourcesRegistry();
