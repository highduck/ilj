import {ComponentTypeA, Entity, getComponents} from "@highduck/core";

interface FsmState {
    readonly onEnter?: (e: Entity) => void;
    readonly onExit?: (e: Entity) => void;
}

export const Fsm = new ComponentTypeA(
    class Data {
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
    }
);

export function updateFsm() {
    const components = getComponents(Fsm);
    for (let i = 0; i < components.length; ++i) {
        const fsm = components[i];
        if (fsm.state !== fsm.next) {
            fsm.state?.onExit?.(fsm.entity);
            fsm.next?.onEnter?.(fsm.entity);
            fsm.state = fsm.next;
        }
    }
}