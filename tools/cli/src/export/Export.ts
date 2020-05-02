import {execute, make_dirs} from "../common/utility";
import path from "path";
import {spawnSync} from "child_process";
import pngquant from "pngquant-bin";
import console from "../common/log";
import * as glob from "glob";
import fs from 'fs';
import {createAtlas, exportAtlases, exportFlashAsset} from "@highduck/xfl";
import {BundleDef} from "./Bundle";

export function exportMarketingAssets(market_asset: string, target_type: string, output: string) {
    // const market_asset = "assets/res";
    // const target_type = "market";
    // const output = "output/res";
    make_dirs(output);
    console.error("TODO");
    //runExporter("export", "market", market_asset, target_type, output);
}

function copySound(input: string, output: string) {
    try {
        make_dirs(path.dirname(output));
        execute("ffmpeg", ["-y", "-i", input, "-map_metadata", "-1", "-codec:a", "libmp3lame", "-q:a", "8", output]);
    } catch (e) {
        console.warn(e);
    }
}

export function prepare_sfx_files() {
    const files = glob.sync("assets/**/*.mp3");
    for (const file of files) {
        const output = file.replace("assets/", "public/assets/");
        try {
            console.log("input: " + file);
            console.log("output: " + output);
            make_dirs(path.dirname(output));
            execute("ffmpeg", ["-y", "-i", file, "-map_metadata", "-1", "-codec:a", "libmp3lame", "-q:a", "8", output]);
        } catch (e) {
            console.log(e);
        }
    }
}

export function optimize_png(input: string, output?: string) {
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
        optimize_png(file, file);
    }
}

export async function exportAssets(input: string, output: string) {
    make_dirs(output);
    const bundle = JSON.parse(fs.readFileSync(path.join(input, "bundle.json"), 'utf8')) as BundleDef;

    const list: any[] = [];

    if (bundle.assets === undefined) {
        console.warn('empty "assets"');
        return;
    }

    for (const def of bundle.assets) {
        if (def.type === 'atlas') {
            createAtlas(def.name);
            list.push({
                type: "atlas",
                name: def.name
            });
        }
    }

    for (const def of bundle.assets) {
        if (def.type === 'flash') {
            await exportFlashAsset(
                def.name,
                path.join(input, def.file ?? def.name),
                output,
                def.atlas ?? def.name
            );
            list.push({
                type: "ani",
                name: def.name
            });
        }
    }

    for (const def of bundle.assets) {
        if (def.type === 'font') {
            const filepath = def.path ?? (def.name + '.ttf');
            fs.copyFileSync(
                path.join(input, filepath),
                path.join(output, filepath)
            );
            list.push({
                type: "font",
                name: def.name,
                size: def.size ?? 30,
                path: filepath
            });
        }
    }

    for (const def of bundle.assets) {
        if (def.type === 'sound') {
            const files = glob.sync(path.join(input, def.glob));
            for (const file of files) {
                const rel = path.relative(input, file);
                copySound(file, path.join(output, rel));
                const pp = path.parse(rel);
                list.push({
                    type: "sound",
                    path: rel,
                    id: path.join(pp.dir, pp.name)
                });
            }
        }
    }

    exportAtlases(output);
    pngQuantGlob(path.join(output, "*.png"));

    fs.writeFileSync(path.join(output, 'assets.json'), JSON.stringify({
        assets: list
    }));
}
