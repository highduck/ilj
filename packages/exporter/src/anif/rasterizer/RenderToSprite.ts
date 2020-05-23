import {RenderBatch} from "../render/RenderBatch";
import {Rect} from "@highduck/math";
import {BlendMode} from "@highduck/xfl";
import {destroyPMASurface, getCanvasKit, makePMASurface} from "./SkiaHelpers";
import {SkiaRenderer} from "./SkiaRenderer";
import {blitDownSample} from "./SkiaFunctions";
import {RenderOp} from "../render/RenderOp";
import {ShapeProcessor} from "../render/ShapeProcessor";
import {EImage} from "../../spritepack/EImage";
import {ESprite} from "../../spritepack/ESprite";

export interface RenderOptions {
    name: string,
    scale?: number, //= 1
    width?: number, // = 0;
    height?: number, // = 0;
    alpha?: boolean, // = true;
    trim?: boolean,// = false;
}

function createSprite(name: string, scale: number, rc: Rect, image: EImage) {
    const data = new ESprite();
    data.scale = scale;
    data.padding = Math.max(1, scale);
    data.name = name;
    data.rc.copyFrom(rc);
    data.source.width = image.width;
    data.source.height = image.height;
    data.image = image;
    return data;
}

// start from x8 super-sampling
function findMultiSampleScale(width: number, height: number, ss: number = 8): number {
    const LIMIT = 8000;
    while (ss > 1 && (width * ss > LIMIT || height * ss > LIMIT)) {
        ss /= 2;
    }
    return ss;
}

function renderGeneralBatches(bounds: Rect,
                              batches: RenderBatch[],
                              options: RenderOptions): ESprite | undefined {

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

    const w = fixed ? opts.width : Math.ceil(rc.width * scale);
    const h = fixed ? opts.height : Math.ceil(rc.height * scale);

    if (w <= 0 || h <= 0) {
        return undefined;
    }
    const upscale = findMultiSampleScale(w, h);
    const ssw = Math.trunc(w * upscale);
    const ssh = Math.trunc(h * upscale);

    const ck = getCanvasKit();

    const surface = makePMASurface(ck, ssw, ssh);
    const canvas = surface.getCanvas();

    // BEGIN
    const renderer = new SkiaRenderer(canvas, false);
    canvas.save();
    canvas.scale(scale * upscale, scale * upscale);
    if (!fixed) {
        canvas.translate(-rc.x, -rc.y);
    }

    for (const batch of batches) {
        renderer.setTransform(batch.transform);
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

    const data = imageSurface.getCanvas().readPixels(
        0, 0, w, h,
        ck.AlphaType.Unpremul,
        ck.ColorType.RGBA_8888,
        4 * w
    ) as Uint8Array | undefined;

    imageSurface.dispose();

    if (data !== undefined) {
        return createSprite(options.name, scale, rc, new EImage(w, h, data));
    } else {
        throw "Error canvas.readPixels ";
    }
}

function renderLowQuality(bounds: Rect,
                          batches: RenderBatch[],
                          options: RenderOptions): ESprite | undefined {

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

    const w = fixed ? opts.width : Math.ceil(rc.width * scale);
    const h = fixed ? opts.height : Math.ceil(rc.height * scale);

    if (w <= 0 || h <= 0) {
        return undefined;
    }
    const ck = getCanvasKit();

    const surface = makePMASurface(ck, w, h);
    const canvas = surface.getCanvas();

    // BEGIN
    const renderer = new SkiaRenderer(canvas, true);
    canvas.save();
    canvas.scale(scale, scale);
    if (!fixed) {
        canvas.translate(-rc.x, -rc.y);
    }

    for (const batch of batches) {
        renderer.setTransform(batch.transform);
        for (const cmd of batch.commands) {
            renderer.execute(cmd);
        }
    }

    surface.flush();
    canvas.restore();

    const data = canvas.readPixels(
        0, 0, w, h,
        ck.AlphaType.Unpremul,
        ck.ColorType.RGBA_8888,
        4 * w
    ) as Uint8Array | undefined;

    renderer.dispose();

    destroyPMASurface(ck, surface);

    if (data !== undefined) {
        return createSprite(options.name, scale, rc, new EImage(w, h, data));
    } else {
        throw "Error canvas.readPixels ";
    }
}

export function renderShapes(shapes: ShapeProcessor, options: RenderOptions): ESprite | undefined {
    const bounds = shapes.bounds.getResultRect();
    if (shapes.batches.length === 1) {
        const batch = shapes.batches[0];
        if (batch.commands.length === 1 && batch.commands[0].op === RenderOp.bitmap) {
            return renderLowQuality(
                bounds,
                shapes.batches,
                options
            );
        }
    }
    return renderGeneralBatches(
        bounds,
        shapes.batches,
        options
    );
}