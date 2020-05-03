import {execute, make_dirs} from "../common/utility";
import path from "path";
import {spawnSync} from "child_process";
import pngquant from "pngquant-bin";
import console from "../common/log";
import * as glob from "glob";
import fs from 'fs';
import {createAtlas, exportAtlases, exportFlashAsset} from "@highduck/xfl";
import {BundleDef} from "./BundleDef";
import {BundleItem, BundleItemType} from "@highduck/anijson";

export function exportMarketingAssets(market_asset: string, target_type: string, output: string) {
    // const market_asset = "assets/res";
    // const target_type = "market";
    // const output = "output/res";
    make_dirs(output);
    console.error("TODO: ");
    //runExporter("export", "market", market_asset, target_type, output);
}

function copySound(input: string, output: string, compress: boolean) {
    try {
        make_dirs(path.dirname(output));
        if (compress) {
            execute("ffmpeg", ["-y", "-i", input, "-map_metadata", "-1", "-codec:a", "libmp3lame", "-q:a", "8", output]);
        } else {
            fs.copyFileSync(input, output);
        }
    } catch (e) {
        console.warn(e);
    }
}

export function pngQuant(input: string, output?: string) {
    if (!output) {
        output = input;
    }
    const result = spawnSync(pngquant, [
        "--strip",
        "--force",
        "-o", output,
        input
    ]);
    if (result.status === 0) {
        console.log('Image minified! ' + input);
    } else {
        console.warn(result.stderr.toString());
        console.warn(result.status);
    }
}

function pngQuantGlob(input_pattern: string) {
    const files = glob.sync(input_pattern);
    for (const file of files) {
        pngQuant(file, file);
    }
}

export async function exportAssets(input: string, output: string) {
    make_dirs(output);
    const bundle = JSON.parse(fs.readFileSync(path.join(input, "bundle.json"), 'utf8')) as BundleDef;

    const list: BundleItem[] = [];

    if (bundle.items === undefined) {
        console.warn('empty "items"');
        return;
    }

    for (const def of bundle.items) {
        if (def.type === 'atlas') {
            createAtlas(def.id);
            list.push({
                type: BundleItemType.Atlas,
                id: def.id
            });
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

    exportAtlases(output);

    for (const item of bundle.items) {
        if (item.type === 'atlas' && item.pngquant) {
            pngQuantGlob(path.join(output, item.id + "*.png"));
        }
    }

    fs.writeFileSync(path.join(output, 'bundle.json'), JSON.stringify({
        items: list
    }));
}
