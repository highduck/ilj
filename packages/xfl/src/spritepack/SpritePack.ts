import {Rect} from "@highduck/math";
import {AtlasJson, AtlasPageJson, SpriteFlag, SpriteJson} from "@highduck/anijson";

export class SpriteImage {

    width: number;
    height: number;
    data: Uint8Array | undefined = undefined;

    constructor(w: number, h: number) {
        this.width = w;
        this.height = h;
    }

    dispose() {

    }
}

export class Sprite {

    name: string = "";

    // physical rect
    readonly rc = new Rect();

    // coords in atlas image
    readonly uv = new Rect();

    // flags in atlas image
    flags = SpriteFlag.None;

    // rect in source image
    readonly source = new Rect(); // integers

    // TODO: make dynamic (prev default 1)
    padding = 2;

    // reference image;
    image: undefined | SpriteImage = undefined;

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
        return {
            name: this.name,
            rc: [this.rc.x, this.rc.y, this.rc.width, this.rc.height],
            uv: [this.uv.x, this.uv.y, this.uv.width, this.uv.height],
            flags: this.flags
        };
    }
}

export class AtlasPage {
    width = 0;
    height = 0;
    sprites: Sprite[] = [];
    image_path: string = "";
    image: undefined | SpriteImage = undefined;

    serialize(): AtlasPageJson {
        return {
            width: this.width,
            height: this.height,
            image_path: this.image_path,
            sprites: this.sprites.map((v) => v.serialize())
        };
    }
}

export class AtlasResolution {
    sprites: Sprite[] = [];
    pages: AtlasPage[] = [];

    constructor(
        public index: number,
        public scale: number,
        public widthMax = 2048,
        public heightMax = 2048,
    ) {

    }

    serialize(): AtlasJson {
        return {
            pages: this.pages.map((v) => v.serialize()),
        };
    }
}

export class Atlas {
    resolutions: AtlasResolution[] = [];

    constructor(
        public name: string,
        scales: number[] = [1, 2, 3, 4]
    ) {
        for (let i = 0; i < scales.length; ++i) {
            this.resolutions.push(new AtlasResolution(i, scales[i]));
        }
    }

    dispose() {
        for (const res of this.resolutions) {
            for (const page of res.pages) {
                if (page.image !== undefined) {
                    page.image.dispose();
                    page.image = undefined;
                }
            }
        }
    }

    serialize() {

    }
}