export * from './imagefile/optimize';
export * from './imagefile/resize';
export * from './anif/rasterizer/SkiaHelpers';

import {makeDirs} from "./nodejs/utils";
import fs, {mkdirSync} from "fs";
import path from "path";
import {BundleDef} from "./export/BundleDef";
import {BundleItem, BundleItemType} from "@highduck/anijson";
import {EAtlas} from "./spritepack/EAtlas";
import glob from "glob";
import {copySound} from "./sounds/copySound";
import {createAtlas, exportFlashAsset} from "./export/Export";
import {checkBuildInfo, saveBuildInfo} from "./nodejs/buildinfo";

export async function importAssets(input: string, output: string, production = false) {
    const diff = await checkBuildInfo(input, output, production);
    if (!diff.changed) {
        return;
    }

    makeDirs(output);
    const bundle = JSON.parse(fs.readFileSync(path.join(input, "bundle.json"), 'utf8')) as BundleDef;

    const list: BundleItem[] = [];
    const atlases: EAtlas[] = [];
    const atlasMetas = [];

    if (bundle.items === undefined) {
        console.warn('empty "items"');
        return;
    }

    for (const def of bundle.items) {
        if (def.type === 'atlas') {
            atlases.push(createAtlas(def.id));
            atlasMetas.push(def);
            // will add item at the end
        }
    }

    for (const def of bundle.items) {
        if (def.type === 'flash') {
            await exportFlashAsset(
                def.id,
                path.join(input, def.path ?? def.id),
                output,
                def.atlas ?? def.id,
                def.sourceScale ?? 1.0
            );
            list.push({
                type: BundleItemType.Ani,
                id: def.id
            });
        }
    }

    for (const item of bundle.items) {
        if (item.type === 'font') {
            const filepath = item.path ?? (item.id + '.ttf');
            const destPath = path.join(output, filepath);
            mkdirSync(path.dirname(destPath), {recursive: true});
            fs.copyFileSync(
                path.join(input, filepath),
                destPath
            );
            list.push({
                type: BundleItemType.Font,
                id: item.id,
                size: item.size ?? 30,
                path: filepath,
                style: {
                    strokeWidth: item.style?.strokeWidth ?? 0,
                    strokeColor: item.style?.strokeColor
                }
            });
        } else if (item.type === 'texture') {
            const filepath = item.path;
            const destPath = path.join(output, filepath);
            mkdirSync(path.dirname(destPath), {recursive: true});
            fs.copyFileSync(
                path.join(input, filepath),
                destPath
            );
            list.push({
                type: BundleItemType.Texture,
                id: item.id,
                path: filepath,
            });
        } else if (item.type === 'json') {
            const filepath = item.path ?? (item.id + '.json');
            const destPath = path.join(output, filepath);
            mkdirSync(path.dirname(destPath), {recursive: true});
            fs.copyFileSync(
                path.join(input, filepath),
                destPath
            );
            if (!item.excludeFromBundle) {
                list.push({
                    type: BundleItemType.Json,
                    id: item.id,
                    path: filepath,
                });
            }
        }
    }

    for (const item of bundle.items) {
        if (item.type === 'audio') {
            const compress = production && (item.compress ?? false);
            const files = glob.sync(path.join(input, item.glob));
            for (const file of files) {
                const rel = path.relative(input, file);
                copySound(file, path.join(output, rel), compress);
                const pp = path.parse(rel);
                list.push({
                    type: BundleItemType.Audio,
                    path: rel,
                    id: path.join(pp.dir, pp.name)
                });
            }
        }
    }

    for (let i = 0; i < atlasMetas.length; ++i) {
        const meta = atlasMetas[i];
        const atlas = atlases[i];

        const quant = production && (meta.png?.quant ?? false);

        atlas.trimSprites();
        atlas.addSpot();
        atlas.pack();
        atlas.save(output, meta.format ?? 'png', meta.alpha ?? true, meta.jpeg?.quality ?? 80, quant);
        atlas.dispose();
        list.push({
            type: BundleItemType.Atlas,
            id: meta.id
        });
    }

    fs.writeFileSync(path.join(output, 'bundle.json'), JSON.stringify({items: list}));

    saveBuildInfo(diff, output);
}

