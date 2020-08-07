import {Engine} from "../Engine";
import {Atlas} from "../scene1/Atlas";
import {Ani, registerAniLibrary} from "../scene1/ani/Ani";
import {Font, FontResource} from "../rtfont/Font";
import {Bundle, BundleFontItem, BundleItem, BundleItemType} from "@highduck/anijson";
import {loadJSON, loadText} from "./loadURL";
import {JsonResource} from "../util/Resources";
import {Texture, TextureResource} from "../graphics/Texture";
import {destroyImage, loadImage} from "./loadImage";

async function loadTexture(id: string, path: string): Promise<Texture> {
    const texture = new Texture(Engine.current.graphics);
    TextureResource.reset(id, texture);
    texture.generateMipMaps = true;
    const image = await loadImage(path);
    texture.upload(image);
    destroyImage(image);
    return texture;
}

async function loadJsonFile(id: string, path: string): Promise<any> {
    const text = await loadText(path);
    let obj: any = undefined;
    try {
        obj = JSON.parse(text);
    } catch {
        console.error('Failed to parse JSON resource ' + id);
    }
    JsonResource.reset(id, obj);
    return obj;
}

async function loadItems(items: BundleItem[]) {
    const engine = Engine.current;
    const texturesScale = engine.view.contentScale;
    const loaders: Promise<any>[] = [];
    for (const item of items) {
        switch (item.type) {
            case BundleItemType.Atlas:
                loaders.push(Atlas.load(engine, item.id, texturesScale));
                break;
            case BundleItemType.Texture:
                if (item.path) {
                    loaders.push(loadTexture(item.id, engine.assetsPath + '/' + item.path));
                } else {
                    console.warn('bundle meta error: no path for texture');
                }
                break;
            case BundleItemType.Json:
                loaders.push(loadJsonFile(item.id, engine.assetsPath + '/' + item.path));
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
                            .load(engine, font.id, font.path, font.size !== undefined ? font.size : 16, texturesScale, font.style)
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
