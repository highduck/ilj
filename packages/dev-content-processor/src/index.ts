import {makeDirs} from "./nodejs/utils";
import fs from "fs";
import path from "path";
import {BundleDef} from "./export/BundleDef";
import {BundleItem, BundleItemType} from "@highduck/anijson";
import {EAtlas} from "./spritepack/EAtlas";
import glob from "glob";
import {copySound} from "./sounds/copySound";
import {createAtlas, exportFlashAsset} from "./export/Export";

export * from './imagefile/optimize';

export async function exportAssets(input: string, output: string) {
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
                def.atlas ?? def.id
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
            fs.copyFileSync(
                path.join(input, filepath),
                path.join(output, filepath)
            );
            list.push({
                type: BundleItemType.Font,
                id: item.id,
                size: item.size ?? 30,
                path: filepath
            });
        }
    }

    for (const item of bundle.items) {
        if (item.type === 'audio') {
            const compress = item.compress ?? false;
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
        atlas.trimSprites();
        atlas.addSpot();
        atlas.pack();
        atlas.save(output, meta.format ?? 'png', meta.jpeg?.quality ?? 80, meta.png?.quant ?? false);
        atlas.dispose();
        list.push({
            type: BundleItemType.Atlas,
            id: meta.id
        });
    }

    fs.writeFileSync(path.join(output, 'bundle.json'), JSON.stringify({
        items: list
    }));
}
