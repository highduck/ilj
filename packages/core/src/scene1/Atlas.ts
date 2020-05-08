import {Engine} from "../Engine";
import {Texture} from "../graphics/Texture";
import {Disposable} from "../util/Disposable";
import {AssetRef, Resources} from "../util/Resources";
import {Sprite} from "./Sprite";
import {loadJSON} from "../util/load";
import {declTypeID} from "../util/TypeID";
import {Vec2} from "@highduck/math";
import {AtlasJson, SpriteFlag} from "@highduck/anijson";
import {destroyCanvas, destroyImage, loadImage, loadSplitAlpha} from "../util/loadImage";

function pathDir(path: string): string {
    const i = path.lastIndexOf("/");
    if (i >= 0) {
        return path.substring(0, i);
    }
    return "";
}

function pathJoin(path1: string, path2: string): string {
    if (path1.length == 0) {
        return path2;
    }

    if (path2.length == 0) {
        return path1;
    }

    const sep = "/";
    if (path1[path1.length - 1] != sep) {
        return path1 + sep + path2;
    }
    return path1 + path2;
}

const kSuffixes = ["", "@2x", "@3x", "@4x"];

function getScaleSuffix(scale: number): string {
    if (scale > 3) {
        return kSuffixes[3];
    } else if (scale > 2) {
        return kSuffixes[2];
    } else if (scale > 1) {
        return kSuffixes[1];
    }
    return kSuffixes[0];
}

export class Atlas implements Disposable {
    static TYPE_ID = declTypeID();

    static async load(engine: Engine, path: string, scale: number): Promise<Atlas | undefined> {
        const uid = path;
        const scaleSuffix = getScaleSuffix(scale);
        const basePath = engine.assetsPath + "/" + pathDir(uid);
        const fileMeta = engine.assetsPath + "/" + uid + scaleSuffix + ".atlas.json";

        const meta = await loadJSON(fileMeta);
        const atlas = new Atlas();
        await atlas.setMeta(engine, basePath, meta as AtlasJson);
        return atlas;
    }

    readonly sprites = new Map<string, AssetRef<Sprite>>();
    readonly pages: AssetRef<Texture>[] = [];

    dispose() {
        for (const page of this.pages) {
            page.reset();
        }

        for (const sprite of this.sprites.values()) {
            sprite.reset();
        }
    }

    private async setMeta(engine: Engine, basePath: string, meta: AtlasJson) {
        console.debug("Decoding Atlas META");
        console.debug("Atlas Base Path: ", basePath);

        for (const page of meta.pages) {
            const textureAsset = Resources.get(Texture, page.img);
            this.pages.push(textureAsset);
            for (const id of Object.keys(page.sprites)) {
                const data = page.sprites[id];
                const sprite = new Sprite(textureAsset, data[8] as SpriteFlag);
                sprite.rect.readFromArray(data, 0);
                sprite.tex.readFromArray(data, 4);

                const assetSprite = Resources.get(Sprite, id);
                assetSprite.reset(sprite);
                this.sprites.set(id, assetSprite);
            }
        }

        for (const page of meta.pages) {
            const texture = new Texture(engine.graphics);
            texture.generateMipMaps = page.mipmap ?? true;
            if (page.mask === undefined) {
                const atlasPagePath = pathJoin(basePath, page.img);
                console.debug("Load atlas page ", atlasPagePath);
                const image = await loadImage(atlasPagePath);
                texture.upload(image);
                destroyImage(image);
            } else {
                const atlasPagePath = pathJoin(basePath, page.img);
                const maskPagePath = pathJoin(basePath, page.mask);
                console.debug("Load atlas page with alpha mask ", atlasPagePath, maskPagePath);
                const canvas = await loadSplitAlpha(atlasPagePath, maskPagePath);
                texture.upload(canvas);
                destroyCanvas(canvas);
            }
            // await texture.loadBasis(atlasPagePath.replace('.png', '.basis'));
            Resources.reset(Texture, page.img, texture);

            const white: Sprite | undefined = this.sprites.get('old/rect')?.get();
            if (white !== undefined && white.texture.data === texture) {
                texture.whitePoint = new Vec2(white.tex.centerX, white.tex.centerY);
            }
        }
    }
}
