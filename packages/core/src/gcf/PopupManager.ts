import {
    assert,
    Button, destroyEntity,
    DisplayQuad,
    EventReceiver, getComponents,
    Interactive,
    InteractiveManagerEvent,
    Layout,
    Time,
    Transform2D
} from "../";
import {Engine} from '../Engine';
import {ComponentTypeA, Entity, EntityComponentType} from "../ecs";
import {resetTween} from "./Tween";
import {backOut, cubicOut, reach, saturate} from "@highduck/math";

class PopupCloseTimeoutData {
    time = 0.0;
}

export const PopupCloseTimeout = new ComponentTypeA(PopupCloseTimeoutData);

class PopupManagerData {
    constructor(readonly entity: Entity) {
        this.back = entity.create("back");
        this.layer = entity.create("layer");
    }

    active: Entity[] = [];

    fadeProgress = 0.0;
    fadeDuration = 0.4;
    fadeAlpha = 0.5;

    back: Entity;
    layer: Entity;

    dispose() {
    }
}

export const PopupManager = new EntityComponentType(PopupManagerData);

let popups: null | Entity = null;

function getPopupManager() {
    assert(popups !== null);
    const manager = popups!.tryGet(PopupManager);
    assert(manager !== undefined);
    return manager!;
}

function onPopupPause(e: Entity) {
    e.touchable = false;
}

function onPopupResume(e: Entity) {
    e.touchable = true;
}

function onPopupOpening(e: Entity) {
    const transform = e.getOrCreate(Transform2D);
    transform.scale.set(0, 0);
    e.touchable = false;
    e.visible = true;
}

function onPopupOpenAnimation(t: number, e: Entity) {
    t = saturate(t);
    const scale = backOut(t);
    const fly = cubicOut(t);
    const transform = e.getOrCreate(Transform2D);
    transform.position.y = 100 * (1 - fly);
    transform.scale.set(scale, scale);
}

function onPopupOpened(e: Entity) {
    e.touchable = true;
}

function onPopupClosing(e: Entity) {
    e.touchable = false;
}

function onPopupClosed(e: Entity) {

    const manager = getPopupManager();
    const idx = manager.active.indexOf(e);
    if (idx >= 0) {
        manager.active.splice(idx, 1);
    }

    if (manager.active.length === 0) {
        manager.entity.touchable = false;
        manager.entity.visible = false;
    } else {
        onPopupResume(manager.active[manager.active.length - 1]);
    }
    e.visible = false;
    destroyEntity(e.index);
}

function onPopupCloseAnimation(t: number, e: Entity) {
    t = saturate(1 - t);
    const scale = backOut(t);
    const fly = cubicOut(t);
    const transform = e.getOrCreate(Transform2D);
    transform.position.y = -100 * (1 - fly);
    transform.scale.set(scale, scale);
}

export function initBasicPopup(e: Entity) {
    const close = e.find("btn_close");
    if (close && close.has(Button)) {
        const btn = close.get(Button);
        btn.clicked.on(() => closePopup(e));
        btn.asBackButton = true;
    }
}

export function openPopup(e: Entity) {
    const manager = getPopupManager();
    if (manager.active.indexOf(e) >= 0) {
        return;
    }

    if (e.parent === manager.layer) {
        return;
    }

    if (manager.active.length !== 0) {
        onPopupPause(manager.active[manager.active.length - 1]);
    }

    manager.active.push(e);
    onPopupOpening(e);

    const tween = resetTween(e);
    tween.delay = 0.1;
    tween.duration = 0.4;
    tween.advanced.on((r) => {
        if (r >= 1) {
            onPopupOpened(e);
        }
        onPopupOpenAnimation(r, e);
    });

    manager.layer.append(e);
    manager.entity.visible = true;
    manager.entity.touchable = true;
}

export function closePopup(e: Entity) {
    const manager = getPopupManager();
    if (manager.active.indexOf(e) < 0) {
        return;
    }

    onPopupClosing(e);

    const tween = resetTween(e);
    tween.delay = 0.1;
    tween.duration = 0.4;
    tween.advanced.on((t) => {
        onPopupCloseAnimation(t, e);
        if (t >= 1) {
            onPopupClosed(e);
        }
    });
}

export function updatePopupManagers() {
    const managers = getComponents(PopupManager);
    const dt = Time.UI.dt;
    for (let i = 0; i < managers.length; ++i) {
        const manager = managers[i];
        manager.fadeProgress = reach(
            manager.fadeProgress,
            manager.active.length === 0 ? 0 : 1,
            dt / manager.fadeDuration
        );
        manager.back.getOrCreate(Transform2D).alpha = manager.fadeAlpha * manager.fadeProgress;

        if (manager.active.length !== 0) {
            const front = manager.active[manager.active.length - 1];
            const closeTimeout = front.tryGet(PopupCloseTimeout);
            if (closeTimeout !== undefined) {
                closeTimeout.time -= dt;
                if (closeTimeout.time <= 0) {
                    front.delete(PopupCloseTimeout);
                    closePopup(front);
                }
            }
        }
    }
}

export function createPopupManager(layer: Entity) {
    const e = layer.create("popups");
    e.set(Transform2D);
    const manager = e.set(PopupManager);
    const backQuad = manager.back.set(DisplayQuad);
    backQuad.color = 0xFF000000;
    manager.back.set(Layout).fill();

    const interactive = manager.back.set(Interactive);
    interactive.onDown.on(() => {
        if (manager.active.length !== 0) {
            Engine.current.interactiveManager.sendBackButton();
        }
    });
    manager.back.getOrCreate(EventReceiver).hub.on(InteractiveManagerEvent.BackButton, (ev) => {
        ev.processed = true;
    });

    manager.layer.set(Transform2D);
    manager.layer.set(Layout).aligned(0.5, 0, 0.5, 0);

    e.visible = false;
    e.touchable = false;

    popups = e;
    return e;
}

function clearPopups() {
    const manager = getPopupManager();
    const e = manager.entity;
    manager.layer.deleteChildren();
    manager.active.length = 0;
    manager.fadeProgress = 0.0;
    e.get(Transform2D).alpha = 0.0;
    e.visible = false;
    e.touchable = false;
}

export function closeAllPopups() {
    const manager = getPopupManager();
    const active = manager.active.concat();
    for (const popup of active) {
        closePopup(popup);
    }
}
