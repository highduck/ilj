import {IntMap} from "../ds/IntMap";

export const _services: IntMap<any> = new IntMap();

let serviceTypeID = 0;

interface ServiceConstructor<T> {
    serviceID?: number;

    new(...args: any[]): T;
}

function getServiceID<T>(ctor: ServiceConstructor<T>): number {
    return ctor.serviceID !== undefined ? ctor.serviceID : (ctor.serviceID = serviceTypeID++);
}

export function register<T extends object>(instance: T) {
    _services.set(getServiceID(instance.constructor as ServiceConstructor<T>), instance);
}

export function resolve<T>(ctor: ServiceConstructor<T>): T {
    const id = getServiceID(ctor);
    const obj = _services.get(id);
    if (obj !== undefined) {
        return obj as T;
    }
    throw `Service ${ctor} not found`;
}
