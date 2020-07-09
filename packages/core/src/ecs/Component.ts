import {Entity} from "./Entity";

interface ComponentConstructor<T extends object> {
    new(): T;
}

interface ComponentClassOpt<T extends object> extends ComponentConstructor<T> {
    COMP_ID?: number;
}

export interface ComponentClass<T extends object> extends ComponentConstructor<T> {
    COMP_ID: number;
}

let nextComponentID = 0;

// export function getComponentID<T>(type: ComponentClassOpt<T>): number {
//     return type.COMP_ID !== undefined ? type.COMP_ID : (type.COMP_ID = nextComponentID++);
// }

function declComponentID<T extends object>(base?: ComponentClass<T>): number {
    return base !== undefined ? base.COMP_ID : nextComponentID++;
}

export function Component(base?: ComponentClass<object>): ComponentClass<object> {
    return class Component {
        static COMP_ID = declComponentID(base);
        entity!:Entity;
    };
}