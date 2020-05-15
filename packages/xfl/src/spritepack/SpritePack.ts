import {Rect} from "@highduck/math";
import {AtlasJson, AtlasPageJson, SpriteFlag, SpriteJson} from "@highduck/anijson";
import {pack} from "./Packing";
import {makeDirs, saveJPEG, savePNG} from "../utilsNode";
import path from "path";
import fs from "fs";
import {logDebug} from "../debug";

export class SpriteImage {

    width: number;
    height: number;
    data: Uint8Array | undefined = undefined;

    constructor(w: number, h: number) {
        this.width = w;
        this.height = h;
    }

    dispose() {
        this.width = 0;
        this.height = 0;
        this.data = undefined;
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
        return [
            this.rc.x, this.rc.y, this.rc.width, this.rc.height,
            this.uv.x, this.uv.y, this.uv.width, this.uv.height,
            this.flags
        ];
    }
}

export class AtlasPage {
    width = 0;
    height = 0;
    sprites: Sprite[] = [];
    pathImage: string = "";
    pathMask: undefined | string = undefined;
    image: undefined | SpriteImage = undefined;

    serialize(): AtlasPageJson {
        const result:AtlasPageJson = {
            width: this.width,
            height: this.height,
            img: this.pathImage,
            mask: this.pathMask,
            sprites: {}
        };
        for (const sprite of this.sprites) {
            result.sprites[sprite.name] = sprite.serialize();
        }
        return result;
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

function getAtlasPageSuffix(scale: number, pageIndex = 0): string {
    let suffix = "";
    if (pageIndex !== 0) {
        suffix += "_" + (pageIndex + 1);
    }
    if (scale > 1) {
        suffix += "@" + scale + "x";
    }
    return suffix;
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
            res.pages = [];
        }
    }

    pack() {
        for (const res of this.resolutions) {
            logDebug(`pack ${this.name} @${res.scale}x`);
            res.pages = pack(res.sprites, res.widthMax, res.heightMax);
        }
    }

    save(destDir: string, format: string, quality: number = 90) {
        makeDirs(destDir);
        for (const res of this.resolutions) {
            for (let i = 0; i < res.pages.length; ++i) {
                const page = res.pages[i];
                const postfix = getAtlasPageSuffix(res.scale, i);
                page.pathImage = this.name + postfix;
                if (format === 'png') {
                    page.pathImage += '.png';
                    logDebug(`save atlas page: ${page.pathImage}`);
                    savePNG(path.join(destDir, page.pathImage), page.image);
                } else if (format === 'jpeg') {
                    page.pathMask = page.pathImage + '_.png';
                    page.pathImage += '.jpg';
                    logDebug(`save atlas page: ${page.pathImage}`);
                    saveJPEG(path.join(destDir, page.pathImage), page.image, quality);
                }
            }

            const jsonName = this.name + getAtlasPageSuffix(res.scale) + ".atlas.json";
            fs.writeFileSync(path.join(destDir, jsonName), JSON.stringify(res.serialize()));
        }
    }
}