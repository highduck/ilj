import {Rect} from "@highduck/math";
import {SpriteImage} from "./SpritePack";

function clampRect(rc: Rect, l: number, t: number, r: number, b: number) {
    if (rc.x < l) {
        rc.width -= l - rc.x;
        rc.x = l;
    }
    if (rc.y < t) {
        rc.height -= t - rc.y;
        rc.y = t;
    }
    if (rc.right > r) {
        rc.width -= rc.right - r;
    }
    if (rc.bottom > b) {
        rc.height -= rc.bottom - b;
    }
}


export function fillPixels(image: SpriteImage, x: number, y: number, w: number, h: number, color: number) {
    if (!image.data) {
        return;
    }

    const buf = new Uint32Array(image.data.buffer);
    for (let cy = 0; cy < h; ++cy) {
        for (let cx = 0; cx < w; ++cx) {
            const s = cx + x + (y + cy) * image.width;
            buf[s] = color;
        }
    }
}

export function copyPixelsNormal(dest: SpriteImage, destX: number, destY: number, src: SpriteImage, srcRect: Rect) {
    const dest_rc = new Rect(destX, destY, src.width, src.height);
    const src_rc = new Rect().copyFrom(srcRect);
    clampRect(src_rc, 0, 0, src.width, src.height);
    clampRect(dest_rc, 0, 0, dest.width, dest.height);
    // clip_rects(src.bounds<int>(), dest.bounds<int>(),
    //     src_rc, dest_rc);
    //
    if (!src.data || !dest.data || src_rc.empty || dest_rc.empty) {
        return;
    }

    const srcStride = src.width;
    const destStride = dest.width;
    const srcData = new Uint32Array(src.data.buffer);
    const destData = new Uint32Array(dest.data.buffer);
    for (let y = 0; y < src_rc.height; ++y) {
        for (let x = 0; x < src_rc.width; ++x) {
            const s = src_rc.x + x + (src_rc.y + y) * srcStride;
            const d = dest_rc.x + x + (dest_rc.y + y) * destStride;
            destData[d] = srcData[s];
        }
    }
}

/// 1 2 3 4
/// 1 2 3 4

//  4 4
//  3 3
//  2 2
//  1 1


export function copyPixels90CCW(dest: SpriteImage, destX: number, destY: number, src: SpriteImage, srcRect: Rect) {
    const dest_rc = new Rect(destX, destY, src.height, src.width);
    const src_rc = new Rect().copyFrom(srcRect);
    clampRect(src_rc, 0, 0, src.width, src.height);
    clampRect(dest_rc, 0, 0, dest.width, dest.height);

    src_rc.x = src_rc.x + dest_rc.x - destX;
    src_rc.y = src_rc.y + dest_rc.y - destY;
    src_rc.width = dest_rc.height;
    src_rc.height = dest_rc.width;

//     rect_i src_rc = clamp_bounds(src.bounds<int>(), src_rect);
//     rect_i dest_rc = clamp_bounds(dest.bounds<int>(), {dest_position, {src_rc.height, src_rc.width}});
//     src_rc = {
//         src_rc.position + dest_rc.position - dest_position,
//     {dest_rc.height, dest_rc.width}
// };

    if (!src.data || !dest.data || src_rc.empty || dest_rc.empty) {
        return;
    }

    const srcStride = src.width;
    const destStride = dest.width;
    const srcData = new Uint32Array(src.data.buffer);
    const destData = new Uint32Array(dest.data.buffer);

    for (let y = 0; y < src_rc.height; ++y) {
        for (let x = 0; x < src_rc.width; ++x) {
            const s = src_rc.x + x + (src_rc.y + y) * srcStride;
            const d = dest_rc.x + y + (dest_rc.y + src_rc.width - x) * destStride;
            destData[d] = srcData[s];
        }
    }
}