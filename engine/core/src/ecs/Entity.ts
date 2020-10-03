import {assert} from "../util/assert";
import {IntMap} from "../ds/IntMap";
import {_entityComponentList, Component, unbindAllComponents} from "./Component";

const freeIndices: number[] = [];
const versions: number[] = [];

/**
 Entity Index -> Entity Wrapper Object

 - set Entity Index and Object
 - delete Entity Index and Object
 query 0: values() and size
 query N: get Entity object by Entity Index
 **/
export const EntityMap = new IntMap<Entity>();

let _next = 0;
let _available = 0;

// TODO: batch allocator
// allocate_n(amount:number, out:Entity[]) {}

function _deallocate(index: number) {
    // increase VERSION
    ++versions[index];
    freeIndices[index] = _next;
    _next = index;
    ++_available;
}

function _allocate(): number {
    if (_available !== 0) {
        const nextFreeIndex = freeIndices[_next];
        const index = _next;
        // freeList[index] = index;
        _next = nextFreeIndex;
        --_available;
        return index;
    }
    // there will be initial VERSION = 0
    // returns new length - 1 to point prev
    // const index = freeIndices.length;
    // freeIndices[index] = index;
    // return index;
    const index = versions.length;
    versions[index] = 0;
    _entityComponentList[index] = [];
    return index;
}

// entities in use right now
export function ECS_getUsedCount() {
    return versions.length - _available;
}

// export function checkEntityPassport(passport: Passport): boolean {
//     return (list[passport & INDEX_MASK] & VERSION_MASK) === (passport & VERSION_MASK);
// }

export function getEntities(): Entity[] {
    return EntityMap.values;
}

function checkHierarchyValidity(a: Entity, b: Entity) {
    assert(a !== b);
    assert(a.isValid);
    assert(b.isValid);
}

const enum EntityFlags {
    Visible = 1,
    Touchable = 2,
    Alive = 4
}

export class Entity {
    name = "";
    flags = 0xFFFF;

    get visible() {
        return (this.flags & EntityFlags.Visible) !== 0;
    }

    set visible(v: boolean) {
        this.flags = v ? (this.flags | EntityFlags.Visible) : (this.flags & ~EntityFlags.Visible);
    }

    get touchable() {
        return (this.flags & EntityFlags.Touchable) !== 0;
    }

    set touchable(v: boolean) {
        this.flags = v ? (this.flags | EntityFlags.Touchable) : (this.flags & ~EntityFlags.Touchable);
    }

    get layerMask() {
        return this.flags & 0xFF00;
    }

    set layerMask(v: number) {
        this.flags = (this.flags & 0xFF) | v;
    }

    private constructor(readonly index: number,
                        readonly version: number) {
    }

    static readonly root = Entity.create();

    static create(): Entity {
        const index = _allocate();
        const e = new Entity(index, versions[index]);
        EntityMap.set(index, e);
        return e;
    }

    toString(): string {
        return this.name ?? `Entity/${this.index}`;
    }

    create(name?: string, index?: number): Entity {
        const child = Entity.create();
        if (name !== undefined) {
            child.name = name;
        }
        if (index !== 0) {
            this.appendStrict(child);
        } else {
            this.prependStrict(child);
        }
        return child;
    }

    // TODO: reuse disposed Entity from shared Pool (shared between contexts, or per context?)
    // private _reset(world: World, passport: Passport) {
    // }

    get isValid(): boolean {
        // return checkEntityPassport(this.passport);
        return versions[this.index] === this.version;
    }

    set<T>(component: Component<T>): T {
        return component.bind(this.index);
    }

    tryGet<T>(component: Component<T>): T | undefined {
        return component.map.get(this.index);
    }

    get<T>(component: Component<T>): T {
        const data = component.map.get(this.index);
        // const data = this.components.get(component.id);
        if (data === undefined) {
            throw new Error(`No component ${component}`);
        }
        return data;
    }

    has<T>(component: Component<T>): boolean {
        // return this.components.has(component.id);
        return component.map.has(this.index);
    }

    getOrCreate<T>(component: Component<T>): T {
        const idx = this.index | 0;
        if (component.map.has(idx)) {
            return component.map.unsafe_get(idx)
        }
        return component.bind(idx);
    }

    delete<T>(component: Component<T>) {
        component.unbind(this.index);
    }

    dispose() {
        // - Remove Entity from parent
        // - destroy all children
        this.removeFromParent();
        this.deleteChildren();

        this._dispose();
    }

    private _dispose() {
        if (!!DEBUG) {
            assert(this.flags & EntityFlags.Alive);
            assert(this.isValid);
        }

        const idx = this.index;
        unbindAllComponents(idx);

        EntityMap.delete(idx);
        _deallocate(idx);
        this.flags = 0;
    }

    /**** Hierarchy component (built-in) ****/
    parent: Entity | null = null;
    siblingNext: Entity | null = null;
    siblingPrev: Entity | null = null;
    childFirst: Entity | null = null;
    childLast: Entity | null = null;

    getChildAt(index: number): Entity | null {
        let i = 0;
        let it = this.childFirst;
        while (it !== null) {
            if (index === i++) {
                return it;
            }
            it = it.siblingNext;
        }
        return null;
    }

    forEachChild(func: (ch: Entity) => void) {
        let it = this.childFirst;
        while (it !== null) {
            const child = it;
            it = it.siblingNext;
            func(child);
        }
    }

    forEachChildBackward(func: (ch: Entity) => void) {
        let it = this.childLast;
        while (it !== null) {
            const child = it;
            it = it.siblingPrev;
            func(child);
        }
    }

    // allow nodes to be out of ROOT?
    get root(): Entity {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let r: Entity = this;
        while (r.parent !== null) {
            r = r.parent;
        }
        return r;
    }

    /**
     Delete all children and sub-children of `entity`
     if `entity` has EntityNode component.
     **/
    deleteChildren() {
        let child = this.childFirst;
        while (child) {
            const temp = child;
            child = child.siblingNext;
            temp.deleteChildren();

            temp.parent = null;
            temp._dispose();
        }
        this.childFirst = null;
        this.childLast = null;
    }

    /**
     Returns true if entity is descendant of ancestor.
     **/
    isDescendant(ancestor: Entity): boolean {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let n: Entity | null = this;
        while (n !== null) {
            n = n.parent;
            if (n == ancestor) {
                return true;
            }
        }
        return false;
    }

    /**
     Remove `entity` from it's parent
     if `entity` has EntityNode component and is a child.
     **/
    removeFromParent() {
        const par = this.parent;
        if (par === null) {
            return;
        }

        const prev = this.siblingPrev;
        const next = this.siblingNext;

        if (prev !== null) {
            prev.siblingNext = next;
        } else {
            par.childFirst = next;
        }

        if (next !== null) {
            next.siblingPrev = prev;
        } else {
            par.childLast = prev;
        }

        this.parent = null;
        this.siblingNext = null;
        this.siblingPrev = null;
    }

    appendStrict(child: Entity) {
        if (!!DEBUG) {
            checkHierarchyValidity(this, child);
            assert(!child.parent);
        }

        const tail = this.childLast;
        if (tail !== null) {
            tail.siblingNext = child;
            child.siblingPrev = tail;
            this.childLast = child;
        } else {
            this.childFirst = child;
            this.childLast = child;
        }
        child.parent = this;
    }

    /**
     Add `child` to `entity` to the end.
     If `child` or `entity` have no EntityNode component, it will be created.
     `child` will be removed from it's current parent.
     **/
    append(child: Entity) {
        if (!!DEBUG) {
            checkHierarchyValidity(this, child);
        }

        if (child.parent !== null) {
            child.removeFromParent();
        }

        this.appendStrict(child);
    }

    prependStrict(child: Entity) {
        if (!!DEBUG) {
            checkHierarchyValidity(this, child);
            assert(!child.parent);
        }

        const head = this.childFirst;
        if (head) {
            child.siblingNext = head;
            head.siblingPrev = child;
            this.childFirst = child;
        } else {
            this.childFirst = child;
            this.childLast = child;
        }
        child.parent = this;
    }

    /**
     Add `child` to `entity` to the beginning.
     If `child` or `entity` have no EntityNode component, it will be created.
     `child` will be removed from it's current parent.
     **/
    prepend(child: Entity) {
        if (child.parent) {
            child.removeFromParent();
        }

        this.prependStrict(child);
    }

    /**
     Remove all children of `entity`
     if `entity` has EntityNode component and is a child.
     **/
    removeChildren() {
        let child = this.childFirst;
        while (child !== null) {
            const temp = child;
            child = child.siblingNext;
            temp.parent = null;
            temp.siblingNext = null;
            temp.siblingPrev = null;
        }
        this.childFirst = null;
        this.childLast = null;
    }

    /**
     Insert `childAfter` next to the `entity`.
     Throws exception if `entity` has no parent.
     `childAfter` will be removed from it's current parent.
     If `childAfter` has not EntityNode component, it will be added.
     **/
    insertAfter(childAfter: Entity) {
        if (!!DEBUG) {
            checkHierarchyValidity(this, childAfter);
            assert(this.parent);
        }

        childAfter.removeFromParent();
        const next = this.siblingNext;
        this.siblingNext = childAfter;
        childAfter.siblingPrev = this;
        if (next !== null) {
            next.siblingPrev = childAfter;
            childAfter.siblingNext = next;
        } else if (this.parent !== null) {
            this.parent.childLast = childAfter;
        }
        childAfter.parent = this.parent;
    }

    insertBeforeStrict(childBefore: Entity) {
        if (!!DEBUG) {
            checkHierarchyValidity(this, childBefore);
            assert(!childBefore.parent);
            assert(this.parent);
        }

        const prev = this.siblingPrev;
        this.siblingPrev = childBefore;
        childBefore.siblingNext = this;
        if (prev !== null) {
            prev.siblingNext = childBefore;
            childBefore.siblingPrev = prev;
        } else if (this.parent !== null) {
            this.parent.childFirst = childBefore;
        }
        childBefore.parent = this.parent;
    }

    /**
     Insert `childBefore` back to the `entity`.
     Throws exception if `entity` has no parent.
     `childBefore` will be removed from it's current parent.
     If `childBefore` has not EntityNode component, it will be added.
     **/
    insertBefore(childBefore: Entity) {
        if (!!DEBUG) {
            assert(this.parent);
        }

        if (childBefore.parent !== null) {
            childBefore.removeFromParent();
        }

        this.insertBeforeStrict(childBefore);
    }

    /**
     Number of children of `entity`.
     Returns 0 if `entity` has no EntityNode component.

     Note: children will be counted in fast-traversing
     from the first to the last child of `entity`
     **/
    countChildren(): number {
        let num = 0;
        let child = this.childFirst;
        while (child !== null) {
            ++num;
            child = child.siblingNext;
        }

        return num;
    }

    find(name: string): Entity | null {
        let child = this.childFirst;
        while (child !== null) {
            if (child.name === name) {
                return child;
            }
            child = child.siblingNext;
        }
        return null;
    }

    findN(name1: string, name2?: string, name3?: string): Entity | null {
        let node = this.find(name1);
        if (node !== null && name2 !== undefined) {
            node = node.find(name2);
            if (node !== null && name3 !== undefined) {
                node = node.find(name3);
            }
        }
        return node;
    }

    findPath(path: string[]): Entity | null {
        let node: Entity | null = this;
        for (let i = 0; i < path.length; ++i) {
            const name = path[i];
            node = node!.find(name);
            if (node === null) {
                break;
            }
        }
        return node;
    }

    setVisible(v: boolean): Entity {
        this.visible = v;
        return this;
    }

    searchRootComponent<T>(component: Component<T>): T | undefined {
        const map = component.map;
        let it: Entity | null = this;
        let c: T | undefined;
        while (it !== null) {
            c = map.get(it.index);
            if (c !== undefined) {
                return c;
            }
            it = it.parent;
        }
        return undefined;
    }
}
