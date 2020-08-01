import {
    assert,
    DisplayQuad,
    EventReceiver,
    Interactive,
    InteractiveManagerEvent,
    Layout,
    Time,
    Transform2D
} from "../..";
import {Engine} from '../../Engine';
import {Entity} from "../../ecs";
import {resetTween} from "../Tween";
import {reach} from "@highduck/math";
import {Popup} from "./Popup";

export class PopupManager {

    active: Entity[] = [];

    fadeProgress = 0.0;
    fadeDuration = 0.4;
    fadeAlpha = 0.5;

    entity: Entity;
    back: Entity;
    layer: Entity;

    constructor(layer: Entity) {
        this.entity = layer.create('popups');
        this.back = this.entity.create("back");
        this.layer = this.entity.create("layer");
        const e = this.entity;
        e.set(Transform2D);
        const backQuad = this.back.set(DisplayQuad);
        backQuad.color = 0xFF000000;
        this.back.set(Layout).fill();

        const interactive = this.back.set(Interactive);
        interactive.onDown.on(() => {
            if (this.active.length !== 0) {
                Engine.current.interactiveManager.sendBackButton();
            }
        });
        this.back.getOrCreate(EventReceiver).hub.on(InteractiveManagerEvent.BackButton, (ev) => {
            ev.processed = true;
        });

        this.layer.set(Transform2D);
        this.layer.set(Layout).aligned(0.5, 0, 0.5, 0);

        e.visible = false;
        e.touchable = false;
    }

    dispose() {
    }

    update() {
        const dt = Time.UI.dt;
        this.fadeProgress = reach(
            this.fadeProgress,
            this.active.length === 0 ? 0 : 1,
            dt / this.fadeDuration
        );
        this.back.getOrCreate(Transform2D).alpha = this.fadeAlpha * this.fadeProgress;

        if (this.active.length !== 0) {
            const front = this.active[this.active.length - 1];
            const popup = front.get(Popup);
            if (popup.closeTimeout > 0.0) {
                popup.closeTimeout -= dt;
                if (popup.closeTimeout <= 0) {
                    this.closePopup(front);
                }
            }
        }
    }


    clear() {
        const e = this.entity;
        this.layer.deleteChildren();
        this.active.length = 0;
        this.fadeProgress = 0.0;
        e.get(Transform2D).alpha = 0.0;
        e.visible = false;
        e.touchable = false;
    }

    closeAll() {
        const active = this.active.concat();
        for (let i = 0; i < active.length; ++i) {
            this.closePopup(active[i]);
        }
    }

    openPopup(e: Entity) {
        if (this.active.indexOf(e) >= 0) {
            return;
        }

        if (e.parent === this.layer) {
            return;
        }

        const popupData = e.getOrCreate(Popup);
        popupData.manager = this;

        if (this.active.length !== 0) {
            const backPopup = this.active[this.active.length - 1];
            backPopup.get(Popup).onPopupPause();
        }

        this.active.push(e);

        const popup = e.get(Popup);
        popup.onPopupOpening();

        const tween = resetTween(e);
        tween.delay = popup.animation.openDelay;
        tween.duration = popup.animation.openDuration;
        tween.advanced.on((r) => {
            popup._applyOpenAnimation(r);
            if (r >= 1.0) {
                popup.onPopupOpened();
            }
        });

        this.layer.appendStrict(e);
        this.entity.visible = true;
        this.entity.touchable = true;
    }

    closePopup(e: Entity) {
        if (this.active.indexOf(e) < 0) {
            return;
        }

        const popup = e.get(Popup);
        popup.onPopupClosing();

        const tween = resetTween(e);
        tween.delay = popup.animation.closeDelay;
        tween.duration = popup.animation.closeDuration;
        tween.advanced.on((t) => {
            popup._applyCloseAnimation(t);
            if (t >= 1.0) {
                onPopupClosed(e);
                popup.onPopupClosed();
            }
        });
    }
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
        const backPopup = manager.active[manager.active.length - 1].get(Popup);
        backPopup.onPopupResume();
    }
}

let popups: PopupManager | null = null;

export function getPopupManager(): PopupManager {
    assert(popups !== null);
    return popups!;
}

export function updatePopupManagers() {
    if (popups !== null) {
        popups.update();
    }
}

export function createPopupManager(layer: Entity) {
    popups = new PopupManager(layer);
}
