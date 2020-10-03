import {Entity, EntityComponentType} from "../../ecs";
import {getPopupManager, PopupManager} from "./PopupManager";
import {Button, destroyEntity, Transform2D} from "../..";
import {PopupAnimation} from "./PopupAnimation";

export class PopupScript {
    manager: PopupManager;
    content: Entity;
    background: Entity | null = null;
    closeTimeout = 0.0;
    destroyOnClose = true;
    animation = new PopupAnimation();

    constructor(readonly entity: Entity) {
        this.manager = getPopupManager();
        this.content = entity.find('content') ?? entity;
        this.background = entity.find('background');
        this.entity.getOrCreate(Transform2D);
        this.setup();
    }

    private setup(): this {
        const closeButton = this.content.find("btn_close");
        if (closeButton && closeButton.has(Button)) {
            const btn = closeButton.get(Button);
            btn.clicked.on(() => {
                this.manager.closePopup(this.entity);
            });
            btn.asBackButton = true;
        }
        return this;
    }

    close(): this {
        this.manager.closePopup(this.entity);
        return this;
    }

    open(): this {
        this.manager.openPopup(this.entity);
        return this;
    }

    dispose() {

    }

    _applyOpenAnimation(t: number) {
        this.animation.open(this.content, t);
        if (this.background !== null) {
            this.animation.backgroundOpen(this.background, t);
        }
    }

    _applyCloseAnimation(t: number) {
        this.animation.close(this.content, t);
        if (this.background !== null) {
            this.animation.backgroundClose(this.background, t);
        }
    }

    onPopupPause() {
        this.entity.touchable = false;
    }

    onPopupResume() {
        this.entity.touchable = true;
    }

    onPopupOpening() {
        this.entity.touchable = false;
        this.entity.visible = true;

        this._applyOpenAnimation(0.0);
    }

    onPopupOpened() {
        this.entity.touchable = true;
    }

    onPopupClosing() {
        this.entity.touchable = false;
    }

    onPopupClosed() {
        this.entity.visible = false;
        if (this.destroyOnClose) {
            destroyEntity(this.entity.index);
        } else {
            this.entity.removeFromParent();
        }
    }
}

export const Popup = new EntityComponentType(PopupScript);
