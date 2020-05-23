import {Rect} from "@highduck/math";

export class EImage {

    // RGBA8888
    data: Uint8Array;
    pixels: Uint32Array;

    constructor(public width: number, public height: number, setData?: Uint8Array) {
        if (setData !== undefined) {
            this.data = setData;
        } else {
            this.data = new Uint8Array(width * height * 4);
        }
        this.pixels = new Uint32Array(this.data.buffer);
    }

    get empty(): boolean {
        return this.data.length === 0;
    }

    dispose() {
        this.width = 0;
        this.height = 0;
        this.data = new Uint8Array(0);
        this.pixels = new Uint32Array(0);
    }

    clear(pixelColor: number): this {
        for (let i = 0; i < this.pixels.length; ++i) {
            this.pixels[i] = pixelColor;
        }
        return this;
    }

    fillRect(x: number, y: number, w: number, h: number, pixelColor: number): this {
        if (x < 0 || y < 0 || (x + w) >= this.width || (y + h) >= this.height) {
            throw "out of bounds";
        }

        for (let cy = 0; cy < h; ++cy) {
            let i = x + (y + cy) * this.width;
            for (let cx = 0; cx < w; ++cx) {
                this.pixels[i++] = pixelColor;
            }
        }
        return this;
    }

    // search fully transparent border:  channel=  3, threshold= 0
    findTrimZone(channel: number, threshold: number, out: Rect): boolean {
        let t = 0;
        let b = 0;
        let l = 0;
        let r = 0;
        const data = this.data;
        const stride = this.width * 4;

        top: for (let cy = 0; cy < this.height; ++cy) {
            for (let i = cy * stride; i < (cy + 1) * stride; i += 4) {
                if (data[i + channel] > threshold) {
                    break top;
                }
            }
            ++t;
        }

        bottom: for (let cy = this.height - 1; cy >= t; --cy) {
            for (let i = cy * stride; i < (cy + 1) * stride; i += 4) {
                if (data[i + channel] > threshold) {
                    break bottom;
                }
            }
            ++b;
        }

        left: for (let cx = 0; cx < stride; cx += 4) {
            let i = t * stride + cx;
            const e = (this.height - b) * stride + cx;
            while (i < e) {
                if (data[i + channel] > threshold) {
                    break left;
                }
                i += stride;
            }
            ++l;
        }

        right: for (let cx = stride - 4; cx >= l * 4; cx -= 4) {
            let i = t * stride + cx;
            const e = (this.height - b) * stride + cx;
            while (i < e) {
                if (data[i + channel] > threshold) {
                    break right;
                }
                i += stride;
            }
            ++r;
        }

        if (l > 0 || t > 0 || r > 0 || b > 0) {
            out.x = l;
            out.y = t;
            out.width = this.width - r - l;
            out.height = this.height - b - t;
            return true;
        }
        return false;
    }

    crop(rc: Rect): EImage {
        if (rc.x < 0 || rc.y < 0 || rc.width > this.width || rc.height > this.height) {
            throw "out of bounds";
        }

        const result = new EImage(rc.width, rc.height);
        const src = this.pixels;
        const dest = result.pixels;
        let di = 0;
        for (let cy = 0; cy < rc.height; ++cy) {
            let si = (rc.y + cy) * this.width + rc.x;
            for (let cx = 0; cx < rc.width; ++cx) {
                dest[di++] = src[si++];
            }
        }

        return result;
    }

    copyPixels(x: number, y: number, src: EImage, srcRect: Rect) {
        const rcDst = new Rect(x, y, src.width, src.height);
        const rcSrc = new Rect().copyFrom(srcRect);
        clampRect(rcSrc, 0, 0, src.width, src.height);
        clampRect(rcDst, 0, 0, this.width, this.height);

        if (rcSrc.empty || rcDst.empty) {
            return;
        }

        const srcStride = src.width;
        const dstStride = this.width;
        const srcData = src.pixels;
        const dstData = this.pixels;
        for (let cy = 0; cy < rcSrc.height; ++cy) {
            let s = rcSrc.x + (rcSrc.y + cy) * srcStride;
            let d = rcDst.x + (rcDst.y + cy) * dstStride;
            for (let cx = 0; cx < rcSrc.width; ++cx) {
                dstData[d++] = srcData[s++];
            }
        }
    }

    /**
     * blit src image transformed by 90 degrees counter-clock-wise rotation
     *
     * x ________
     * | 1 2 3 4
     * | 1 2 3 4
     *
     * to
     *
     * x _____
     * | 4 4
     * | 3 3
     * | 2 2
     * | 1 1
     *
     * @param x
     * @param y
     * @param src
     * @param srcRect
     */

    copyPixels90CCW(x: number, y: number, src: EImage, srcRect: Rect) {
        const rcDst = new Rect(x, y, src.height, src.width);
        const rcSrc = new Rect().copyFrom(srcRect);
        clampRect(rcSrc, 0, 0, src.width, src.height);
        clampRect(rcDst, 0, 0, this.width, this.height);

        rcSrc.x = rcSrc.x + rcDst.x - x;
        rcSrc.y = rcSrc.y + rcDst.y - y;
        rcSrc.width = rcDst.height;
        rcSrc.height = rcDst.width;

        if (rcSrc.empty || rcDst.empty) {
            return;
        }

        const srcStride = src.width;
        const destStride = this.width;
        const srcData = src.pixels;
        const destData = this.pixels;
        for (let cy = 0; cy < rcSrc.height; ++cy) {
            for (let cx = 0; cx < rcSrc.width; ++cx) {
                const s = rcSrc.x + cx + (rcSrc.y + cy) * srcStride;
                const d = rcDst.x + cy + (rcDst.y + rcSrc.width - cx) * destStride;
                destData[d] = srcData[s];
            }
        }
    }
}

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