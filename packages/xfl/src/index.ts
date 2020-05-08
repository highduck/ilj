import {loadFlashArchive} from "./xfl/loadFlashArchive";
import {FlashFile} from './xfl/FlashFile';
import {FlashDocExporter} from "./exporter/FlashDocExporter";
import {Atlas} from "./spritepack/SpritePack";
import {loadCanvasContext} from "./rasterizer/CanvasKitHelpers";
import fs from "fs";
import path from "path";
import {makeDirs, savePNG} from "./utilsNode";

export * from './xfl/FlashFile';

function saveDebugImages(destDir: string, atlas: Atlas) {
    for (const res of atlas.resolutions) {
        const output = path.join(destDir, atlas.name, `images@${res.scale}x`);
        for (const spr of res.sprites) {
            if (spr.image !== undefined && spr.image.data !== undefined) {
                savePNG(path.join(output, spr.name + ".png"), spr.image);
            }
        }
    }
}

const atlases = new Map<string, Atlas>();

export function createAtlas(name: string): Atlas {
    const atlas = new Atlas(name);
    atlases.set(name, atlas);
    return atlas;
}

export function getAtlasList(): string[] {
    return [...atlases.keys()];
}

export async function exportFlashAsset(name: string, filepath: string, destDir: string, atlas: string) {
    const archive = loadFlashArchive(filepath);
    if (archive === undefined) {
        console.error('cant open flash asset: ' + filepath);
        return;
    }

    await loadCanvasContext();

    const ff = new FlashFile(archive);
    const fe = new FlashDocExporter(ff);
    fe.buildLibrary();

    let atlasInstance = atlases.get(atlas);
    if (atlasInstance === undefined) {
        atlasInstance = new Atlas(name);
        atlases.set(name, atlasInstance);
    }

    fe.buildSprites(atlasInstance);
    makeDirs(destDir);

    // saveDebugImages(destDir, mainAtlas);

    // save test scene
    fs.writeFileSync(
        path.join(destDir, name + '.ani.json'),
        JSON.stringify(fe.exportLibrary().serialize())
    );
}
