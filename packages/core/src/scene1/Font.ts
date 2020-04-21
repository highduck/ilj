import {Engine} from "../Engine";
import {BoundsBuilder, Rect} from "@highduck/math";
import {Sprite, SpriteFlag} from "./Sprite";
import {loadJSON} from "../util/load";
import {TextFormat} from "./TextFormat";
import {declTypeID} from "../util/TypeID";
import {AssetRef, Resources} from "../util/Resources";

const LF = '\n'.charCodeAt(0);

interface GlyphJson {
    codes: number[]; /* u32 */
    box: [number, number, number, number]; /* s16 */
    advance_width: number; /* int */
    sprite: string | null;
}

interface FontJson {
    units_per_em: number; /* u16 */
    glyphs: GlyphJson[];
    sizes: number[]; /* u16[] */
}

const BOUNDS_BUILDER_TMP = new BoundsBuilder();

type GlyphData = {
    json: GlyphJson,
    lod: AssetRef<Sprite>[];
};

export class Font {

    static TYPE_ID = declTypeID();

    static async load(engine: Engine, url: string): Promise<Font> {
        const json = await loadJSON(engine.assetsPath + "/" + url + ".font.json");
        return new Font(engine, json as FontJson);
    }

    bitmapSizeTable: number[]; /* u16[] */
    map = new Map<number, GlyphData>();
    unitsPerEM: number;

    debugMaxSize = 0;

    constructor(private engine: Engine, data: FontJson) {
        this.unitsPerEM = data.units_per_em;
        this.bitmapSizeTable = data.sizes;
        for (const g of data.glyphs) {
            if (g.sprite) {
                for (const code of g.codes) {
                    this.map.set(code, {
                        json: g,
                        lod: data.sizes.map(
                            (bitmapFontSize: number) => Resources.get(Sprite, g.sprite + "_" + bitmapFontSize)
                        )
                    });
                }
            }
        }
    }

    draw(text: string, size: number, x: number, y: number, lineHeight: number, lineSpacing: number) {
        const sc = size / this.unitsPerEM;
        const startX = x;
        const startY = y;

        let cx = x;
        let cy = y;

        // if(size > this.debugMaxSize) {
        //     console.assert(false, "fontsize: " + size);
        //     this.debugMaxSize = size;
        // }

        const drawer = this.engine.drawer;
        // var vertexColor = drawer.calcVertexColorMultiplier(color);

        let bitmapSizeIndex = this.bitmapSizeTable.length - 1;
        while (bitmapSizeIndex > 0) {
            if (size <= this.bitmapSizeTable[bitmapSizeIndex - 1]) {
                --bitmapSizeIndex;
            } else {
                break;
            }
        }

        const bitmapFontSize = this.bitmapSizeTable[bitmapSizeIndex];
        const bitmapScale = size / bitmapFontSize;

        for (let i = 0; i < text.length; ++i) {
            const code = text.charCodeAt(i);
            if (code == LF) {
                cx = startX;
                cy += lineHeight + lineSpacing;
                continue;
            }

            const gdata = this.map.get(code);
            if (gdata === undefined) {
                continue;
            }

            const spr = gdata.lod[bitmapSizeIndex].data;
            if (spr !== undefined && spr.texture.data !== undefined) {
                drawer.state.setTextureRegion(spr.texture.data, spr.tex);
                drawer.quadFast(bitmapScale * spr.rect.x + cx,
                    bitmapScale * spr.rect.y + cy,
                    bitmapScale * spr.rect.width,
                    bitmapScale * spr.rect.height,
                    (spr.flags & SpriteFlag.Rotated) === 0);

                // SPRITE:
                // x = 0
                // y = -10
                // w = 10
                // h = 10

                // CBOX:
                // 0 x-min = 0
                // 1 y-min = 0
                // 2 x-max = 625 * 32p / 1000em = 20
                // 3 y-max = 625 * 32p / 1000em = 20

                // x = 0, w = 20
                // y = -h = -20, h = 20

            }

            cx += sc * gdata.json.advance_width;
        }
    }

    getTextSegmentWidth(text: string, size: number, begin: number, end: number): number {
        return 0;
    }

    getLineBoundingBox(text: string, size: number,
                       begin: number, end: number,
                       lineHeight: number, lineSpacing: number,
                       out?: Rect): Rect {

        const sc = size / this.unitsPerEM;
        const boundsBuilder = BOUNDS_BUILDER_TMP.reset();
        let x = 0;
        let y = 0;
        if (end < 0) {
            end = text.length;
        }
        for (let i = begin; i < end; ++i) {
            const code = text.charCodeAt(i);
            if (code == LF) {
                x = 0;
                y += lineHeight + lineSpacing;
            }
            const gdata = this.map.get(code);
            if (gdata === undefined) {
                continue;
            }

            const g = gdata.json;
            // C-BOX:
            // 0 x-min = 0
            // 1 y-min = 0
            // 2 x-max = 625 * 32p / 1000em = 20
            // 3 y-max = 625 * 32p / 1000em = 20

            // x = 0, w = 20
            // y = -h = -20, h = 20

            boundsBuilder.addBounds(
                x + g.box[0] * sc, y - g.box[3] * sc,
                x + g.box[2] * sc, y - g.box[1] * sc,
            );
            x += g.advance_width * sc;
        }
        return boundsBuilder.getResultRect(out);
    }

    estimateTextDrawZone(text: string, size: number,
                         begin: number, end: number,
                         lineHeight: number, lineSpacing: number,
                         out?: Rect): Rect {

        const sc = size / this.unitsPerEM;
        const boundsBuilder = BOUNDS_BUILDER_TMP.reset();
        let cx = 0;
        let cy = 0;
        if (end < 0) {
            end = text.length;
        }
        for (let i = begin; i < end; ++i) {
            const code = text.charCodeAt(i);
            if (code == LF) {
                cx = 0;
                cy += lineHeight + lineSpacing;
                continue;
            }

            const gdata = this.map.get(code);
            if (gdata === undefined) {
                continue;
            }

            const w = gdata.json.advance_width * sc;
            boundsBuilder.addRect(cx, cy - size, w, size);
            cx += w;
        }
        return boundsBuilder.getResultRect(out);
    }

    textBounds(text: string, format: TextFormat, rc: Rect, out?: Rect): Rect {
        const begin = 0;
        const end = text.length;

        out = this.getLineBoundingBox(
            text, format.size, begin, end,
            format.lineHeight, format.lineSpacing,
            out);

        const cx = rc.x + rc.width * format.alignment.x;
        const cy = rc.y + rc.height * format.alignment.y;
        out.x += cx;
        out.y += cy;

        const lineSizeX = out.width;
        const lineSizeY = format.size;
        out.y += lineSizeY;
        out.x -= lineSizeX * format.alignment.x;
        out.y -= lineSizeY * format.alignment.y;

        return out;
    }

    drawText(text: string, format: TextFormat, rc: Rect) {
        const begin = 0;
        const end = text.length;
        const drawZone: Rect = this.estimateTextDrawZone(
            text, format.size,
            begin, end,
            format.lineHeight,
            format.lineSpacing
        );
        const rcRelX = rc.x + rc.width * format.alignment.x;
        const rcRelY = rc.y + rc.height * format.alignment.y;
        const drawZoneX = drawZone.x + drawZone.width * format.alignment.x;
        const drawZoneY = drawZone.y + drawZone.height * format.alignment.y;
        const cx = rcRelX - drawZoneX;
        const cy = rcRelY - drawZoneY;

        const drawerState = this.engine.drawer.state;
        if (format.shadow) {
            drawerState.saveColor().multiplyColor32(format.shadowColor);
            this.draw(text,
                format.size,
                cx + format.shadowOffset.x,
                cy + format.shadowOffset.y,
                format.lineHeight,
                format.lineSpacing);
            drawerState.restoreColor();
        }
        drawerState.saveColor().multiplyColor32(format.color);
        this.draw(text, format.size, cx, cy, format.lineHeight, format.lineSpacing);
        drawerState.restoreColor();
    }
}
