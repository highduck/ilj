import {assert} from "../util/assert";
import {_allocate, _deallocate, checkEntityPassport, objs} from "./World";
import {IntMap} from "../ds/IntMap";
import {_componentTypes, ComponentType} from "./Component";

export type Passport = number;

const INDEX_MASK = 0xFFFFF;

interface ComponentInternals {
    entity?: Entity;

    dispose?(): void;
}

function checkHierarchyValidity(a: Entity, b: Entity) {
    assert(a !== b);
    assert(a.isValid);
    assert(b.isValid);
}

export class Entity {
    readonly components = new IntMap<any>();

    name?: string;
    visible = true;
    touchable = true;
    layerMask = 0xFF;

    private _disposed = false;

    private constructor(readonly passport: Passport) {
    }

    static readonly root = Entity.create();

    static create(): Entity {
        const pass = _allocate();
        const e = new Entity(pass);
        objs.set(pass & INDEX_MASK, e);
        return e;
    }

    toString(): string {
        return this.name ?? `Entity/${this.passport & INDEX_MASK}`;
    }

    create(name?: string, index?: number): Entity {
        const child = Entity.create();
        child.name = name;
        if (index === 0) {
            this.prependStrict(child);
        } else {
            this.appendStrict(child);
        }
        return child;
    }

    // TODO: reuse disposed Entity from shared Pool (shared between contexts, or per context?)
    // private _reset(world: World, passport: Passport) {
    // }

    get isValid(): boolean {
        return checkEntityPassport(this.passport);
    }

    set<T>(component: ComponentType<T>): T {
        const data = component.new();
        (data as any).entity = this;
        this.components.set(component.id, data);
        component.map.set(this.passport & INDEX_MASK, data);
        return data;
    }

    tryGet<T>(component: ComponentType<T>): T | undefined {
        return this.components.get(component.id) as (T | undefined);
        // 3 access / map.get / array access

        //return component.map.get(this.passport & INDEX_MASK);
        // map.get / array access / 3 access / bit mask
    }

    get<T>(component: ComponentType<T>): T {
        const data = this.components.get(component.id);
        if (data === undefined) {
            throw new Error(`No component ${component}`);
        }
        return data as T;
    }

    has<T>(component: ComponentType<T>): boolean {
        return this.components.has(component.id);
    }

    getOrCreate<T>(component: ComponentType<T>): T {
        const cid = component.id;
        let data = this.components.get(cid);
        if (data === undefined) {
            data = component.new();
            (data as any).entity = this;
            component.map.set(this.passport & INDEX_MASK, data);
            this.components.set(cid, data);
        }
        return data as T;
    }

    delete<T>(component: ComponentType<T>) {
        component.map.delete(this.passport & INDEX_MASK);
        this.components.delete(component.id);
    }

    dispose() {
        if (!!DEBUG) {
            assert(!this._disposed);
        }

        // - Remove Entity from parent
        // - destroy all children
        this.removeFromParent();
        this.deleteChildren();

        for (let i = 0, e = this.components.keys.length; i < e; ++i) {
            const k = this.components.keys[i];
            const v = this.components.values[i] as {
                entity?: Entity;
                dispose?(): void;
            };
            if (v.dispose !== undefined) {
                v.dispose();
            }
            v.entity = undefined;
            _componentTypes.get(k)!.map.delete(this.passport & INDEX_MASK);
        }
        // we are disposing, it could not need to clear local map?
        this.components.clear();

        objs.delete(this.passport & INDEX_MASK);
        _deallocate(this.passport);
        this._disposed = true;
    }

    /**** Hierarchy component (built-in) ****/
    parent: Entity | undefined;
    siblingNext: Entity | undefined;
    siblingPrev: Entity | undefined;
    childFirst: Entity | undefined;
    childLast: Entity | undefined;

    getChildAt(index: number): Entity | undefined {
        let i = 0;
        let it = this.childFirst;
        while (it !== undefined) {
            if (index === i++) {
                return it;
            }
            it = it.siblingNext;
        }
        return undefined;
    }

    forEachChild(func: (ch: Entity) => void) {
        let it = this.childFirst;
        while (it !== undefined) {
            const child = it;
            it = it.siblingNext;
            func(child);
        }
    }

    forEachChildBackward(func: (ch: Entity) => void) {
        let it = this.childLast;
        while (it !== undefined) {
            const child = it;
            it = it.siblingPrev;
            func(child);
        }
    }

    // allow nodes to be out of ROOT?
    get root(): Entity {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let r: Entity = this;
        while (r.parent !== undefined) {
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

            temp.parent = undefined;
            // world_disable_node(temp);
            temp.dispose();
        }
        this.childFirst = undefined;
        this.childLast = undefined;
    }

    /**
     Returns true if entity is descendant of ancestor.
     **/
    isDescendant(ancestor: Entity): boolean {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let n: Entity | undefined = this;
        while (n !== undefined) {
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
        if (par === undefined) {
            return;
        }

        const prev = this.siblingPrev;
        const next = this.siblingNext;

        if (prev !== undefined) {
            prev.siblingNext = next;
        } else {
            par.childFirst = next;
        }

        if (next !== undefined) {
            next.siblingPrev = prev;
        } else {
            par.childLast = prev;
        }

        this.parent = undefined;
        this.siblingNext = undefined;
        this.siblingPrev = undefined;
    }

    appendStrict(child: Entity) {
        if (!!DEBUG) {
            checkHierarchyValidity(this, child);
            assert(!child.parent);
        }

        const tail = this.childLast;
        if (tail !== undefined) {
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

        if (child.parent !== undefined) {
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
        while (child) {
            const temp = child;
            child = child.siblingNext;
            temp.parent = undefined;
            temp.siblingNext = undefined;
            temp.siblingPrev = undefined;
        }
        this.childFirst = undefined;
        this.childLast = undefined;
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
        if (next !== undefined) {
            next.siblingPrev = childAfter;
            childAfter.siblingNext = next;
        } else if (this.parent !== undefined) {
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
        if (prev !== undefined) {
            prev.siblingNext = childBefore;
            childBefore.siblingPrev = prev;
        } else if (this.parent !== undefined) {
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

        if (childBefore.parent !== undefined) {
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
        while (child !== undefined) {
            ++num;
            child = child.siblingNext;
        }

        return num;
    }

    find(name: string): Entity | undefined {
        let child = this.childFirst;
        while (child !== undefined) {
            if (child.name === name) {
                return child;
            }
            child = child.siblingNext;
        }
        return undefined;
    }

    findN(name1: string, name2?: string, name3?: string): Entity | undefined {
        let node: Entity | undefined = this.find(name1);
        if (node !== undefined && name2 !== undefined) {
            node = node.find(name2);
            if (node !== undefined && name3 !== undefined) {
                node = node.find(name3);
            }
        }
        return node;
    }

    findPath(path: string[]): Entity | undefined {
        let node: Entity | undefined = this;
        for (let i = 0; i < path.length; ++i) {
            const name = path[i];
            node = node!.find(name);
            if (node === undefined) {
                break;
            }
        }
        return node;
    }

    setVisible(v: boolean): Entity {
        this.visible = v;
        return this;
    }

    searchRootComponent<T>(component: ComponentType<T>): T | undefined {
        const cid = component.id;
        let it: Entity | undefined = this;
        let c: T | undefined;
        while (it !== undefined) {
            c = it.components.get(cid) as (T | undefined);
            if (c !== undefined) {
                return c;
            }
            it = it.parent;
        }
        return undefined;
    }
}
