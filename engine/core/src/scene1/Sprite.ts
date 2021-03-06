import {Texture} from "../graphics/Texture";
import {Recta} from "@highduck/math";
import {AssetRef, ResourceType} from "../util/Resources";
import {Drawer} from "../drawer/Drawer";
import {SpriteFlag} from "@highduck/anijson";

export class Sprite {
    readonly rect = new Recta();
    readonly tex = new Recta(0, 0, 1, 1);

    constructor(public texture: AssetRef<Texture>,
                public flags: SpriteFlag = 0) {

    }

    hitTest(x: number, y: number): boolean {
        return this.texture.data !== null;
    }

    draw(drawer: Drawer) {
        if (this.texture.data) {
            drawer.state.setTextureRegion(this.texture.data, this.tex);
            drawer.quadFast(this.rect.x, this.rect.y, this.rect.width, this.rect.height,
                (this.flags & SpriteFlag.Rotated) === 0);
        }
    }
}

export const SpriteResource = new ResourceType(Sprite);
