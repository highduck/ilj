import {execute, make_dirs} from "../common/utility";
import path from "path";
import {spawnSync} from "child_process";
import pngquant from "pngquant-bin";
import console from "../common/log";
import * as glob from "glob";
import fs from 'fs';
import {createAtlas, exportAtlases, exportFlashAsset} from "@highduck/xfl";

interface BundleDeclaration {
    name: string,
    atlas?: AtlasDeclaration[],
    flash?: FlashDeclaration[],
}

interface AtlasDeclaration {
    name: string
}

interface FlashDeclaration {
    name: string,
    file?: string,
    atlas?: string
}

export function exportMarketingAssets(market_asset: string, target_type: string, output: string) {
    // const market_asset = "assets/res";
    // const target_type = "market";
    // const output = "output/res";
    make_dirs(output);
    console.error("TODO");
    //runExporter("export", "market", market_asset, target_type, output);
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

function optimize_png_glob(input_pattern: string) {
    const files = glob.sync(input_pattern);
    for (const file of files) {
        optimize_png(file, file);
    }
}

export async function exportAssets(input: string, output: string) {
    make_dirs(output);
    const bundleDecl = JSON.parse(fs.readFileSync(path.join(input, "bundle.json"), 'utf8')) as BundleDeclaration;
    if (bundleDecl.atlas) {
        for (const atlas of bundleDecl.atlas) {
            createAtlas(atlas.name);
        }
    }
    if (bundleDecl.flash) {
        for (const flash of bundleDecl.flash) {
            await exportFlashAsset(
                flash.name,
                path.join(input, flash.file ?? flash.name),
                output,
                flash.atlas ?? flash.name
            );
        }
    }
    exportAtlases(output);
    // runExporter("export", "assets", input, output);
    optimize_png_glob(path.join(output, "*.png"));
}
