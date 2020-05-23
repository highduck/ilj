import {Entity} from "@highduck/core";

export class EditorContext {

    selected: undefined | Entity;

    constructor() {
    }

    invalidate() {
        if (this.selected !== undefined && !this.selected.isValid) {
            this.selected = undefined;
        }
    }
}