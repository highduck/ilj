import {AnimateDoc} from "@highduck/xfl";
import {AnimateDocExporter} from "./anif/AnimateDocExporter";
import {EAtlas} from "./spritepack/EAtlas";
import {loadCanvasContext} from "./anif/rasterizer/SkiaHelpers";
import fs from "fs";
import path from "path";
import {makeDirs} from "./utilsNode";

export * from './spritepack/EAtlas';
export * from './imagefile/optimize';

const atlases = new Map<string, EAtlas>();

export function createAtlas(name: string): EAtlas {
    const atlas = new EAtlas(name);
    atlases.set(name, atlas);
    return atlas;
}

export function getAtlasList(): string[] {
    return [...atlases.keys()];
}

export async function exportFlashAsset(name: string, filepath: string, destDir: string, atlas: string) {
    const doc = AnimateDoc.openFromPath(filepath);
    await loadCanvasContext();
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