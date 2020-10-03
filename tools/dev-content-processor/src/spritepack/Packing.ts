import {AtlasPage} from "./EAtlas";
import {OutputRect, pack} from "@highduck/binpack";
import {SpriteFlag} from "@highduck/anijson";
import {EImage} from "./EImage";
import {ESprite} from "./ESprite";

function debugSpritesLayout(image: EImage, rects: OutputRect[]) {
    for (const rc of rects) {
        if (rc.rotated) {
            image.fillRect(rc.x, rc.y, rc.h, rc.w, 0x77777777);
        } else {
            image.fillRect(rc.x, rc.y, rc.w, rc.h, 0x77770077);
        }
    }
}

export function packSprites(sprites: ESprite[], maxWidth: number, maxHeight: number): AtlasPage[] {
    const result = pack(sprites.map((sprite) => {
        return {
            w: sprite.source.width,
            h: sprite.source.height,
            padding: sprite.padding,
            data: sprite
        };
    }), {maxWidth, maxHeight});

    const pages: AtlasPage[] = [];
    for (const packedPage of result.pages) {
        const page = new AtlasPage(packedPage.w, packedPage.h);
        for (const rect of packedPage.rects) {
            const sprite = rect.data as ESprite;
            if (sprite.image === undefined) {
                continue;
            }
            if (rect.rotated) {
                sprite.enable(SpriteFlag.Rotated);
            }
            if (sprite.isRotated) {
                page.image.copyPixels90CCW(rect.x, rect.y, sprite.image, sprite.source);
            } else {
                page.image.copyPixels(rect.x, rect.y, sprite.image, sprite.source);
            }

            // savePNG("_dump/packing/" + sprite.name + "_" + sprite.scale + ".png", sprite.image);
            sprite.image.dispose();
            sprite.image = page.image;
            sprite.source.set(rect.x, rect.y, rect.w, rect.h);
            sprite.updateTexCoords(page.width, page.height);

            if (sprite.name === '__spot__') {
                page.spot = sprite;
            } else {
                page.sprites.push(sprite);
            }
        }
        pages.push(page);
    }
    return pages;
}