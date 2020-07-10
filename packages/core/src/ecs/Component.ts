import {Entity} from "./Entity";

export interface ComponentClass<T extends object = {}> {
    readonly COMP_ID: number;

    new(): T;
}

export let nextComponentID = 0;

// export function getComponentID<T>(type: ComponentClassOpt<T>): number {
//     return type.COMP_ID !== undefined ? type.COMP_ID : (type.COMP_ID = nextComponentID++);
// }

function declComponentID<T extends object>(base?: ComponentClass<T>): number {
    return base !== undefined ? base.COMP_ID : nextComponentID++;
}

export function Component2<T extends object>(ctor: { new(): T; }, BaseClass?: ComponentClass): ComponentClass<T> {
    (ctor as any).COMP_ID = BaseClass !== undefined ? BaseClass.COMP_ID : nextComponentID++;
    ctor.prototype.entity = undefined;
    return ctor as ComponentClass<T>;
}

export const Component = (BaseClass?: ComponentClass) => {
    const cid = BaseClass !== undefined ? BaseClass.COMP_ID : nextComponentID++;
    return class {
        static readonly COMP_ID = cid;
        readonly entity: Entity = null as unknown as Entity;
    };
};
//
// type Constructor<T> = new(...args: any[]) => T;
//
// export const ComponentDeco = <T extends Constructor<T>>(Base: T) =>
//     class extends Base {
//         static readonly COMP_ID = nextComponentID++;
//         readonly entity: Entity = null as unknown as Entity;
//     };


class ComponentDef<T> {
    id: number;

    constructor(readonly ctor: { new(): T },
                base?: ComponentDef<any>) {
        this.id = base !== undefined ? base.id : nextComponentID++;
    }
}