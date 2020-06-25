import {Entity} from "../../ecs/Entity";
import {Cursor} from "../../app/GameView";
import {Interactive} from "./Interactive";
import {hitTest} from "../display/hitTest";
import {AppKeyboardEvent, AppMouseEvent, AppTouchEvent} from "../../app/InputState";
import {Vec2} from "@highduck/math";
import {Engine} from "../../Engine";
import {dispatchBroadcast, EventData, EventReceiver} from "../EventReceiver";

export const enum InteractiveManagerEvent {
    BackButton = "back_button",
    SystemPause = "system_pause"
}

const TEMP_V2 = new Vec2();

function dispatchInteractiveEvent<T>(e: Entity, data: EventData<T>): boolean {
    if (e.touchable) {
        const receiver = e.tryGet(EventReceiver);
        if (receiver !== undefined) {
            data.currentTarget = e;
            receiver.emit(data);
            if (data.processed) {
                return true;
            }
        }
        let it = e.childLast;
        while (it !== undefined) {
            const prev = it.siblingPrev;
            if (dispatchInteractiveEvent(it, data)) {
                return true;
            }
            it = prev;
        }
    }
    return false;
}


export class InteractiveManager {

    readonly pointerScreenSpace = new Vec2();
    pointerDown = false;

    dragEntity?: Entity = undefined;
    private _hitTarget?: Entity = undefined;

    private targetsPrev: Entity[] = [];
    private targetsCurr: Entity[] = [];

    private mouseActive = false;
    private primaryTouchID = -1;
    private readonly primaryTouch = new Vec2();
    private readonly primaryMouse = new Vec2();

    constructor(readonly engine: Engine) {
        engine.input.onMouse.on(this.handleMouseEvent.bind(this));
        engine.input.onTouch.on(this.handleTouchEvent.bind(this));
        engine.input.onKeyboard.on(this.handleKeyboardEvent.bind(this));
    }

    get hitTarget(): Entity | undefined {
        return this._hitTarget;
    }

    process() {
        this.targetsCurr.length = 0;
        //this.pointerGlobalSpace.set(0, 0);
        let cursor: Cursor | undefined = undefined;
        let changed = false;
        if (this.mouseActive) {
            this.pointerScreenSpace.copyFrom(this.primaryMouse);
            changed = true;
        } else if (this.primaryTouchID !== -1) {
            this.pointerScreenSpace.copyFrom(this.primaryTouch);
            changed = true;
        }

        if (changed) {
            const cameras = this.engine.cameraManager.activeCameras;
            const pointerWorldSpace = TEMP_V2;
            for (let i = cameras.length - 1; i >= 0; --i) {
                const camera = cameras[i];
                if (camera.enabled && camera.interactive) {
                    camera.matrix.transform(
                        this.pointerScreenSpace.x,
                        this.pointerScreenSpace.y,
                        pointerWorldSpace
                    );
                    cursor = this.searchInteractiveTargets(pointerWorldSpace, camera.root ?? this.engine.root, this.targetsCurr);
                }
            }
        }

        for (let i = 0; i < this.targetsCurr.length; ++i) {
            const target = this.targetsCurr[i];
            if (target.isValid) {
                const interactive = target.tryGet(Interactive);
                if (interactive && this.targetsPrev.indexOf(target) < 0) {
                    interactive.firePointerOver();
                }
            }
        }

        for (let i = 0; i < this.targetsPrev.length; ++i) {
            const target = this.targetsPrev[i];
            if (target.isValid) {
                const interactive = target.tryGet(Interactive);
                if (interactive && this.targetsCurr.indexOf(target) < 0) {
                    interactive.firePointerOut();
                }
            }
        }

        this.targetsPrev = this.targetsCurr.concat();
        this.engine.view.cursor = cursor !== undefined ? cursor : Cursor.Arrow;
    }

    searchInteractiveTargets(pointer: Vec2, node: Entity, outEntityList: Entity[]): Cursor | undefined {
        let target = hitTest(node, pointer.x, pointer.y);
        if (this.dragEntity && this.dragEntity.isValid) {
            target = this.dragEntity;
        }

        this._hitTarget = target;

        let cursor: Cursor | undefined = undefined;

        while (target !== undefined) {
            const data = target.tryGet(Interactive);
            if (data) {
                data.pointer.copyFrom(pointer);
                if (cursor === undefined) {
                    cursor = data.cursor;
                }
                outEntityList.push(target);
                if (!data.bubble) {
                    break;
                }
            }
            target = target.parent;
        }
        return cursor;
    }

    handleMouseEvent(ev: AppMouseEvent) {
        if (ev.type == "mousedown") {
            this.primaryMouse.set(ev.x, ev.y);
            this.pointerDown = true;
            for (let i = 0; i < this.targetsPrev.length; ++i) {
                const target = this.targetsPrev[i];
                if (target.isValid) {
                    target.tryGet(Interactive)?.firePointerDown();
                }
            }
        } else if (ev.type == "mouseup") {
            this.primaryMouse.set(ev.x, ev.y);
            this.pointerDown = false;
            for (let i = 0; i < this.targetsPrev.length; ++i) {
                const target = this.targetsPrev[i];
                if (target.isValid) {
                    target.tryGet(Interactive)?.firePointerUp();
                }
            }
        } else if (ev.type == "mousemove") {
            this.primaryMouse.set(ev.x, ev.y);
            this.mouseActive = true;
            this.process();
        } else if (ev.type === "mouseout" || ev.type === "mouseleave") {
            this.pointerDown = false;
            this.mouseActive = false;
            this.process();
        }
    }

    handleTouchEvent(ev: AppTouchEvent) {
        if (ev.type == "touchstart") {
            if (this.primaryTouchID === -1) {
                this.primaryTouchID = ev.id;
                this.primaryTouch.set(ev.x, ev.y);
                this.mouseActive = false;
                this.pointerDown = true;
                this.process();
                for (let i = 0; i < this.targetsPrev.length; ++i) {
                    const target = this.targetsPrev[i];
                    if (target.isValid) {
                        target.tryGet(Interactive)?.firePointerDown();
                    }
                }
            }
        }

        if (this.primaryTouchID == ev.id) {
            if (ev.type === "touchend" || ev.type === "touchcancel") {
                this.primaryTouchID = -1;
                this.primaryTouch.set(0, 0);
                this.pointerDown = false;
                for (let i = 0; i < this.targetsPrev.length; ++i) {
                    const target = this.targetsPrev[i];
                    if (target.isValid) {
                        target.tryGet(Interactive)?.firePointerUp();
                    }
                }
            } else {
                this.primaryTouch.set(ev.x, ev.y);
            }
        }
    }

    BACK_BUTTON_EVENT = new EventData(InteractiveManagerEvent.BackButton, this.engine.root, undefined);
    SYSTEM_PAUSE_EVENT = new EventData(InteractiveManagerEvent.SystemPause, this.engine.root, undefined);

    sendBackButton() {
        const ev = this.BACK_BUTTON_EVENT;
        ev.processed = false;
        dispatchInteractiveEvent(ev.source, ev);
    }

    handleSystemPause() {
        const ev = this.SYSTEM_PAUSE_EVENT;
        ev.processed = false;
        dispatchBroadcast(ev.source, ev);
    }

    handleKeyboardEvent(ev: AppKeyboardEvent) {
        if (!ev.repeat && ev.key === "Escape") {
            this.sendBackButton();
        }
    }
}