import {Engine} from "../Engine";
import {BoundsBuilder, Recta} from "@highduck/math";
import {TextFormat} from "../scene1/TextFormat";
import {loadFontFace} from "./loadFontFace";
import {FontAtlas, FontStyleDef} from "./FontAtlas";
import {ResourceType} from "../util/Resources";

const LF = '\n'.charCodeAt(0) | 0;
const BOUNDS_BUILDER_TMP = new BoundsBuilder();
const BOUNDS_RC_TMP = new Recta();
// const PT_2_PX = 1.33333333;
const PT_2_PX = 1.0;

export class Font {

    static async load(family: string, url: string, size: number, scale: number, style?: FontStyleDef): Promise<Font> {
        try {
            await loadFontFace(family, url, {});
        } catch {
            console.warn(`Font ${family} load error`);
        }
        const atlas = new FontAtlas(family, size, scale, style ?? {});
        return new Font(atlas);
    }

    constructor(readonly atlas: FontAtlas) {
    }

    draw(text: string, size: number, x: number, y: number, lineHeight: number, lineSpacing: number) {
        const sc = (size * PT_2_PX) / this.atlas.size;

        const startX = x;
        const startY = y;

        let cx = x;
        let cy = y + 4;

        const drawer = Engine.current.drawer;

        if (this.atlas.texture === null) {
            return;
        }

        drawer.state.setTexture(this.atlas.texture);
        drawer.prepare();

        for (let i = 0; i < text.length; ++i) {
            const code = text.charCodeAt(i) | 0;
            if (code === LF) {
                cx = startX;
                cy += lineHeight + lineSpacing;
                continue;
            }

            const gdata = this.atlas.getCharacter(code);
            if (gdata.du > 0) {
                drawer.state.uv.set(gdata.u, gdata.v, gdata.du, gdata.dv);
                drawer.triangles(4, 6);
                const l = cx + sc * gdata.x;
                const t = cy + sc * gdata.y;
                drawer.writeQuad_opt(l, t, l + sc * gdata.w, t + sc * gdata.h);
                drawer.writeQuadIndices_default();
            }
            cx += sc * gdata.a; // advance
        }
    }

    getTextSegmentWidth(text: string, size: number, begin: number, end: number): number {
        return 0;
    }

    getLineBoundingBox(text: string, size: number,
                       begin: number, end: number,
                       lineHeight: number, lineSpacing: number,
                       out: Recta) {

        const sc = (size * PT_2_PX) / this.atlas.size;
        const boundsBuilder = BOUNDS_BUILDER_TMP.reset();
        let x = 0;
        let y = 0;
        if (end < 0) {
            end = text.length;
        }
        for (let i = begin; i < end; ++i) {
            const code = text.charCodeAt(i) | 0;
            if (code === LF) {
                x = 0;
                y += lineHeight + lineSpacing;
            }
            const gdata = this.atlas.getCharacter(code);
            boundsBuilder.addBounds(
                x + sc * gdata.x,
                y + sc * gdata.y,
                x + sc * (gdata.x + gdata.w),
                y + sc * (gdata.y + gdata.h)
            );
            x += sc * gdata.a;
        }
        boundsBuilder.getResultRect(out);
    }

    estimateTextDrawZone(text: string, size: number,
                         begin: number, end: number,
                         lineHeight: number, lineSpacing: number,
                         out: Recta): Recta {

        const sc = (size * PT_2_PX) / this.atlas.size;
        const boundsBuilder = BOUNDS_BUILDER_TMP.reset();
        let cx = 0;
        let cy = 0;
        if (end < 0) {
            end = text.length;
        }
        for (let i = begin; i < end; ++i) {
            const code = text.charCodeAt(i) | 0;
            if (code === LF) {
                cx = 0;
                cy += lineHeight + lineSpacing;
                continue;
            }

            const gdata = this.atlas.getCharacter(code);
            const w = sc * gdata.a; //.advance_width
            boundsBuilder.addRect(cx, cy, w, size);
            cx += w;
        }
        return boundsBuilder.getResultRect(out);
    }

    textBounds(text: string, format: TextFormat, rc: Recta, out: Recta) {
        const begin = 0;
        const end = text.length;

        this.getLineBoundingBox(text, format.size, begin, end,
            format.lineHeight, format.lineSpacing, out);

        const cx = rc.x + rc.width * format.alignment.x;
        const cy = rc.y + rc.height * format.alignment.y;
        out.x += cx;
        out.y += cy;

        const lineSizeX = out.width;
        const lineSizeY = format.size;
        // out.y += lineSizeY;
        out.x -= lineSizeX * format.alignment.x;
        out.y -= lineSizeY * format.alignment.y;
    }

    drawText(text: string, format: TextFormat, rc: Recta) {
        const begin = 0;
        const end = text.length;
        const drawZone: Recta = this.estimateTextDrawZone(
            text, format.size,
            begin, end,
            format.lineHeight,
            format.lineSpacing,
            BOUNDS_RC_TMP
        );
        const rcRelX = rc.x + rc.width * format.alignment.x;
        const rcRelY = rc.y + rc.height * format.alignment.y;
        const drawZoneX = drawZone.x + drawZone.width * format.alignment.x;
        const drawZoneY = drawZone.y + drawZone.height * format.alignment.y;
        const cx = rcRelX - drawZoneX;
        const cy = rcRelY - drawZoneY;

        const drawerState = Engine.current.drawer.state;
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

export const FontResource = new ResourceType(Font);