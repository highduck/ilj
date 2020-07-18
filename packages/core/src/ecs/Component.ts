import {IntMap} from "../ds/IntMap";

export interface Component<T> {
    readonly iid: number;
    readonly id: number;
    readonly identity: any;
    // Entity Index -> Component Data
    readonly map: IntMap<T>;

    bind(entityIndex: number): T;

    unbind(entityIndex: number): void;

    components(): T[];

    entities(): number[];
}

export type TypeOfComponent<P> = P extends Component<infer T> ? T : never;

let nextComponentID = 0;

export function NextComponentID() {
    return nextComponentID++;
}

export const _entityComponentList: Array<number[]> = [];
export const _componentTypes: Array<Component<any>> = [];

export function addComponentToEntityList(entityIndex: number, componentID: number) {
    const list = _entityComponentList[entityIndex];
    list[list.length] = componentID;
}

export function unbindAllComponents(entityIndex: number) {
    const list = _entityComponentList[entityIndex];
    for (let i = 0; i < list.length; ++i) {
        _componentTypes[list[i]].unbind(entityIndex);
    }
    list.length = 0;
}

export function _registerComponentType(componentType: Component<any>) {
    if (!!DEBUG && !!_componentTypes[componentType.iid]) {
        console.error(`Component type already registered: ${componentType}, prev: ${_componentTypes[componentType.id]}`);
    }
    _componentTypes[componentType.iid] = componentType;
}