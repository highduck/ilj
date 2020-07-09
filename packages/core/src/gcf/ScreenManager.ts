import {Entity} from "..";

export class ScreenManager {

    readonly screens = new Map<string, Entity>();
    current: Entity | undefined;

    constructor() {

    }

    add(name: string, screen: Entity) {
        this.screens.set(name, screen);
        screen.visible = false;
        screen.touchable = false;
    }

    set(name: string) {
        if (this.current !== undefined) {
            this.current.touchable = false;
            this.current.visible = false;
        }
        this.current = this.screens.get(name);
        if (this.current !== undefined) {
            //G.app.firebase.setScreen({name: name});
            this.current.touchable = true;
            this.current.visible = true;
        }
    }
}