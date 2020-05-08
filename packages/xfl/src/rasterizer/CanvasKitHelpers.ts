import CanvasKitInit from 'canvaskit-wasm/bin/canvaskit.js';
import {CanvasKit, SkSurface} from 'canvaskit-wasm';

let LIB: CanvasKit | undefined = undefined;

export async function loadCanvasContext(): Promise<CanvasKit> {
    if (LIB !== undefined) {
        return LIB;
    }
    LIB = await CanvasKitInit().ready();
    // if (LIB === undefined) {
    //     throw "error init canvaskit-wasm";
    // }
    return LIB;
}

export function getCanvasKit(): CanvasKit {
    if (LIB === undefined) {
        throw "init canvaskit first";
    }
    return LIB;
}

export function makePMASurface(ck: CanvasKit, width: number, height: number) {
    const imageInfo = {
        width: width,
        height: height,
        colorType: ck.ColorType.RGBA_8888,
        // Since we are sending these pixels directly into the HTML canvas,
        // (and those pixels are un-premultiplied, i.e. straight r,g,b,a)
        alphaType: ck.AlphaType.Premul,
    }
    const pixelLen = width * height * 4; // it's 8888, so 4 bytes per pixel
    // Allocate the buffer of pixels to be drawn into.
    const pixelPtr = (ck as any)._malloc(pixelLen);

    const surface = (ck as any)._getRasterDirectSurface(imageInfo, pixelPtr, width * 4);
    if (surface) {
        surface._canvas = null;
        surface._width = width;
        surface._height = height;
        surface._pixelLen = pixelLen;
        surface._pixelPtr = pixelPtr;
        // rasterDirectSurface does not initialize the pixels, so we clear them
        // to transparent black.
        surface.getCanvas().clear(ck.TRANSPARENT);
    }
    return surface;
}

export function destroyPMASurface(ck: CanvasKit, pmaSurface: SkSurface) {
    pmaSurface.dispose();
    (ck as any)._free((pmaSurface as any)._pixelPtr);
}