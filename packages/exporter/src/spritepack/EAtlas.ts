import {AtlasJson, AtlasPageJson} from "@highduck/anijson";
import {packSprites} from "./Packing";
import {makeDirs} from "../utilsNode";
import path from "path";
import fs from "fs";
import {logDebug} from "../debug";
import {EImage} from "./EImage";
import {ESprite} from "./ESprite";
import {saveAlphaMaskPNG, saveJPEG, savePNG} from "../imagefile/save";

export class AtlasPage {
    sprites: ESprite[] = [];
    pathImage: string = "";
    pathMask: undefined | string = undefined;
    spot: undefined | ESprite = undefined;
    image: EImage;

    constructor(public width: number, public height: number) {
        this.image = new EImage(width, height);
    }

    serialize(): AtlasPageJson {
        const result: AtlasPageJson = {
            width: this.width,
            height: this.height,
            img: this.pathImage,
            mask: this.pathMask,
            sprites: {}
        };
        for (const sprite of this.sprites) {
            result.sprites[sprite.name] = sprite.serialize();
        }
        if (this.spot !== undefined) {
            const uv = this.spot.uv;
            result.spot = [uv.x, uv.y, uv.width, uv.height];
        }
        return result;
    }
}

export class AtlasResolution {
    sprites: ESprite[] = [];
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

export class EAtlas {
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
                page.image.dispose();
            }
            res.pages = [];
        }
    }

    pack() {
        for (const res of this.resolutions) {
            logDebug(`pack ${this.name} @${res.scale}x`);
            res.pages = packSprites(res.sprites, res.widthMax, res.heightMax);
        }
    }

    trimSprites() {
        for (const res of this.resolutions) {
            for (const spr of res.sprites) {
                if (spr.trim) {
                    spr.trimImage();
                }
            }
        }
    }

    addSpot() {
        for (const res of this.resolutions) {
            const spot = ESprite.createSolid(4, 4, 0xFFFFFFFF);
            spot.name = '__spot__';
            res.sprites.push(spot);
        }
    }

    save(destDir: string, format: string, quality?: number, quant?: boolean) {
        makeDirs(destDir);
        quality = quality ?? 90;
        quant = quant ?? false;
        for (const res of this.resolutions) {
            for (let i = 0; i < res.pages.length; ++i) {
                const page = res.pages[i];
                const postfix = getAtlasPageSuffix(res.scale, i);
                page.pathImage = this.name + postfix;
                if (format === 'png') {
                    page.pathImage += '.png';
                    logDebug(`save atlas page: ${page.pathImage}`);
                    savePNG(path.join(destDir, page.pathImage), page.image, quant);
                } else if (format === 'jpeg') {
                    page.pathMask = page.pathImage + '_.png';
                    page.pathImage += '.jpg';
                    logDebug(`save atlas page: ${page.pathImage}`);
                    saveJPEG(path.join(destDir, page.pathImage), page.image, quality);
                    saveAlphaMaskPNG(path.join(destDir, page.pathMask), page.image);
                }
            }

            const jsonName = this.name + getAtlasPageSuffix(res.scale) + ".atlas.json";
            fs.writeFileSync(path.join(destDir, jsonName), JSON.stringify(res.serialize()));
        }
    }

    saveDebugImages(destDir: string) {
        for (const res of this.resolutions) {
            const output = path.join(destDir, this.name, `images@${res.scale}x`);
            for (const spr of res.sprites) {
                if (spr.image !== undefined) {
                    savePNG(path.join(output, spr.name + ".png"), spr.image);
                }
            }
        }
    }
}