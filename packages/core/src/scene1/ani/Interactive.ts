import {Signal} from "../../util/Signal";
import {Cursor} from "../../app/GameView";
import {Entity} from "../../ecs/Entity";
import {Component, Component2} from "../../ecs/Component";
import {Vec2} from "@highduck/math";

export class Interactive extends Component() {
// class Interactive {
    // events
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

    firePointerOut() {
        this.onOut.emit(this.entity);
        this.over = false;
        this.pushed = false;
    }

    firePointerOver() {
        this.over = true;
        this.onOver.emit(this.entity);
    }

    firePointerUp() {
        const shouldBeClicked = this.pushed && this.over;
        this.pushed = false;
        this.onUp.emit(this.entity);

        if (shouldBeClicked) {
            this.onClicked.emit(this.entity);
        }
    }

    firePointerDown() {
        this.pushed = true;
        this.onDown.emit(this.entity);
    }
}