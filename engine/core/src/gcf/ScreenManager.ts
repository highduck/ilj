import {Entity} from "../ecs";

export class ScreenBase {
    readonly layer: Entity;

    constructor(layer?: Entity) {
        this.layer = layer ?? Entity.create();
        this.layer.visible = false;
        this.layer.touchable = false;
    }

    onEnter() {

    }

    onExit() {

    }

    enter() {
        this.layer.visible = true;
        this.layer.touchable = true;
        this.update();
        this.onEnter();
    }

    exit() {
        this.layer.visible = false;
        this.layer.touchable = false;
        this.onExit();
    }

    update() {

    }
}

export class ScreenManager {

    readonly screens = new Map<string, ScreenBase>();
    current: ScreenBase | undefined = undefined;

    constructor(readonly layer: Entity) {

    }

    add(name: string, screen: ScreenBase) {
        this.screens.set(name, screen);
        this.layer.appendStrict(screen.layer);
        screen.layer.name = name;
    }

    set(name: string) {
        if (this.current !== undefined) {
            this.current.exit();
        }
        this.current = this.screens.get(name);
        if (this.current !== undefined) {
            //G.app.firebase.setScreen({name: name});
            this.current.enter();
        }
    }

    update() {
        if (this.current !== undefined) {
            this.current.update();
        }
    }
}