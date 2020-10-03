import {makeDirs} from "../env";
import path from "path";
import fs from 'fs';
import {EAtlas} from "../spritepack/EAtlas";
import {AnimateDoc} from "@highduck/xfl";
import {initCanvasKit} from "../anif/rasterizer/SkiaHelpers";
import {AnimateDocExporter} from "../anif/AnimateDocExporter";

const atlases = new Map<string, EAtlas>();

export function createAtlas(name: string): EAtlas {
    const atlas = new EAtlas(name);
    atlases.set(name, atlas);
    return atlas;
}

export async function exportFlashAsset(name: string, filepath: string, destDir: string, atlas: string, sourceScale:number) {
    // TODO: sourceScale ... it's hard to do :)
    const doc = AnimateDoc.openFromPath(filepath);
    await initCanvasKit();
    const exporter = new AnimateDocExporter(doc);
    exporter.buildLibrary();

    let atlasInstance = atlases.get(atlas);
    if (atlasInstance === undefined) {
        atlasInstance = new EAtlas(name);
        atlases.set(name, atlasInstance);
    }

    exporter.buildSprites(atlasInstance);
    makeDirs(destDir);

    // saveDebugImages(destDir, mainAtlas);

    // save test scene
    fs.writeFileSync(
        path.join(destDir, name + '.ani.json'),
        JSON.stringify(exporter.exportLibrary().serialize())
    );
}

function exportMarketingAssets(market_asset: string, target_type: string, output: string) {
    // const market_asset = "assets/res";
    // const target_type = "market";
    // const output = "output/res";
    makeDirs(output);
    console.error("TODO: ");
    //runExporter("export", "market", market_asset, target_type, output);
}
