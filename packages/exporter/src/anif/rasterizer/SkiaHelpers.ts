import CanvasKitInit, {CanvasKit as CanvasKitObject, SkImageInfo, SkSurface} from 'canvaskit-wasm';

export let CanvasKit: CanvasKitObject;
let lib: CanvasKitObject | undefined = undefined;

export async function initCanvasKit(): Promise<CanvasKitObject> {
    if (lib !== undefined) {
        return lib;
    }
    CanvasKit = lib = await CanvasKitInit();
    return lib;
}

export function makePMASurface(width: number, height: number) {
    const imageInfo: SkImageInfo = {
        width: width,
        height: height,
        colorType: CanvasKit.ColorType.RGBA_8888,
        alphaType: CanvasKit.AlphaType.Premul,
        colorSpace: CanvasKit.SkColorSpace.SRGB
    };
    const pixelLen = width * height * 4; // it's 8888, so 4 bytes per pixel
    // Allocate the buffer of pixels to be drawn into.
    const pixelPtr = CanvasKit._malloc(pixelLen);

    const surface = CanvasKit._getRasterDirectSurface(imageInfo, pixelPtr, width * 4);
    if (surface) {
        surface._canvas = null;
        surface._width = width;
        surface._height = height;
        surface._pixelLen = pixelLen;
        surface._pixelPtr = pixelPtr;
        // rasterDirectSurface does not initialize the pixels, so we clear them to transparent black.
        surface.getCanvas().clear(CanvasKit.TRANSPARENT);
    }
    return surface;
}

export function destroyPMASurface(pmaSurface: SkSurface) {
    pmaSurface.dispose();
    CanvasKit._free(pmaSurface._pixelPtr);
}