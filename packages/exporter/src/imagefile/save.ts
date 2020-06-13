import path from "path";
import fs from "fs";
import jpeg from "jpeg-js";
import {makeDirs} from "../env";
import {optimizeImageFile} from "./optimize";
import fastpng from 'fast-png';

type ImageData = {
    width: number,
    height: number,
    data: Uint8Array
};

export function savePNG(filepath: string, image: ImageData, quantization: boolean = false) {
    makeDirs(path.dirname(filepath));
    const result = fastpng.encode({
        width: image.width,
        height: image.height,
        data: image.data,
        depth: 8,
        channels: 4
    });
    fs.writeFileSync(filepath, result);
    if (quantization) {
        optimizeImageFile(filepath);
    }
}

export function saveAlphaMaskPNG(filepath: string, image: ImageData) {
    const data = image.data;
    const pixelsCount = data.length >>> 2;
    const alphaMask = new Uint8Array(pixelsCount);
    {
        let alphaChannelPtr = 3;
        for (let i = 0; i < pixelsCount; ++i) {
            alphaMask[i] = data[alphaChannelPtr];
            alphaChannelPtr += 4;
        }
    }

    const alphaMaskData = fastpng.encode({
        width: image.width,
        height: image.height,
        data: alphaMask,
        depth: 8,
        channels: 1
    });
    fs.writeFileSync(filepath, alphaMaskData);
    optimizeImageFile(filepath);
}

export function saveAlphaMaskJPEG(filepath: string, image: ImageData, quality: number) {
    const data = image.data;
    const alphaMask = new Uint8Array(data.length);
    for (let i = 0; i < alphaMask.length; i += 4) {
        const a = data[i + 3];
        alphaMask[i] = a;
        alphaMask[i + 1] = a;
        alphaMask[i + 2] = a;
        alphaMask[i + 3] = 255;
    }

    const alphaMaskData = jpeg.encode({
        width: image.width,
        height: image.height,
        data: alphaMask
    }, quality);
    fs.writeFileSync(filepath, alphaMaskData.data);
    optimizeImageFile(filepath, true);
}

export function saveJPEG(filepath: string, image: ImageData, quality: number = 90) {
    makeDirs(path.dirname(filepath));
    const result = jpeg.encode({
        width: image.width,
        height: image.height,
        data: image.data
    }, quality);
    fs.writeFileSync(filepath, result.data);
    optimizeImageFile(filepath);
}