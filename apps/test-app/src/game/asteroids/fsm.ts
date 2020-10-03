import {ComponentTypeA, Entity, EntityMap} from "@highduck/core";

interface FsmState {
    readonly onEnter?: (e: Entity) => void;
    readonly onExit?: (e: Entity) => void;
}

export const Fsm = new ComponentTypeA(
    class Data {
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
    const components = Fsm.map.values;
    const entities = Fsm.map.keys;
    for (let i = 0; i < components.length; ++i) {
        const fsm = components[i];
        if (fsm.state !== fsm.next) {
            const entity = EntityMap.get(entities[i])!;
            fsm.state?.onExit?.(entity);
            fsm.next?.onEnter?.(entity);
            fsm.state = fsm.next;
        }
    }
}