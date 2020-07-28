import {BlendMode} from "../graphics/BlendMode";
import {Program, ProgramResource} from "../graphics/Program";
import {Texture, TextureResource} from "../graphics/Texture";
import {
    Color32_ABGR_PMA,
    Color32_ARGB,
    color32_pack_bytes,
    color32_pack_floats,
    Color4,
    Matrix2D,
    Matrix4,
    Recta,
    Vec2
} from "@highduck/math";
import {assert} from "../util/assert";

const vec4Multiply3Add4From32 = (v1: Color4, v2: Color4, offset32: Color32_ARGB) => {
    const inv = 1.0 / 255.0;
    v1.r = v1.r * v2.r + ((offset32 >>> 16) & 0xFF) * inv;
    v1.g = v1.g * v2.g + ((offset32 >>> 8) & 0xFF) * inv;
    v1.b = v1.b * v2.b + (offset32 & 0xFF) * inv;
    v1.a += (offset32 >>> 24) * inv;
};

const packFloats = color32_pack_floats;
const packBytes = color32_pack_bytes;

export const enum CheckFlag {
    Blending = 1,
    Scissors = 2,
    MVP = 4,
    Program = 8,
    Texture = 16
}

export class DrawingState {
    readonly defaultProgram = ProgramResource.require("2d");
    readonly defaultTexture = TextureResource.require("empty");

    // transform states
    readonly canvas = Recta.EMPTY.clone();
    readonly canvasStack: number[] = [0.0];
    canvasHead = 0;

    readonly matrix = Matrix2D.IDENTITY.clone();
    readonly matrixStack: number[] = [0.0];
    matrixHead = 0;

    readonly colorMultiplier = Color4.ONE.clone();
    readonly colorMultiplierStack: number[] = [0.0];
    colorMultiplierHead = 0;

    readonly colorOffset = Color4.ZERO.clone();
    readonly colorOffsetStack: number[] = [0.0];
    colorOffsetHead = 0;

    readonly uv = Recta.UNIT.clone();
    readonly uvStack: number[] = [0.0];
    uvHead = 0;

    // device states

    texture: Texture = this.defaultTexture;
    readonly textureStack: Texture[] = [this.defaultTexture];
    textureHead = 0;

    program: Program = this.defaultProgram;
    readonly programStack: Program[] = [this.defaultProgram];
    programHead = 0;

    readonly mvp = new Matrix4();
    readonly mvpStack: number[] = [0.0];
    mvpHead = 0;

    readonly scissors = Recta.EMPTY.clone();
    readonly scissorsStack: number[] = [0.0];
    scissorsHead = 0;

    blending = BlendMode.Premultiplied;
    readonly blendingStack: BlendMode[] = [BlendMode.Premultiplied];
    blendingHead = 0;

    checkFlags: CheckFlag = 0;

    constructor() {
    }

    finish() {
        if (!!DEBUG) {
            assert(this.matrixHead === 0);
            assert(this.blendingHead === 0);
            assert(this.scissorsHead === 0);
            assert(this.colorMultiplierHead === 0);
            assert(this.colorOffsetHead === 0);
            assert(this.programHead === 0);
            assert(this.textureHead === 0);
            assert(this.mvpHead === 0);
            assert(this.uvHead === 0);
            assert(this.canvasHead === 0);
        }

        this.matrixHead = 0;
        this.blendingHead = 0;
        this.scissorsHead = 0;
        this.colorMultiplierHead = 0;
        this.colorOffsetHead = 0;
        this.programHead = 0;
        this.textureHead = 0;
        this.mvpHead = 0;
        this.uvHead = 0;
        this.canvasHead = 0;
    }

    calcVertexColorMultiplier32(multiplier: Color32_ARGB): Color32_ABGR_PMA {
        const mul = this.colorMultiplier;
        const a = mul.a * (multiplier >>> 24) / 255.0;
        return packBytes(
            a * (1.0 - this.colorOffset.a) * 0xFF,
            a * mul.b * (multiplier & 0xFF),
            a * mul.g * ((multiplier >>> 8) & 0xFF),
            a * mul.r * ((multiplier >>> 16) & 0xFF)
        );
    }

    calcVertexColorMultiplierForAlpha(alpha: number): Color32_ABGR_PMA {
        const mul = this.colorMultiplier;
        const off = this.colorOffset;
        const a = mul.a * alpha;
        return packFloats(
            a * (1 - off.a),
            a * mul.b,
            a * mul.g,
            a * mul.r
        );
    }

    pushScissors(rc: Recta): this {
        this.saveScissors();
        this.scissors.intersect(rc);
        this.checkFlags |= CheckFlag.Scissors;
        return this;
    }

    setScissors(rc: Recta): this {
        this.scissors.copyFrom(rc);
        this.checkFlags |= CheckFlag.Scissors;
        return this;
    }

    saveScissors(): this {
        this.scissors.writeToArray(this.scissorsStack, this.scissorsHead);
        this.scissorsHead += 4;
        return this;
    }

    restoreScissors(): this {
        this.scissorsHead -= 4;
        this.scissors.readFromArray(this.scissorsStack, this.scissorsHead);
        this.checkFlags |= CheckFlag.Scissors;
        return this;
    }

    /** Matrix Transform **/

    saveMatrix(): this {
        this.matrix.writeToArray(this.matrixStack, this.matrixHead);
        this.matrixHead += 6;
        return this;
    }

    saveTransform(): this {
        this.saveMatrix();
        this.saveColor();
        return this;
    }

    restoreTransform(): this {
        this.restoreMatrix();
        this.restoreColor();
        return this;
    }

    translate(tx: number, ty: number): this {
        this.matrix.translate(tx, ty);
        return this;
    }

    scale(sx: number, sy: number): this {
        this.matrix.scale(sx, sy);
        return this;
    }

    rotate(radians: number): this {
        this.matrix.rotate(radians);
        return this;
    }

    concatMatrix(r: Matrix2D): this {
        Matrix2D.multiply(this.matrix, r, this.matrix);
        return this;
    }

    restoreMatrix(): this {
        this.matrixHead -= 6;
        this.matrix.readFromArray(this.matrixStack, this.matrixHead);
        return this;
    }

    /** Color Transform **/

    saveColor(): this {
        this.colorMultiplier.writeToArray(this.colorMultiplierStack, this.colorMultiplierHead);
        this.colorMultiplierHead += 4;
        this.colorOffset.writeToArray(this.colorOffsetStack, this.colorOffsetHead);
        this.colorOffsetHead += 4;
        return this;
    }

    restoreColor(): this {
        this.colorMultiplierHead -= 4;
        this.colorMultiplier.readFromArray(this.colorMultiplierStack, this.colorMultiplierHead);
        this.colorOffsetHead -= 4;
        this.colorOffset.readFromArray(this.colorOffsetStack, this.colorOffsetHead);
        return this;
    }

    multiplyAlpha(alpha: number): this {
        this.colorMultiplier.a *= alpha;
        return this;
    }

    multiplyColor32(multiplier: Color32_ARGB): this {
        const inv = 1.0 / 255.0;
        this.colorMultiplier.multiplyValues(
            ((multiplier >>> 16) & 0xFF) * inv,
            ((multiplier >>> 8) & 0xFF) * inv,
            (multiplier & 0xFF) * inv,
            (multiplier >>> 24) * inv
        );
        // color32_mul(this.colorMultiplier, multiplier);
        return this;
    }

    combineColor(multiplier: Readonly<Color4>, offset: Readonly<Color4>): this {
        const off = this.colorOffset;
        const mul = this.colorMultiplier;
        off.r = offset.r * mul.r + off.r;
        off.g = offset.g * mul.g + off.g;
        off.b = offset.b * mul.b + off.b;
        // off.r = off.r * mul.r + offset.r;
        // off.g = off.g * mul.g + offset.g;
        // off.b = off.b * mul.b + offset.b;
        off.a += offset.a;
        mul.multiply(multiplier);
        return this;
    }

    combineColor32(multiplier: Color32_ARGB, offset: Color32_ARGB): this {
        if (offset !== 0) {
            vec4Multiply3Add4From32(this.colorOffset, this.colorMultiplier, offset);
        }

        if (multiplier != 0xFFFFFFFF) {
            const inv = 1.0 / 255.0;
            this.colorMultiplier.multiplyValues(
                ((multiplier >>> 16) & 0xFF) * inv,
                ((multiplier >>> 8) & 0xFF) * inv,
                (multiplier & 0xFF) * inv,
                (multiplier >>> 24) * inv
            );
            // this.colorMultiplier = color32_mul(this.colorMultiplier, multiplier);
        }

        return this;
    }

    offsetColor(offset: Color32_ARGB): this {
        if (offset !== 0) {
            vec4Multiply3Add4From32(this.colorOffset, this.colorMultiplier, offset);
        }
        return this;
    }

    /** STATES **/

    saveCanvasRect(): this {
        this.canvas.writeToArray(this.canvasStack, this.canvasHead);
        this.canvasHead += 4;
        return this;
    }

    restoreCanvasRect(): this {
        this.canvasHead -= 4;
        this.canvas.readFromArray(this.canvasStack, this.canvasHead);
        return this;
    }

    saveMVP(): this {
        this.mvp.writeToArray(this.mvpStack, this.mvpHead);
        this.mvpHead += 16;
        return this;
    }

    setMVP(m: Matrix4): this {
        this.mvp.copyFrom(m);
        this.checkFlags |= CheckFlag.MVP;
        return this;
    }

    restoreMVP(): this {
        this.mvpHead -= 16;
        this.mvp.readFromArray(this.mvpStack, this.mvpHead);
        this.checkFlags |= CheckFlag.MVP;
        return this;
    }

    saveTextureCoords(): this {
        this.uv.writeToArray(this.uvStack, this.uvHead);
        this.uvHead += 4;
        return this;
    }

    setTextureCoords(u0 = 0, v0 = 0, du = 1, dv = 1): this {
        this.uv.set(u0, v0, du, dv);
        return this;
    }

    setTextureCoordsRect(uv: Recta): this {
        this.uv.copyFrom(uv);
        return this;
    }

    restoreTextureCoords(): this {
        this.uvHead -= 4;
        this.uv.readFromArray(this.uvStack, this.uvHead);
        return this;
    }

    saveTexture(): this {
        this.textureStack[this.textureHead++] = this.texture;
        return this;
    }

    setEmptyTexture(): this {
        const spot = this.texture.spot;
        if (spot !== null) {
            this.uv.copyFrom(spot);
        } else {
            this.texture = this.defaultTexture;
            this.checkFlags |= CheckFlag.Texture;
            this.uv.set(0.0, 0.0, 1.0, 1.0);
        }
        return this;
    }

    setTexture(texture: Texture): this {
        this.texture = texture;
        this.checkFlags |= CheckFlag.Texture;
        return this;
    }

    setTextureRegion(texture?: Texture, rc?: Recta): this {
        this.texture = texture ? texture : this.defaultTexture;
        this.checkFlags |= CheckFlag.Texture;
        if (rc) {
            this.uv.copyFrom(rc);
        } else {
            this.uv.set(0.0, 0.0, 1.0, 1.0);
        }
        return this;
    }

    restoreTexture(): this {
        this.texture = this.textureStack[--this.textureHead];
        this.checkFlags |= CheckFlag.Texture;
        return this;
    }

    setProgram(program: Program | null): this {
        this.program = program !== null ? program : this.defaultProgram;
        this.checkFlags |= CheckFlag.Program;
        return this;
    }

    saveProgram(): this {
        this.programStack[this.programHead++] = this.program;
        return this;
    }

    restoreProgram(): this {
        this.program = this.programStack[--this.programHead];
        this.checkFlags |= CheckFlag.Program;
        return this;
    }

    saveBlendMode(): this {
        this.blendingStack[this.blendingHead++] = this.blending;
        return this;
    }

    restoreBlendMode(): this {
        this.blending = this.blendingStack[--this.blendingHead];
        this.checkFlags |= CheckFlag.Blending;
        return this;
    }

    setBlendMode(blending: BlendMode): this {
        this.blending = blending;
        this.checkFlags |= CheckFlag.Blending;
        return this;
    }

    transformAround(position: Vec2, rotation: number, scale: Vec2, origin: Vec2): this {
        this.matrix.translate(position.x + origin.x, position.y + origin.y)
            .scale(scale.x, scale.y)
            .rotate(rotation)
            .translate(-origin.x, -origin.y);
        return this;
    }
}
