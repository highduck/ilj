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
        font !== undefined && font.atlas.dirty && font.atlas.updateTexture();
    }
}

export function resetFonts() {
    const objects = FontResource.map.values;
    for (let i = 0; i < objects.length; ++i) {
        const font = objects[i].data;
        font !== undefined && font.atlas.dirty && font.atlas.resetSheet('');
    }
}

const fallbackFonts = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif';

const CHAR_BOUNDING_BOX = {
    supported: 0,
    left: 0,
    right: 0,
    ascent: 0,
    descent: 0
};

export class FontAtlas {

    canvas!: HTMLCanvasElement;
    ctx!: CanvasRenderingContext2D;
    texture: Texture | undefined = undefined;

    sheetWidth: number = 256;
    sheetHeight: number = 256;
    nextSheetX: number = 0;
    nextSheetY: number = 0;
    sheetLineHeight: number = 0;
    characters: string = '';

    strokeColor: string | undefined = 'rgba(0,0,0,0.5)';
    strokeLineWidth = 3;

    border: number = Math.ceil(this.scale); // in pixels, resolution independent

    spaceWidth: number = 1;
    characterMap = new Map<number, CharacterData>();
    lineSize: number = 1.3; // relative to EM units

    dirty: boolean = false;

    constructor(readonly engine: Engine,
                readonly family: string,
                readonly size: number,
                readonly scale: number) {

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

    private createSheet() {
        if (this.canvas && this.ctx) {
            return;
        }
        this.canvas = document.createElement('canvas');

        if (DEBUG_SHOW_CANVAS) {
            document.body.append(this.canvas);
            this.canvas.style.position = 'absolute';
            this.canvas.style.left = '0';
            this.canvas.style.top = '0';
            this.canvas.style.opacity = '50%';
            this.canvas.style.pointerEvents = 'none';
            this.canvas.style.userSelect = 'none';
        }

        this.ctx = this.canvas.getContext('2d')!;
        this.setupContext();
        this.spaceWidth = this.ctx.measureText(' ').width / this.scale;
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
    }

    deleteSheet() {
        this.canvas.width = 1;
        this.canvas.height = 1;
        delete this.ctx;
        delete this.canvas;
    }

    biggerSheet() {
        if (this.sheetWidth <= this.sheetHeight) {
            this.sheetWidth *= 2;
        } else {
            this.sheetHeight *= 2;
        }
        this.setupContext();
        this.resetSheet(this.characters);
    }

    resetSheet(characters: string) {
        if (this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.createSheet();
        }
        if (DEBUG_SHOW_CANVAS) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'rgb(255, 255, 255)';
            this.ctx.strokeStyle = 'rgb(0, 255, 0)';
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

    addCharacter(code: number) {
        if (this.characterMap.has(code)) {
            return;
        }

        const character = String.fromCharCode(code);
        const ctx = this.ctx;
        const invScale = 1 / this.scale;
        const metrics = this.ctx.measureText(character);
        const bb = this.readMetrics(metrics);
        const padding = this.border + (this.strokeColor !== undefined ? this.strokeLineWidth * this.scale : 0)
        const w = bb.right + bb.left + 2 * padding;
        const h = bb.descent + bb.ascent + 2 * padding;
        let x = this.nextSheetX;
        let y = this.nextSheetY;
        if (x + w > this.canvas.width) {
            x = 0;
            y += this.sheetLineHeight;
            this.sheetLineHeight = 0;
            if (y + h > this.canvas.height) {
                this.biggerSheet();
                this.addCharacter(code);
                return;
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
            u: x / this.canvas.width,
            v: y / this.canvas.height,
            du: w / this.canvas.width,
            dv: h / this.canvas.height
        };

        this.characterMap.set(code, data);
        this.characters += character;
        const px = x + bb.left + padding;
        const py = y + bb.ascent + padding;
        if (this.strokeColor !== undefined) {
            this.ctx.strokeStyle = this.strokeColor;
            this.ctx.lineWidth = this.strokeLineWidth * this.scale;
            this.ctx.lineJoin = 'round';
            ctx.strokeText(character, px, py);
        }
        ctx.fillText(character, px, py);
        if (DEBUG_SHOW_BOUNDS) {
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = 'rgb(255,0,0)';
            ctx.strokeRect(x, y, w, h);
        }
        x += w;
        this.nextSheetX = x;
        this.nextSheetY = y;
        this.dirty = true;
    }

    addChars(characters: string) {
        const chars = characters.replace(SPACE_REGEX, '');
        for (let i = 0, l = chars.length; i < l; i += 1) {
            this.addCharacter(chars.charCodeAt(i));
        }
    }

    dispose() {
        this.deleteTexture();
        this.deleteSheet();
    }

    deleteTexture() {
        if (this.texture) {
            this.texture.dispose();
            delete this.texture;
        }
    }

    updateTexture() {
        if (this.texture === undefined) {
            this.texture = new Texture(this.engine.graphics, false);
        }
        const GL = this.texture.graphics.gl;
        GL.pixelStorei(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
        this.texture.upload(this.canvas);
        GL.pixelStorei(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
        this.dirty = false;
    }

    getCharacter(code: number) {
        const c = this.characterMap.get(code);
        if (c !== undefined) {
            return c;
        }
        this.addCharacter(code);
        return this.characterMap.get(code)!;
    }

    private setupContext() {
        this.canvas.width = this.sheetWidth;
        this.canvas.height = this.sheetHeight;
        const fontSize = Math.ceil(this.size * this.scale);
        this.ctx.font = `${fontSize}px '${this.family}',${fallbackFonts}`;
        this.ctx.fillStyle = 'rgb(255,255,255)';
        this.ctx.textBaseline = 'top';
        this.ctx.textAlign = 'left';
    }
}