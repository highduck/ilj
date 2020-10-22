import {CanvasKit, SkImageInfo, SkSurface} from "./canvaskit";

export interface UnsafeCanvasKit extends CanvasKit {
    _free(ptr: number): void;

    _malloc(bytes: number): number;

    _getRasterDirectSurface(imageInfo: SkImageInfo, pixelPtr: number, stride: number): SkSurface;
}
