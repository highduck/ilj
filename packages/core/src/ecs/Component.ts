import {IntMap} from "../ds/IntMap";

// export interface ComponentClass<T extends object = {}> {
//     readonly COMP_ID: number;
//
//     new(): T;
// }

export let nextComponentID = 0;

// export function getComponentID<T>(type: ComponentClassOpt<T>): number {
//     return type.COMP_ID !== undefined ? type.COMP_ID : (type.COMP_ID = nextComponentID++);
// }

export function newComponentID<T extends object>(base?: ComponentType<T>): number {
    return base !== undefined ? base.id : nextComponentID++;
}

//
// export function Component2<T extends object>(ctor: { new(): T; }, BaseClass?: ComponentClass): ComponentClass<T> {
//     (ctor as any).COMP_ID = BaseClass !== undefined ? BaseClass.COMP_ID : nextComponentID++;
//     ctor.prototype.entity = undefined;
//     return ctor as ComponentClass<T>;
// }
//
// export const Component = (BaseClass?: ComponentClass) => {
//     const cid = BaseClass !== undefined ? BaseClass.COMP_ID : nextComponentID++;
//     return class {
//         static readonly COMP_ID = cid;
//         readonly entity: Entity = null as unknown as Entity;
//     };
// };
//
// type Constructor<T> = new(...args: any[]) => T;
//
// export const ComponentDeco = <T extends Constructor<T>>(Base: T) =>
//     class extends Base {
//         static readonly COMP_ID = nextComponentID++;
//         readonly entity: Entity = null as unknown as Entity;
//     };

export interface ComponentType<T> {
    readonly ctor: { new(): T };
    readonly id: number;
    readonly new: () => T;
    // Entity Index -> Component Data
    readonly map: IntMap<T>;
}

export const _componentTypes = new IntMap<ComponentType<any>>();

export function _registerComponentType(componentType: ComponentType<any>) {
    if (!!DEBUG && _componentTypes.has(componentType.id)) {
        console.error(`Component type already registered: ${componentType}, prev: ${_componentTypes.get(componentType.id)}`);
    }
    _componentTypes.set(componentType.id, componentType);
}

export function registerComponentClass<T>(ctor: { new(): T }, base?: ComponentType<any>): ComponentType<T> {
    (ctor as any).ctor = ctor;
    (ctor as any).id = newComponentID(base);
    (ctor as any).map = base !== undefined ? base.map : new IntMap<T>();
    (ctor as any).new = () => new ctor();

    const type = ctor as unknown as ComponentType<T>;
    _registerComponentType(type);
    return type;
}

export class TagConstructor {
}

const TAG = new TagConstructor();

export function createTagComponent(): ComponentType<TagConstructor> {
    const type = {
        new(): TagConstructor {
            return TAG;
        },
        map: new IntMap<TagConstructor>(),
        id: newComponentID(),
        ctor: TagConstructor
    };
    _registerComponentType(type);
    return type;
}

export class ComponentTypeA<T> implements ComponentType<T> {
    readonly id: number;
    readonly map: IntMap<T>;

    new(): T {
        return new this.ctor();
    }

    constructor(readonly ctor: { new(): T },
                base?: ComponentType<any>) {
        this.id = newComponentID(base);
        this.map = base !== undefined ? base.map : new IntMap<T>();
        _registerComponentType(this);
    }
}

export function createClassComponent<T>(ctor: { new(): T }, base?: ComponentType<any>): ComponentType<T> & { new(): T } {
    return registerComponentClass(ctor, base) as ComponentType<T> & { new(): T };
}

export type TypeOfComponentData<P> = P extends ComponentType<infer T> ? T : never;