import {Signal} from "../../util/Signal";
import {Cursor} from "../../app/GameView";
import {Entity} from "../../ecs/Entity";
import {ComponentTypeA} from "../../ecs/Component";
import {Vec2} from "@highduck/math";

export class InteractiveComponent {
    readonly onOver = new Signal<Entity>();
    readonly onOut = new Signal<Entity>();
    readonly onDown = new Signal<Entity>();
    readonly onUp = new Signal<Entity>();
    readonly onClicked = new Signal<Entity>();

    cursor?: Cursor;

    //enabled = true;

    bubble = true;
    // responsive state
    over = false;
    pushed = false;

    // World-space pointer (or camera-root space)
    readonly pointer = new Vec2();

    firePointerOut(target: Entity) {
        this.onOut.emit(target);
        this.over = false;
        this.pushed = false;
    }

    firePointerOver(target: Entity) {
        this.over = true;
        this.onOver.emit(target);
    }

    firePointerUp(target: Entity) {
        const shouldBeClicked = this.pushed && this.over;
        this.pushed = false;
        this.onUp.emit(target);

        if (shouldBeClicked) {
            this.onClicked.emit(target);
        }
    }

    firePointerDown(target: Entity) {
        this.pushed = true;
        this.onDown.emit(target);
    }
}

export const Interactive = new ComponentTypeA(InteractiveComponent);