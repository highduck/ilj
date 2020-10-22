import {CanvasKit, destroyPMASurface, initCanvasKit, makePMASurface} from "../anif/rasterizer/SkiaHelpers";
import {readFileSync} from "fs";
import fastpng from 'fast-png';
import {SkImage, SkSurface} from "canvaskit-wasm";
import assert from "assert";
import {savePNG} from "./save";

export class ImageInstance {
    constructor(readonly data: Uint8Array, readonly width: number, readonly height: number) {
    }

    save(dest: string) {
        savePNG(dest, {
            data: this.data,
            width: this.width,
            height: this.height
        }, true);
    }
}

export class ImageRenderer {
    image: SkImage;

    constructor(filepath: string) {
        // use CanvasKit for decoding, fastpng can't decode some big images
        const buffer = new Uint8Array(readFileSync(filepath));
        this.image = CanvasKit.MakeImageFromEncoded(buffer)!;
    }

    resize(width: number, height: number) {
        assert(Number.isInteger(width) &&
            Number.isInteger(height) &&
            width > 0 &&
            height > 0);

        const w = Math.min(width, this.image.width());
        const h = Math.min(height, this.image.height());

        const surface = makePMASurface(w, h);
        const canvas = surface.getCanvas();

        // BEGIN
        const scale = Math.min(w / this.image.width(), h / this.image.height());
        canvas.scale(scale, scale);

        const paint = new CanvasKit.SkPaint();
        paint.setBlendMode(CanvasKit.BlendMode.SrcOver);
        paint.setAntiAlias(false);
        paint.setFilterQuality(CanvasKit.FilterQuality.High);
        canvas.drawImage(this.image, 0, 0, paint);
        surface.flush();

        const data = canvas.readPixels(
            0, 0, w, h,
            CanvasKit.AlphaType.Unpremul,
            CanvasKit.ColorType.RGBA_8888,
            CanvasKit.SkColorSpace.SRGB,
            4 * w
        );

        if (!data) {
            throw new Error(`error render image to resolution: ${w}x${h}`);
        }

        paint.delete();
        destroyPMASurface(surface);

        return new ImageInstance(data, w, h);
    }

    dispose() {
        // destroyPMASurface(this.surface);
        this.image.delete();
    }
}