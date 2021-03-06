import {Entity} from "../../ecs/Entity";
import {Interactive} from "./Interactive";
import {hitTest} from "../display/hitTest";
import {AppKeyboardEvent, AppMouseEvent, AppTouchEvent} from "../../app/InputState";
import {Vec2} from "@highduck/math";
import {Engine} from "../../Engine";
import {dispatchBroadcast, EventData, EventReceiver} from "../EventReceiver";
import {Cursor} from "../../app/MouseCursor";

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
        while (it !== null) {
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

    dragEntity: Entity | null = null;
    private _hitTarget: Entity | null = null;

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

    get hitTarget(): Entity | null {
        return this._hitTarget;
    }

    process() {
        this.targetsCurr.length = 0;
        //this.pointerGlobalSpace.set(0, 0);
        let cursor = Cursor.Arrow;
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
                    //if (camera.worldRect.contains(pointerWorldSpace.x, pointerWorldSpace.y)) {
                    cursor = this.searchInteractiveTargets(pointerWorldSpace, camera.root, this.targetsCurr);
                    //}
                }
            }
        }

        for (let i = 0; i < this.targetsCurr.length; ++i) {
            const target = this.targetsCurr[i];
            if (target.isValid) {
                const interactive = target.tryGet(Interactive);
                if (interactive && this.targetsPrev.indexOf(target) < 0) {
                    interactive.firePointerOver(target);
                }
            }
        }

        for (let i = 0; i < this.targetsPrev.length; ++i) {
            const target = this.targetsPrev[i];
            if (target.isValid) {
                const interactive = target.tryGet(Interactive);
                if (interactive && this.targetsCurr.indexOf(target) < 0) {
                    interactive.firePointerOut(target);
                }
            }
        }

        const tmp = this.targetsCurr;
        this.targetsCurr = this.targetsPrev;
        this.targetsPrev = tmp;

        this.engine.cursor.set(cursor);
    }

    searchInteractiveTargets(pointer: Vec2, node: Entity, outEntityList: Entity[]): Cursor {
        let target = hitTest(node, pointer.x, pointer.y);
        if (this.dragEntity && this.dragEntity.isValid) {
            target = this.dragEntity;
        }

        this._hitTarget = target;

        let cursor = Cursor.Bypass;

        while (target !== null) {
            const data = target.tryGet(Interactive);
            if (data) {
                data.pointer.copyFrom(pointer);
                if (cursor === Cursor.Bypass) {
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

    private firePointerDown() {
        for (let i = 0; i < this.targetsPrev.length; ++i) {
            const target = this.targetsPrev[i];
            if (target.isValid) {
                target.tryGet(Interactive)?.firePointerDown(target);
            }
        }
    }

    private firePointerUp() {
        for (let i = 0; i < this.targetsPrev.length; ++i) {
            const target = this.targetsPrev[i];
            if (target.isValid) {
                target.tryGet(Interactive)?.firePointerUp(target);
            }
        }
    }

    handleMouseEvent(ev: AppMouseEvent) {
        if (ev.type === "mousedown") {
            this.primaryMouse.set(ev.x, ev.y);
            this.pointerDown = true;
            this.firePointerDown();
        } else if (ev.type === "mouseup") {
            this.primaryMouse.set(ev.x, ev.y);
            this.pointerDown = false;
            this.firePointerUp();
        } else if (ev.type === "mousemove") {
            this.primaryMouse.set(ev.x, ev.y);
            this.mouseActive = true;
            this.process();
        } else if (ev.type === "mouseout" || ev.type === "mouseleave") {
            this.pointerDown = false;
            this.mouseActive = false;
            this.firePointerUp();
            // this.process();
        }
    }

    handleTouchEvent(ev: AppTouchEvent) {
        if (ev.type === "touchstart") {
            if (this.primaryTouchID === -1) {
                this.primaryTouchID = ev.id;
                this.primaryTouch.set(ev.x, ev.y);
                this.mouseActive = false;
                this.pointerDown = true;
                this.process();
                this.firePointerDown();
            }
        }

        if (this.primaryTouchID == ev.id) {
            if (ev.type === "touchend" || ev.type === "touchcancel") {
                this.primaryTouchID = -1;
                this.primaryTouch.set(0, 0);
                this.pointerDown = false;
                this.firePointerUp();
            } else {
                this.primaryTouch.set(ev.x, ev.y);
            }
        }
    }

    BACK_BUTTON_EVENT = new EventData(InteractiveManagerEvent.BackButton, Entity.root, undefined);
    SYSTEM_PAUSE_EVENT = new EventData(InteractiveManagerEvent.SystemPause, Entity.root, undefined);

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