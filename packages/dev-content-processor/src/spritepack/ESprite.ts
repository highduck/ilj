import {Rect} from "@highduck/math";
import {SpriteFlag, SpriteJson} from "@highduck/anijson";
import {EImage} from "./EImage";
import {logDebug} from "../env";

export class ESprite {

    name: string = "";

    // physical rect
    readonly rc = new Rect();

    // coords in atlas image
    readonly uv = new Rect();

    // flags in atlas image
    flags = SpriteFlag.None;

    // rect in source image
    readonly source = new Rect(); // integers

    scale = 1;
    trim = true;
    // Should be integer
    padding = 0;

    // reference image;
    image: undefined | EImage = undefined;

    get isPacked() {
        return (this.flags & SpriteFlag.Packed) !== 0;
    }

    get isRotated() {
        return (this.flags & SpriteFlag.Rotated) !== 0;
    }

    enable(flag: SpriteFlag) {
        this.flags |= flag;
    }

    disable(flag: SpriteFlag) {
        this.flags &= ~flag;
    }

    serialize(): SpriteJson {
        return [
            this.rc.x, this.rc.y, this.rc.width, this.rc.height,
            this.uv.x, this.uv.y, this.uv.width, this.uv.height,
            this.flags
        ];
    }

    updateTexCoords(width: number, height: number) {
        let w = this.source.width;
        let h = this.source.height;
        if (this.isRotated) {
            w = this.source.height;
            h = this.source.width;
        }
        this.uv.set(
            this.source.x / width,
            this.source.y / height,
            w / width,
            h / height,
        );
    }

    static createSolid(width: number, height: number, color: number): ESprite {
        const spr = new ESprite();
        spr.rc.set(0, 0, width, height);
        spr.source.set(0, 0, width, height);
        spr.image = new EImage(width, height).clear(color);
        return spr;
    }

    trimImage(): this | undefined {
        if (this.image === undefined) {
            return undefined;
        }

        const rc0 = this.source;
        const scale = this.scale;
        const rc = new Rect().copyFrom(rc0);

        if (this.image.findTrimZone(3, 0, rc)) {
            logSavedArea(rc0, rc);
            if (rc.empty) {
                return undefined;
            }
            this.image = this.image.crop(rc);
            this.rc.x += rc.x / scale;
            this.rc.y += rc.y / scale;
            this.rc.width += (rc.width - rc0.width) / scale;
            this.rc.height += (rc.height - rc0.height) / scale;
            this.source.set(0, 0, rc.width, rc.height);
        }

        return this;
    }
}

function logSavedArea(rc0: Rect, rc1: Rect) {
    const area = Math.trunc(Math.sqrt(rc0.width * rc0.height - rc1.width * rc1.height));
    if (rc1.empty) {
        logDebug(`[TRIM] Removed ${area} px^2`);
    } else {
        logDebug(`[TRIM] Saved area: ${area} px^2`);
        logDebug(`[TRIM]    ${rc0} -> ${rc1}`);
    }
}