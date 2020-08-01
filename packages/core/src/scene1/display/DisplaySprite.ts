import {Drawer} from "../../drawer/Drawer";
import {Recta, Vec2} from "@highduck/math";
import {AssetRef} from "../../util/Resources";
import {Sprite} from "../Sprite";
import {Display2D, Display2DComponent} from "./Display2D";
import {SpriteFlag} from "@highduck/anijson";
import {ComponentTypeA} from "../../ecs";

const TMP_RC = new Recta();

export class DisplaySpriteComponent extends Display2DComponent {
    sprite: AssetRef<Sprite> = AssetRef.NONE;

    constructor() {
        super();
    }

    draw(drawer: Drawer) {
        const spr = this.sprite.data;
        if (spr === null || spr.texture.data === null) {
            return;
        }

        drawer.state
            .setTexture(spr.texture.data)
            .setTextureCoordsRect(spr.tex);
        drawer.quadFast(spr.rect.x, spr.rect.y, spr.rect.width, spr.rect.height,
            (spr.flags & SpriteFlag.Rotated) === 0);
    }

    getBounds(out: Recta): void {
        const spr = this.sprite.data;
        if (spr !== null) {
            out.copyFrom(spr.rect);
        } else {
            out.setZero();
        }
    }
}

export const DisplaySprite = new ComponentTypeA(DisplaySpriteComponent, Display2D);