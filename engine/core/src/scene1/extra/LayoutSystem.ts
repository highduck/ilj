import {Layout, LayoutData} from "./Layout";
import {Recta} from "@highduck/math";
import {Transform2D} from "../display/Transform2D";
import {Display2D} from "../display/Display2D";
import {DisplayQuadComponent} from "../display/DisplayQuad";
import {DisplaySpriteComponent} from "../display/DisplaySprite";
import {Entity, getComponents} from "../../ecs";

const TEMP_RECT_0 = new Recta();
const TEMP_RECT = new Recta();

export function findRootRect(e: Entity, out: Recta): boolean {
    let it: Entity | null = e;
    while (it !== null) {
        const transform = it.tryGet(Transform2D);
        if (transform !== undefined && transform.flagRect) {
            out.copyFrom(transform.rect);
            return true;
        }
        it = it.parent;
    }
    out.set(0.0, 0.0, 0.0, 0.0);
    return false;
}

function updateEntityLayout(layout: LayoutData) {
    const topRect = TEMP_RECT_0;
    const e = layout.entity;
    /*#__NOINLINE__*/ findRootRect(e, topRect);
    if (topRect.empty) {
        return;
    }

    const transform = e.tryGet(Transform2D);
    const display = e.tryGet(Display2D);
    if (layout.fillX || layout.fillY) {
        if (display instanceof DisplayQuadComponent) {
            if (layout.fillX) {
                display.rect.x = topRect.x;
                display.rect.width = topRect.width;
            }
            if (layout.fillY) {
                display.rect.y = topRect.y;
                display.rect.height = topRect.height;
            }
        } else if (display instanceof DisplaySpriteComponent && transform !== undefined) {
            const bounds = TEMP_RECT;
            display.getBounds(bounds);
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

export function updateLayout() {
    const layouts = getComponents(Layout);
    for (let i = 0; i < layouts.length; ++i) {
        updateEntityLayout(layouts[i]);
    }
}