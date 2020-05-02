import {loadFlashArchive} from "./xfl/loadFlashArchive";
import {FlashFile} from './xfl/FlashFile';
import {FlashDocExporter} from "./exporter/FlashDocExporter";
import {Atlas, SpriteImage} from "./spritepack/SpritePack";
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

function savePNG(filepath: string, image?: SpriteImage) {
    if (image === undefined || image.data === undefined) {
        console.warn('image has no data');
        return;
    }

    makeDirs(path.dirname(filepath));
    const png = encode({
        width: image.width,
        height: image.height,
        data: image.data,
        depth: 8,
        channels: 4
    });
    fs.writeFileSync(filepath, png);
}

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
            console.info(`save atlas page: ${page.image_path}`);
            savePNG(path.join(destDir, page.image_path), page.image);
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
