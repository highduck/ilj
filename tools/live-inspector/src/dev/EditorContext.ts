import {Engine, Entity} from "@highduck/core";

export class EditorContext {

    selected: undefined | Entity;

    constructor(readonly engine: Engine) {
    }

    invalidate() {
        if (this.selected !== undefined && !this.selected.isValid) {
            this.selected = undefined;
        }
    }
}