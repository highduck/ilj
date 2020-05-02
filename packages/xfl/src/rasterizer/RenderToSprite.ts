import {Sprite, SpriteImage} from "../spritepack/SpritePack";
import {RenderBatch} from "../render/RenderBatch";
import {Rect, Vec2} from "@highduck/math";
import {FlashFile} from "../xfl/FlashFile";
import {Element} from "../xfl/types";
import {DomScanner} from "../render/DomScanner";
import {getCanvasKit, makePMASurface} from "./CanvasKitHelpers";
import {CKRenderer, convertBlendMode} from "./CKRenderer";
import {SkCanvas, SkSurface} from "canvaskit-wasm";
import {BlendMode} from "../xfl/dom";

export interface RenderOptions {
    scale?: number, //= 1
    width?: number, // = 0;
    height?: number, // = 0;
    alpha?: boolean, // = true;
    trim?: boolean,// = false;
}

function blit_downsample(canvas: SkCanvas, sub_surf: SkSurface, x: number, y: number, upscale: number, blendMode: BlendMode) {
    const ck = getCanvasKit();
    const paint = new ck.SkPaint();
    paint.setAntiAlias(false);
    paint.setBlendMode(convertBlendMode(ck, blendMode));
    paint.setFilterQuality(ck.FilterQuality.High);
    const image = sub_surf.makeImageSnapshot();
    canvas.save();
    canvas.scale(1 / upscale, 1 / upscale);
    canvas.drawImage(image, 0, 0, paint);
    canvas.restore();
//     auto* pattern = cairo_pattern_create_for_surface(source);
//     cairo_pattern_set_filter(pattern, CAIRO_FILTER_BEST);
//     cairo_save(ctx);
//     cairo_identity_matrix(ctx);
//     const double downscale = 1.0 / upscale;
//     cairo_scale(ctx, downscale, downscale);
//     cairo_set_source(ctx, pattern);
// //    cairo_set_source_surface(ctx, source, 0, 0);
//     cairo_rectangle(ctx, 0, 0, w, h);
//     cairo_fill(ctx);
//     cairo_restore(ctx);
//     cairo_pattern_destroy(pattern);

    paint.delete();
    image.delete();
}

export function renderBatch(bounds: Rect,
                            batches: RenderBatch[],
                            options: RenderOptions,
                            name: string): Sprite {
    // x4 super-sampling
    const upscale = 4;

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
        img = new SpriteImage(w, h);

        const ck = getCanvasKit();

        const surf = ck.MakeSurface(w, h);
//         const surf = cairo_image_surface_create_for_data(img->data(),
//             CAIRO_FORMAT_ARGB32,
//             w, h, stride);
//         auto cr = cairo_create(surf);
        const canvas = surf.getCanvas();
        //canvas.clear(ck.RED);
//         cairo_set_antialias(cr, CAIRO_ANTIALIAS_BEST);
//         cairo_set_source_surface(cr, surf, 0, 0);

        const up_scaled_size = new Vec2(
            Math.trunc(w * upscale),
            Math.trunc(h * upscale)
        );

        const sub_surf = makePMASurface(ck, up_scaled_size.x, up_scaled_size.y);
        const sub_canvas = sub_surf.getCanvas();


        // BEGIN
        const renderer = new CKRenderer(canvas, true);
        const sub_renderer = new CKRenderer(sub_canvas, false);

        for (const batch of batches) {
            renderer.set_transform(batch.transform);

            canvas.save();
            sub_canvas.save();
            canvas.scale(scale, scale);
            sub_canvas.scale(scale * upscale, scale * upscale);
            if (!fixed) {
                canvas.translate(-rc.x, -rc.y);
                sub_canvas.translate(-rc.x, -rc.y);
            }

            if (batch.bitmap) {
                renderer.draw_bitmap(batch.bitmap);
                canvas.flush();
            }

            // for (const cmd of batch.commands) {
            //     renderer.execute(cmd);
            // }

            sub_canvas.clear(ck.TRANSPARENT);
            sub_renderer.set_transform(batch.transform);
            for (const cmd of batch.commands) {
                sub_renderer.execute(cmd);
            }
            sub_surf.flush();

            canvas.restore();
            sub_canvas.restore();

            blit_downsample(canvas, sub_surf, up_scaled_size.x, up_scaled_size.y, upscale, batch.transform.blendMode);
            surf.flush();
        }

        sub_renderer.dispose();
        renderer.dispose();
        // END

        sub_surf.delete();

        img.data = canvas.readPixels(
            0, 0, w, h,
            ck.AlphaType.Unpremul,
            ck.ColorType.RGBA_8888,
            4 * w
        ) as Uint8Array | undefined;

        if (img.data === undefined) {
            throw "Error canvas.readPixels ";
        }

        surf.delete();
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