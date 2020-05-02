import {loadFlashArchive} from "./xfl/loadFlashArchive";
import {FlashFile} from './xfl/FlashFile';
import {FlashDocExporter} from "./exporter/FlashDocExporter";
import {Atlas} from "./spritepack/SpritePack";
import {loadCanvasContext} from "./rasterizer/CanvasKitHelpers";
import fs from "fs";
import path from "path";
import {encode} from 'fast-png';
import {pack} from "./spritepack/Packing";

export * from './xfl/FlashFile';

function isDir(p: string) {
    return fs.existsSync(p) && fs.lstatSync(p).isDirectory();
}

function makeDirs(p: string) {
    if (!isDir(p)) {
        fs.mkdirSync(p, {recursive: true});
    }
}

function saveDebugImages(destDir: string, atlas: Atlas) {
    for (const res of atlas.resolutions) {
        const output = path.join(destDir, atlas.name, `images@${res.scale}x`);
        for (const spr of res.sprites) {
            if (spr.image !== undefined && spr.image.data !== undefined) {
                console.log(spr.name + " " + spr.image.width + " " + spr.image.height);
                const dest = path.join(output, spr.name + ".png");
                makeDirs(path.dirname(dest));
                const png = encode({
                    width: spr.image.width,
                    height: spr.image.height,
                    data: spr.image.data,
                    depth: 8,
                    channels: 4
                });
                fs.writeFileSync(dest, png);
            }
        }
    }
}

function getAtlasPageSuffix(scale: number, pageIndex = 0): string {
    let suffix = "";
    if (pageIndex !== 0) {
        suffix += "_" + (pageIndex + 1);
    }
    if (scale > 1) {
        suffix += "@" + scale + "x";
    }
    return suffix;
}

function saveAtlas(destDir: string, atlas: Atlas) {
    makeDirs(destDir);
    for (const res of atlas.resolutions) {
        const jsonName = atlas.name + getAtlasPageSuffix(res.scale) + ".atlas.json";
        for (let i = 0; i < res.pages.length; ++i) {
            const page = res.pages[i];
            const postfix = getAtlasPageSuffix(res.scale, i);
            page.image_path = `${atlas.name}${postfix}.png`;
            if (page.image !== undefined && page.image.data !== undefined) {
                console.info(`save atlas page: ${page.image_path}`);
                const png = encode({
                    width: page.image.width,
                    height: page.image.height,
                    data: page.image.data,
                    depth: 8,
                    channels: 4
                });
                fs.writeFileSync(path.join(destDir, page.image_path), png);
            }
        }
        fs.writeFileSync(path.join(destDir, jsonName), JSON.stringify(res.serialize()));
    }
}

const atlases = new Map<string, Atlas>();

export function createAtlas(name: string) {
    atlases.set(name, new Atlas(name));
}

export function exportAtlases(destDir: string) {
    for (const atlas of atlases.values()) {
        for (const res of atlas.resolutions) {
            console.info(`pack ${atlas.name} @${res.scale}x`);
            res.pages = pack(res.sprites, res.widthMax, res.heightMax);
        }

        saveAtlas(destDir, atlas);
    }
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
