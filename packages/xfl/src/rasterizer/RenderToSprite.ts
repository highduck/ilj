import {Sprite, SpriteImage} from "../spritepack/SpritePack";
import {RenderBatch} from "../render/RenderBatch";
import {Rect} from "@highduck/math";
import {FlashFile} from "../xfl/FlashFile";
import {Element} from "../xfl/types";
import {DomScanner} from "../render/DomScanner";
import {destroyPMASurface, getCanvasKit, makePMASurface} from "./CanvasKitHelpers";
import {CKRenderer, convertBlendMode} from "./CKRenderer";
import {SkSurface} from "canvaskit-wasm";
import {BlendMode} from "../xfl/dom";

export interface RenderOptions {
    scale?: number, //= 1
    width?: number, // = 0;
    height?: number, // = 0;
    alpha?: boolean, // = true;
    trim?: boolean,// = false;
}

// start from x8 super-sampling
function findMultiSampleScale(width: number, height: number, ss: number = 8): number {
    const LIMIT = 8000;
    while (ss > 1 && (width * ss > LIMIT || height * ss > LIMIT)) {
        ss /= 2;
    }
    return ss;
}

function blitDownSample(destSurface: SkSurface, srcSurface: SkSurface, x: number, y: number, upscale: number, blendMode: BlendMode) {
    const ck = getCanvasKit();
    const paint = new ck.SkPaint();
    paint.setAntiAlias(false);
    paint.setBlendMode(convertBlendMode(ck, blendMode));
    paint.setFilterQuality(ck.FilterQuality.High);
    const image = srcSurface.makeImageSnapshot();
    const canvas = destSurface.getCanvas();
    canvas.save();
    canvas.scale(1 / upscale, 1 / upscale);
    canvas.drawImage(image, 0, 0, paint);
    canvas.restore();
    paint.delete();
    image.delete();
}

export function renderBatch(bounds: Rect,
                            batches: RenderBatch[],
                            options: RenderOptions,
                            name: string): Sprite {

    const opts = {
        scale: options.scale ?? 1,
        width: options.width ?? 0,
        height: options.height ?? 0,
        alpha: options.alpha ?? true,
        trim: options.trim ?? false
    };

    const scale = opts.scale;
    const fixed = opts.width > 0 && opts.height > 0;

    const rc = new Rect();
    rc.copyFrom(bounds);
    if (!opts.trim) {
        rc.x -= 1;
        rc.y -= 1;
        rc.width += 2;
        rc.height += 2;
    }

    let img: undefined | SpriteImage = undefined;
    const w = fixed ? opts.width : Math.ceil(rc.width * scale);
    const h = fixed ? opts.height : Math.ceil(rc.height * scale);

    if (w > 0 && h > 0) {
        const upscale = findMultiSampleScale(w, h);
        const ssw = Math.trunc(w * upscale);
        const ssh = Math.trunc(h * upscale);

        const ck = getCanvasKit();

        const surface = makePMASurface(ck, ssw, ssh);
        const canvas = surface.getCanvas();

        // BEGIN
        const renderer = new CKRenderer(canvas, false);
        canvas.save();
        canvas.scale(scale * upscale, scale * upscale);
        if (!fixed) {
            canvas.translate(-rc.x, -rc.y);
        }

        for (const batch of batches) {
            renderer.set_transform(batch.transform);
            for (const cmd of batch.commands) {
                renderer.execute(cmd);
            }
        }

        surface.flush();
        canvas.restore();

        const imageSurface = ck.MakeSurface(w, h);
        blitDownSample(imageSurface, surface, ssw, ssh, upscale, BlendMode.normal);
        imageSurface.flush();

        renderer.dispose();

        destroyPMASurface(ck, surface);
        // END

        img = new SpriteImage(w, h);
        img.data = imageSurface.getCanvas().readPixels(
            0, 0, w, h,
            ck.AlphaType.Unpremul,
            ck.ColorType.RGBA_8888,
            4 * w
        ) as Uint8Array | undefined;

        if (img.data === undefined) {
            throw "Error canvas.readPixels ";
        }

        imageSurface.dispose();
    }

    const data = new Sprite();
    data.name = name;
    data.rc.copyFrom(rc);
    data.source.set(0, 0, w, h);
    data.image = img;
    return data;
}

export function renderElement(doc: FlashFile, el: Element, options: RenderOptions): Sprite {
    const scanner = new DomScanner(doc);
    scanner.scan(el);
    return renderBatch(
        scanner.output.bounds.getResultRect(),
        scanner.output.batches,
        options,
        el.item.name
    );
}