import {Texture} from "../graphics/Texture";
import {Rect} from "@highduck/math";
import {AssetRef} from "../util/Resources";
import {Drawer} from "../drawer/Drawer";
import {declTypeID} from "../util/TypeID";

export const enum SpriteFlag {
    None = 0,
    Rotated = 1,
    Packed = 2,
}

export interface SpriteJson {
    name: string;
    rc: [number, number, number, number];
    uv: [number, number, number, number];
    flags: SpriteFlag;
}

export class Sprite {
    static TYPE_ID = declTypeID();

    readonly rect = new Rect();
    readonly tex = new Rect();

    constructor(public texture: AssetRef<Texture>,
                public flags: SpriteFlag = 0) {

    }

    hitTest(x: number, y: number): boolean {
        return !!this.texture.get();
    }

    draw(drawer: Drawer) {
        if (this.texture.data) {
            drawer.state.setTextureRegion(this.texture.data, this.tex);
            drawer.quadFast(this.rect.x, this.rect.y, this.rect.width, this.rect.height,
                (this.flags & SpriteFlag.Rotated) === 0);
        }
    }
}
