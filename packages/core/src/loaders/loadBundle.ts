import {Engine} from "../Engine";
import {Ani, Atlas, Font, FontResource, loadJSON, registerAniLibrary} from "..";
import {Bundle, BundleFontItem, BundleItem, BundleItemType} from "@highduck/anijson";

async function loadItems(items: BundleItem[]) {
    const engine = Engine.current;
    const texturesScale = engine.view.contentScale;
    const loaders: Promise<any>[] = [];
    for (const item of items) {
        switch (item.type) {
            case BundleItemType.Atlas:
                if (item.id) {
                    loaders.push(Atlas.load(engine, item.id, texturesScale));
                }
                break;
            case BundleItemType.Ani:
                if (item.id) {
                    loaders.push(
                        Ani.load(item.id).then((a: Ani) => {
                            registerAniLibrary(item.id, a);
                        })
                    );
                }
                break;
            case BundleItemType.Font: {
                const font = item as BundleFontItem;
                if (font.id && font.path) {
                    loaders.push(
                        Font
                            .load(engine, font.id, font.path, font.size !== undefined ? font.size : 16, texturesScale)
                            .then((res: Font) => {
                                FontResource.reset(font.id, res);
                            })
                    );
                }
            }
                break;
            case BundleItemType.Audio:
                if (item.id) {
                    engine.audio.preload(item.id);
                }
                break;
        }
    }
    return Promise.all(loaders);
}

export async function loadBundle() {
    const bundle = await loadJSON(Engine.current.assetsPath + "/bundle.json") as Bundle;
    if (bundle.items) {
        let lazyItems: BundleItem[] = [];
        let normalItems: BundleItem[] = [];
        for (const item of bundle.items) {
            const lazy = item.lazy !== undefined ? item.lazy : (item.type === BundleItemType.Audio);
            if (lazy) {
                lazyItems.push(item);
            } else {
                normalItems.push(item);
            }
        }
        await loadItems(normalItems);
        loadItems(lazyItems).then();
    }
}
