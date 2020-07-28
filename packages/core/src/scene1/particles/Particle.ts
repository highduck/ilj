import {ParticleAlphaMode, ParticleScaleMode} from "./ParticleDecl";
import {Color4, lerp, Matrix2D, quadOut, Recta, saturate} from "@highduck/math";
import {AssetRef} from "../../util/Resources";
import {Sprite} from "../Sprite";
import {Drawer} from "../../drawer/Drawer";
import {Font} from "../../rtfont/Font";

const RECT_TEMP = new Recta();
const s_matrix = new Matrix2D();

export class Particle {
    sprite: AssetRef<Sprite> = AssetRef.NONE;
    text = '';
    font: AssetRef<Font> = AssetRef.NONE;
    fontSize = 0;
    // pivot
    px = NaN;
    py = NaN;

    time = NaN;
    timeTotal = NaN;
    // position
    x = NaN;
    y = NaN;

    // velocity
    vx = NaN;
    vy = NaN;

    // acceleration
    ax = NaN;
    ay = NaN;

    accPhaseX = NaN;
    accSpeedX = NaN;

// angle state
    angleBase = NaN;

// rotating and rotation speed
    rotation = NaN;
    rotationSpeed = NaN;
    angleVelocityFactor = NaN;

// initial alpha
    alphaMode = ParticleAlphaMode.None;
    alpha = NaN;

    readonly color = new Color4(1, 1, 1, 1);
    readonly offset = new Color4(0, 0, 0, 0);

    scaleMode = ParticleScaleMode.None;
    scaleOffTime = NaN;
    scaleStart = NaN;
    scaleEnd = NaN;

    // current state

    // scale
    sx = NaN;
    sy = NaN;

    angle = NaN;

    readonly bounds = new Recta(0, 0, 1, 1);

    constructor() {
        this.px = 0.0;
        this.py = 0.0;
        this.time = 0.0;
        this.timeTotal = 1.0;
        this.x = 0.0;
        this.y = 0.0;
        this.vx = 0.0;
        this.vy = 0.0;
        this.ax = 0.0;
        this.ay = 0.0;
        this.accPhaseX = 0.0;
        this.accSpeedX = 0.0;
        this.angleBase = 0.0;
        this.rotation = 0.0;
        this.rotationSpeed = 0.0;
        this.angleVelocityFactor = 0.0;
        this.alpha = 0.0;
        this.scaleOffTime = 0.0;
        this.scaleStart = 0.0;
        this.scaleEnd = 1.0;
        this.sx = 1.0;
        this.sy = 1.0;
        this.angle = 0.0;
    }
    //onUpdate?: (particle: Particle) => void = undefined;

    isAlive(): boolean {
        return this.time > 0;
    }

    setLifeTime(life_time: number) {
        this.time = this.timeTotal = life_time;
    }

    update(dt: number) {
        const ax = this.ax * Math.sin(this.accPhaseX + this.time * this.accSpeedX);
        this.vx += ax * dt;
        this.vy += this.ay * dt;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.rotation += this.rotationSpeed * dt;

        this.updateCurrentValues();

        this.time -= dt;
    }

    updateCurrentValues() {
        switch (this.scaleMode) {
            case ParticleScaleMode.CosOut: {
                this.sx =
                    this.sy = Math.cos(0.5 * Math.PI * (1.0 - this.time / this.timeTotal));
            }
                break;
            case ParticleScaleMode.Range: {
                const time_max = this.scaleOffTime > 0.0 ? this.scaleOffTime : this.timeTotal;
                const ratio = 1 - saturate(this.time / time_max);
                this.sx = this.sy = lerp(this.scaleStart, this.scaleEnd, ratio);
            }
                break;
            default:
                this.sx = this.sy = this.scaleStart;
                break;
        }
        //
        // if (this.onUpdate) {
        //     this.onUpdate(this);
        // }

        switch (this.alphaMode) {
            case ParticleAlphaMode.ByScale:
                this.color.a = saturate(this.alpha * Math.sqrt(this.sx * this.sx + this.sy * this.sy));
                break;
            case ParticleAlphaMode.LifeSine:
                this.color.a = this.alpha * Math.sin(Math.PI * this.time / this.timeTotal);
                break;
            case ParticleAlphaMode.QuadOut:
                this.color.a = this.alpha * quadOut(this.time / this.timeTotal);
                break;
            case ParticleAlphaMode.DCBlink: {
                let a = 0.25;
                if (this.time > 0.75) {
                    a = 1.0 - this.time;
                } else if (this.time < 0.25) {
                    a = this.time;
                }
                a *= 4;
                this.color.a = this.alpha * a;
            }
                break;
            default:
                this.color.a = this.alpha;
                break;
        }

        this.angle = this.angleBase + this.rotation;
        if (this.angleVelocityFactor > 0) {
            this.angle += this.angleVelocityFactor * Math.atan2(this.vy, this.vx);
        }
    }

    updateBounds(): Recta {
        if (this.sprite.data !== null) {
            this.bounds.copyFrom(this.sprite.data.rect);
        } else if (this.fontSize > 0 && this.font.data) {
            const width = this.font.data.getTextSegmentWidth(this.text, this.fontSize, 0, this.text.length);
            this.bounds.set(-0.5 * width, -0.5 * this.fontSize, width, this.fontSize);
        }
        return this.bounds;
    }

    drawCycled(matrix: Matrix2D, colorMultiplier: Color4, colorOffset: Color4, drawer: Drawer) {
        const camera = drawer.state.canvas;
        const width = camera.width;
        const box = RECT_TEMP.copyFrom(this.updateBounds()).scale(this.sx, this.sy);
        box.x += this.x;
        box.y += this.y;
        if (box.right >= camera.x && box.x <= camera.right) {
            this.draw(matrix, colorMultiplier, colorOffset, drawer, 0);
        }
        if (box.right > camera.right && box.right - width >= camera.x && box.x - width <= camera.right) {
            this.draw(matrix, colorMultiplier, colorOffset, drawer, -width);
        }
        if (this.bounds.x < camera.x && box.right + width >= camera.x && box.x + width <= camera.right) {
            this.draw(matrix, colorMultiplier, colorOffset, drawer, width);
        }
    }

    draw(matrix: Matrix2D, colorMultiplier: Color4, colorOffset: Color4, drawer: Drawer, offsetX: number) {
        /*#__NOINLINE__*/
        buildMatrix(this.x + offsetX, this.y, this.sx, this.sy, this.angle, this.px, this.py, s_matrix);
        Matrix2D.multiply(matrix, s_matrix, drawer.state.matrix);
        Color4._combine(
            colorMultiplier, colorOffset,
            this.color, this.offset,
            drawer.state.colorMultiplier, drawer.state.colorOffset
        );
        // drawer.state
        //     .saveTransform()
        //     .translate(this.x + this.px + offsetX, this.y + this.py)
        //     .scale(this.sx, this.sy)
        //     .rotate(this.angle)
        //     .translate(-this.px, -this.py)
        //     .combineColor(this.color, this.offset);
        // {
        const size = this.fontSize;
        if (this.sprite.data !== null) {
            this.sprite.data.draw(drawer);
        } else if (size > 0 && this.text && this.text.length > 0 && this.font.data) {
            const width = this.font.data.getTextSegmentWidth(this.text, size, 0, this.text.length);
            this.font.data.draw(this.text, size, -0.5 * width, 0.5 * size, size, 0);
        }
        // }
        // drawer.state.restoreTransform();
    }
}

function buildMatrix(x: number,
                     y: number,
                     sx: number,
                     sy: number,
                     angle: number,
                     px: number,
                     py: number,
                     out: Matrix2D) {
    x += px;
    y += py;

    const cs = Math.cos(angle);
    const sn = Math.sin(angle);
    const ra = cs * sx;
    const rb = sn * sx;
    const rc = -sn * sy;
    const rd = cs * sy;

    out.a = ra;
    out.b = rb;
    out.c = rc;
    out.d = rd;
    out.x = x - ra * px - rc * py;
    out.y = y - rd * py - rb * px;
}