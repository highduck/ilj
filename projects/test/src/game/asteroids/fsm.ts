import {declTypeID, Engine, Entity} from "@highduck/core";

interface FsmState {
    readonly onEnter?: (e: Entity) => void;
    readonly onExit?: (e: Entity) => void;
}

export class Fsm {

    static TYPE_ID = declTypeID();
    readonly entity!: Entity;

    state?: FsmState;
    next?: FsmState;
    readonly states = new Map<string, FsmState>();

    add(state: string, handlers: FsmState) {
        this.states.set(state, handlers);
    }

    set(state: string) {
        this.next = this.states.get(state);
    }

    static update() {
        const w = Engine.current.world;
        for (const fsm of w.query(Fsm)) {
            if (fsm.state !== fsm.next) {
                fsm.state?.onExit?.(fsm.entity);
                fsm.next?.onEnter?.(fsm.entity);
                fsm.state = fsm.next;
            }
        }
    }
}