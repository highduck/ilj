import fs from "fs";
import {SpriteImage} from "./spritepack/SpritePack";
import path from "path";
import {encode} from 'fast-png';
import {Bitmap} from "./xfl/types";
import jpeg from 'jpeg-js';
import {logDebug, logWarning} from "./debug";

export function isDir(p: string) {
    return fs.existsSync(p) && fs.lstatSync(p).isDirectory();
}

export function makeDirs(p: string) {
    if (!isDir(p)) {
        fs.mkdirSync(p, {recursive: true});
    }
}

export function savePNG(filepath: string, image?: SpriteImage | Bitmap) {
    if (image === undefined || image.data === undefined || image.width <= 0 || image.height <= 0) {
        logWarning('image has no data');
        return;
    }

    makeDirs(path.dirname(filepath));
    const result = encode({
        width: image.width,
        height: image.height,
        data: image.data,
        depth: 8,
        channels: 4
    });
    fs.writeFileSync(filepath, result);
}

export function saveJPEG(filepath: string, image?: SpriteImage | Bitmap, quality: number = 90) {
    if (image === undefined || image.data === undefined || image.width <= 0 || image.height <= 0) {
        logWarning('image has no data');
        return;
    }

    makeDirs(path.dirname(filepath));
    const result = jpeg.encode({
        width: image.width,
        height: image.height,
        data: image.data
    }, quality);
    fs.writeFileSync(filepath, result.data);

    const saveAlphaMask = true;
    if (saveAlphaMask) {
        const pixcount = image.data.length >>> 2;
        const alphaMask = new Uint8Array(pixcount);
        for (let i = 0; i < pixcount; ++i) {
            alphaMask[i] = image.data[(i << 2) + 3];
        }

        const alphaMaskData = encode({
            width: image.width,
            height: image.height,
            data: alphaMask,
            depth: 8,
            channels: 1
        });
        const alphaMaskPath = filepath.replace('.jpg', '_.png');
        logDebug('save alpha mask: ' + alphaMaskPath)
        fs.writeFileSync(alphaMaskPath, alphaMaskData);
    }
}