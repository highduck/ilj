export interface Constructor<T = {}> {
    new(...args: any[]): T;
}

interface ConstructorWithOptionalID<T = {}> extends Constructor<T> {
    TYPE_ID?: number;
}

export interface ConstructorWithID<T = {}> extends Constructor<T> {
    TYPE_ID: number;
}

let nextTypeID = 0;

export function getTypeID<T>(type: ConstructorWithOptionalID<T>): number {
    return type.TYPE_ID !== undefined ? type.TYPE_ID : (type.TYPE_ID = nextTypeID++);
}

export function declTypeID<T>(base?: ConstructorWithOptionalID<T>): number {
    return base !== undefined ? getTypeID(base) : nextTypeID++;
}
