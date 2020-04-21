import {assert} from "../util/assert";
import {World} from "./World";
import {ConstructorWithID} from "../util/TypeID";
import {Engine} from "../Engine";

export type Passport = number;

const MASK_INDEX = 0xFFFFF;

interface ComponentInternals {
    entity?: Entity;

    dispose?(): void;
}

function checkHierarchyValidity(a: Entity, b: Entity) {
    assert(a !== b);
    assert(a.world === b.world);
    assert(a.isValid);
    assert(b.isValid);
}

export class Entity {
    readonly components = new Map<number, object>();
    name?: string;
    visible = true;
    touchable = true;
    layerMask = 0xFF;

    dt = 0;
    timeTotal = 0;
    timeScale = 1;

    readonly engine: Engine;

    constructor(readonly world: World,
                readonly passport: Passport) {
        this.engine = world.engine;
    }

    toString(): string {
        return this.name ?? `Entity/${this.passport & MASK_INDEX}`;
    }

    create(name?: string, index?: number): Entity {
        const child = this.world.create();
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
        return this.world?.check(this.passport) ?? false;
    }

    // TODO: somehow we need to return all components
    initComps(...types: ConstructorWithID<object>[]): this {
        for (const type of types) {
            this.set(type);
        }
        return this;
    }

    set<T extends object>(c: ConstructorWithID<T>, ...args: any[]): T {
        const data = new c(...args);
        (data as ComponentInternals).entity = this;
        this.components.set(c.TYPE_ID, data);
        this.world.ensure(c.TYPE_ID).set(this.passport & MASK_INDEX, data);
        return data;
    }

    tryGet<T extends object>(c: ConstructorWithID<T>): T | undefined {
        return this.components.get(c.TYPE_ID) as (T | undefined);
    }

    get<T extends object>(type: ConstructorWithID<T>): T {
        const data = this.components.get(type.TYPE_ID);
        if (data === undefined) {
            throw new Error(`No component ${type}`);
        }
        return data as T;
    }

    has<T extends object>(c: ConstructorWithID<T>): boolean {
        return this.components.has(c.TYPE_ID);
    }

    getOrCreate<T extends object>(c: ConstructorWithID<T>, ...args: []): T {
        let data = this.components.get(c.TYPE_ID);
        if (!data) {
            data = new c(...args);
            (data as ComponentInternals).entity = this;
            this.world.ensure(c.TYPE_ID).set(this.passport & MASK_INDEX, data);
            this.components.set(c.TYPE_ID, data);
        }
        return data as T;
    }

    delete<T extends object>(c: ConstructorWithID<T>) {
        this.world.delete(this.passport, c.TYPE_ID);
        this.components.delete(c.TYPE_ID);
    }

    dispose() {
        assert(this.world);

        // - Remove Entity from parent
        // - destroy all children
        this.removeFromParent();
        this.deleteChildren();

        for (const [k, v] of this.components.entries()) {
            const va = v as {
                entity?: Entity;
                dispose?(): void;
            };
            this.world.delete(this.passport, k);
            if (va.dispose !== undefined) {
                va.dispose();
            }
            delete va.entity;
        }
        // we are disposing, it could not need to clear local map?
        this.components.clear();

        this.world.objs.delete(this.passport & MASK_INDEX);
        this.world._deallocate(this.passport);
        delete (this as { world?: World }).world;
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
        checkHierarchyValidity(this, child);
        assert(!child.parent);

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
        checkHierarchyValidity(this, child);
        if (child.parent !== undefined) {
            child.removeFromParent();
        }

        this.appendStrict(child);
    }

    prependStrict(child: Entity) {
        checkHierarchyValidity(this, child);
        assert(!child.parent);

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
        checkHierarchyValidity(this, childAfter);
        assert(this.parent);

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
        checkHierarchyValidity(this, childBefore);
        assert(!childBefore.parent);
        assert(this.parent);

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
        assert(this.parent);

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

    findChild(name: string): Entity | undefined {
        let child = this.childFirst;
        while (child !== undefined) {
            if (child.name === name) {
                return child;
            }
            child = child.siblingNext;
        }
        return undefined;
    }

    find(...path: string[]): Entity | undefined {
        let node: Entity | undefined = this;
        for (const name of path) {
            node = node!.findChild(name);
            if (node === undefined) {
                break;
            }
        }
        return node;
    }

    findComp<T extends object>(type: ConstructorWithID<T>, ...path: string[]): T | undefined {
        return this.find(...path)?.tryGet(type);
    }

    setVisible(v: boolean): Entity {
        this.visible = v;
        return this;
    }
}
