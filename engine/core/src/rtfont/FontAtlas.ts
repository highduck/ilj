import {Engine} from "../Engine";
import {Texture} from "../graphics/Texture";
import {FontResource} from "./Font";

const SPACE_REGEX = /\s/gm;
const SPACE_CODE = ' '.charCodeAt(0);
const DEFAULT_CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890.,\'-\/';
const DEBUG_SHOW_CANVAS = false;
const DEBUG_SHOW_BOUNDS = false;

export interface CharacterData {
    // advance width
    a: number;
    // bounding rect
    x: number;
    y: number;
    w: number;
    h: number;
    // uv
    u: number;
    v: number;
    du: number;
    dv: number;
}

export function updateFonts() {
    const objects = FontResource.map.values;
    for (let i = 0; i < objects.length; ++i) {
        const font = objects[i].data;
        font !== null && font.atlas.dirty && font.atlas.updateTexture();
    }
}

export function resetFonts() {
    const objects = FontResource.map.values;
    for (let i = 0; i < objects.length; ++i) {
        const font = objects[i].data;
        font !== null && font.atlas.dirty && font.atlas.resetSheet('');
    }
}

const fallbackFonts = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif';
// "Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"

const CHAR_BOUNDING_BOX = {
    supported: 0,
    left: 0,
    right: 0,
    ascent: 0,
    descent: 0
};

export interface FontStyleDef {
    strokeWidth?: number;
    strokeColor?: { r: number, g: number, b: number, a: number };
}

export class FontAtlas {
    ctx: null | CanvasRenderingContext2D = null;
    texture: Texture | null = null;

    sheetWidth = 256;
    sheetHeight = 256;
    nextSheetX = 0;
    nextSheetY = 0;
    sheetLineHeight = 0;
    characters = '';

    border = Math.ceil(this.scale); // in pixels, resolution independent

    spaceWidth = 1.0;
    readonly characterMap = new Map<number, CharacterData>();
    lineSize = 1.3; // relative to EM units

    dirty = false;

    strokeWidth: number;
    strokeColor: string;

    constructor(readonly family: string,
                readonly size: number,
                readonly scale: number,
                readonly style: FontStyleDef) {

        this.strokeWidth = style.strokeWidth ?? 0;
        this.strokeColor = style.strokeColor ? `rgba(${style.strokeColor.r},${style.strokeColor.g},${style.strokeColor.b},${style.strokeColor.a})`
            : 'rgba(0,0,0,0.5)';

        this.resetSheet(DEFAULT_CHARACTERS);
    }

    private readMetrics(metrics: TextMetrics) {
        const bb = CHAR_BOUNDING_BOX;
        if (bb.supported === 0) {
            bb.supported = ('actualBoundingBoxLeft' in metrics
                && 'actualBoundingBoxRight' in metrics
                && 'actualBoundingBoxAscent' in metrics
                && 'actualBoundingBoxDescent' in metrics) ? 2 : 1;
        }
        if (bb.supported === 2) {
            bb.left = metrics.actualBoundingBoxLeft;
            bb.right = metrics.actualBoundingBoxRight;
            bb.ascent = metrics.actualBoundingBoxAscent;
            bb.descent = metrics.actualBoundingBoxDescent;
        } else {
            const size = this.size * this.scale;
            bb.left = 0;
            bb.right = metrics.width;
            bb.ascent = Math.ceil(0.3 * size);
            bb.descent = Math.ceil(size);
        }
        return bb;
    }

    private getOrCreateSheet() {
        if (this.ctx) {
            return this.ctx;
        }
        const canvas = document.createElement('canvas');

        if (DEBUG_SHOW_CANVAS) {
            document.body.append(canvas);
            canvas.style.position = 'absolute';
            canvas.style.left = '0';
            canvas.style.top = '0';
            canvas.style.opacity = '50%';
            canvas.style.pointerEvents = 'none';
            canvas.style.userSelect = 'none';
        }

        const ctx = canvas.getContext('2d')!;
        this.setupContext(ctx);
        this.spaceWidth = ctx.measureText(' ').width / this.scale;
        this.characterMap.set(SPACE_CODE, {
            a: this.spaceWidth,
            x: 0,
            y: 0,
            w: this.spaceWidth,
            h: this.size * this.lineSize,
            u: 0,
            v: 0,
            du: 0,
            dv: 0
        });
        this.ctx = ctx;
        return ctx;
    }

    deleteSheet() {
        if (this.ctx !== null) {
            this.ctx.canvas.width = 1;
            this.ctx.canvas.height = 1;
            this.ctx = null;
        }
    }

    biggerSheet() {
        if (this.sheetWidth <= this.sheetHeight) {
            this.sheetWidth *= 2;
        } else {
            this.sheetHeight *= 2;
        }
        this.setupContext(this.ctx!);
        this.resetSheet(this.characters);
    }

    resetSheet(characters: string) {
        if (this.ctx !== null) {
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        }

        const ctx = this.getOrCreateSheet();
        const canvas = ctx.canvas;
        if (DEBUG_SHOW_CANVAS) {
            ctx.fillStyle = 'rgba(0, 0, 0, 1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgb(255, 255, 255)';
            ctx.strokeStyle = 'rgb(0, 255, 0)';
        }
        this.nextSheetX = 0;
        this.nextSheetY = 0;
        this.characterMap.clear();
        this.addSpaceCharacter();
        this.characters = '';
        this.addChars(characters);
        this.updateTexture();
    }

    addSpaceCharacter() {
        this.characterMap.set(SPACE_CODE, {
                a: this.spaceWidth,
                x: 0,
                y: 0,
                w: this.spaceWidth,
                h: this.size * this.lineSize,
                u: 0,
                v: 0,
                du: 0,
                dv: 0
            }
        );
    }

    getCharacter(code: number): CharacterData {
        if (this.characterMap.has(code)) {
            return this.characterMap.get(code)!;
        }

        const character = String.fromCharCode(code);
        const ctx = this.ctx!;
        const canvas = ctx.canvas;
        const invScale = 1 / this.scale;
        const metrics = ctx.measureText(character);
        const bb = this.readMetrics(metrics);
        const padding = this.border + this.strokeWidth * this.scale;
        const w = bb.right + bb.left + 2 * padding;
        const h = bb.descent + bb.ascent + 2 * padding;
        let x = this.nextSheetX;
        let y = this.nextSheetY;
        if (x + w > canvas.width) {
            x = 0;
            y += this.sheetLineHeight;
            this.sheetLineHeight = 0;
            if (y + h > canvas.height) {
                this.biggerSheet();
                return this.getCharacter(code);
            }
        }

        if (h > this.sheetLineHeight) {
            this.sheetLineHeight = h;
        }

        const data = {
            a: metrics.width * invScale,
            x: -(bb.left + padding) * invScale,
            y: -(bb.ascent + padding) * invScale,
            w: w * invScale,
            h: h * invScale,
            u: x / canvas.width,
            v: y / canvas.height,
            du: w / canvas.width,
            dv: h / canvas.height
        };

        this.characterMap.set(code, data);
        this.characters += character;
        const px = x + bb.left + padding;
        const py = y + bb.ascent + padding;
        if (this.strokeWidth > 0) {
            ctx.strokeStyle = this.strokeColor;
            ctx.lineWidth = this.strokeWidth * this.scale;
            ctx.lineJoin = 'round';
            ctx.strokeText(character, px, py);
        }
        ctx.fillText(character, px, py);
        if (DEBUG_SHOW_BOUNDS) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgb(255,0,0)';
            ctx.strokeRect(x, y, w, h);
        }
        x += w;
        this.nextSheetX = x;
        this.nextSheetY = y;
        this.dirty = true;

        return data;
    }

    addChars(characters: string) {
        const chars = characters.replace(SPACE_REGEX, '');
        for (let i = 0; i < chars.length; i++) {
            this.getCharacter(chars.charCodeAt(i) | 0);
        }
    }

    dispose() {
        this.deleteTexture();
        this.deleteSheet();
    }

    deleteTexture() {
        if (this.texture !== null) {
            this.texture.dispose();
            this.texture = null;
        }
    }

    updateTexture() {
        if (this.texture === null) {
            this.texture = new Texture(Engine.current.graphics, false);
        }
        const GL = this.texture.graphics.gl;
        GL.pixelStorei(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
        this.texture.upload(this.ctx!.canvas);
        GL.pixelStorei(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
        this.dirty = false;
    }

    private setupContext(ctx: CanvasRenderingContext2D) {
        ctx.canvas.width = this.sheetWidth;
        ctx.canvas.height = this.sheetHeight;
        const fontSize = Math.ceil(this.size * this.scale);
        ctx.font = `${fontSize}px '${this.family}',${fallbackFonts}`;
        ctx.fillStyle = 'rgb(255,255,255)';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
    }
}