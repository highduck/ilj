import {Layout} from "./Layout";
import {Rect} from "@highduck/math";
import {Entity} from "../../ecs/Entity";
import {Transform2D} from "../display/Transform2D";
import {Display2D} from "../display/Display2D";
import {DisplayQuad} from "../display/DisplayQuad";
import {DisplaySprite} from "../display/DisplaySprite";
import {Engine} from "../../Engine";

const TEMP_RECT_0 = new Rect();
const TEMP_RECT = new Rect();

function findRootRect(e: Entity, out: Rect): boolean {
    let it: Entity | undefined = e;
    while (it !== undefined) {
        const transform = it.tryGet(Transform2D);
        if (transform !== undefined && !transform.rect.empty) {
            out.copyFrom(transform.rect);
            return true;
        }
        it = it.parent;
    }
    out.set(0, 0, 0, 0);
    return false;
}

function updateEntityLayout(layout: Layout) {
    const topRect = TEMP_RECT_0;
    const e = layout.entity;

    if (!findRootRect(e, topRect) || topRect.empty) {
        return;
    }

    const transform = e.tryGet(Transform2D);
    const display = e.tryGet(Display2D);
    if (layout.fillX || layout.fillY) {
        if (display instanceof DisplayQuad) {
            if (layout.fillX) {
                display.rect.x = topRect.x;
                display.rect.width = topRect.width;
            }
            if (layout.fillY) {
                display.rect.y = topRect.y;
                display.rect.height = topRect.height;
            }
        } else if (display instanceof DisplaySprite && transform !== undefined) {
            const bounds = display.getBounds(TEMP_RECT);
            if (!bounds.empty) {
                if (layout.fillX) {
                    transform.position.x = topRect.x + layout.fillExtra.x;
                    transform.scale.x = (topRect.width + layout.fillExtra.width) / bounds.width;
                }
                if (layout.fillY) {
                    transform.position.y = topRect.y + layout.fillExtra.y;
                    transform.scale.y = (topRect.height + layout.fillExtra.height) / bounds.height;
                }
            }
        }
    }
    if (transform !== undefined) {
        if (layout.alignX) {
            transform.position.x = topRect.x + layout.x.y + layout.x.x * topRect.width;
        }

        if (layout.alignY) {
            transform.position.y = topRect.y + layout.y.y + layout.y.x * topRect.height;
        }
    }
}

export function updateLayout(engine: Engine) {
    for (const layout of engine.world.query(Layout)) {
        updateEntityLayout(layout);
    }
}