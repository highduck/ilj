import {copyPixels90CCW, copyPixelsNormal, fillPixels} from "./CopyPixels";
import {AtlasPage, Sprite, SpriteImage} from "./SpritePack";
import {PackerState, packNodes} from "@highduck/binpack";
import {Rect, Vec2} from "@highduck/math";
import {SpriteFlag} from "@highduck/anijson";

type BPRect = { x: number, y: number, w: number, h: number };

function removePackedPadding(out: Rect, rect: BPRect, pad: number) {
    out.set(
        rect.x + pad,
        rect.y + pad,
        rect.w - 2 * pad,
        rect.h - 2 * pad
    );
}

function calculateUV(out: Rect, source: Rect, width: number, height: number, rotated: boolean) {
    const w = rotated ? source.height : source.width;
    const h = rotated ? source.width : source.height;
    out.set(source.x / width,
        source.y / height,
        w / width,
        h / height,
    );
}

function debugSpritesLayout(image: SpriteImage, packer: PackerState) {
    if (image.data === undefined) {
        return;
    }

    for (let i = 0; i < packer.rects.length; ++i) {
        const rc = packer.rects[i];
        if (packer.isPacked(i)) {
            const pd = (packer.userData[i] as Sprite).padding;
            if (packer.isRotated(i)) {
                fillPixels(image, rc.x + pd, rc.y + pd, rc.h - 2 * pd, rc.w - 2 * pd, 0x77777777);
            } else {
                fillPixels(image, rc.x + pd, rc.y + pd, rc.w - 2 * pd, rc.h - 2 * pd, 0x77770077);
            }
        }
    }
}

export function pack(sprites: Sprite[], maxWidth: number, maxHeight: number): AtlasPage[] {
    const pages: AtlasPage[] = [];

//    timer timer{};
//    EK_DEBUG("Packing %lu sprites...", sprites.size());

    let need_to_pack = true;
    while (need_to_pack) {
        const packer_state = new PackerState(maxWidth, maxHeight);

        for (const sprite of sprites) {
            if (!sprite.isPacked) {
                //if (sprite.image?.data !== undefined) {
                packer_state.add(
                    sprite.source.width,
                    sprite.source.height,
                    sprite.padding,
                    sprite
                );
                // } else {
                //     console.warn('sprite with bad image: ' + sprite.name);
                // }
            }
        }

        need_to_pack = !packer_state.empty;
        if (need_to_pack) {
            packNodes(packer_state);

            const page = new AtlasPage();
            page.width = packer_state.w;
            page.height = packer_state.h;
            page.image = new SpriteImage(page.width, page.height);
            page.image.data = new Uint8Array(page.width * page.height * 4);

            for (let i = 0; i < packer_state.rects.length; ++i) {
                if (packer_state.isPacked(i)) {

                    const sprite = packer_state.userData[i] as Sprite;
                    sprite.enable(SpriteFlag.Packed);
                    if (packer_state.isRotated(i)) {
                        sprite.enable(SpriteFlag.Rotated);
                    }

                    const packed_rect = new Rect();
                    removePackedPadding(packed_rect, packer_state.rects[i], sprite.padding);
                    if (sprite.isRotated) {
                        copyPixels90CCW(page.image, packed_rect.x, packed_rect.y, sprite.image!, sprite.source);
                    } else {
                        copyPixelsNormal(page.image, packed_rect.x, packed_rect.y, sprite.image!, sprite.source);
                    }
                    sprite.image?.dispose();
                    sprite.image = page.image;
                    sprite.source.copyFrom(packed_rect);
                    calculateUV(sprite.uv, packed_rect, page.width, page.height, sprite.isRotated);

                    page.sprites.push(sprite);
                }
            }


            pages.push(page);
        }
    }

//    LOG_PERF("Packed %lu to %lu pages for %lf ms",
//             sprites.size(),
//             pages.size(),
//             get_elapsed_time(timer));

    return pages;
}

//
// std::vector<sprite_t> unpack(const std::vector<atlas_page_t>& pages) {
//     std::vector<sprite_t> sprites;
//     for (auto& page : pages) {
//         for (auto& sprite : page.sprites) {
//             sprite_t spr = sprite;
//             spr.disable(sprite_flags_t::packed);
//             sprites.push_back(spr);
//         }
//     }
//     return sprites;
// }
//
// std::vector<atlas_page_t> repack(const std::vector<atlas_page_t>& pages, const int2 max_size) {
//     return pack(unpack(pages), max_size);
// }

// TODO: atlas
// ++page_index;
// page.image_path = atlas.name + get_atlas_suffix(atlas.scale, page_index) + ".png";
