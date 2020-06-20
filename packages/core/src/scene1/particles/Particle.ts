import {ParticleAlphaMode, ParticleScaleMode} from "./ParticleDecl";
import {Color4, lerp, quadOut, Rect, saturate} from "@highduck/math";
import {AssetRef} from "../../util/Resources";
import {Sprite} from "../Sprite";
import {Drawer} from "../../drawer/Drawer";
import {DynamicFont} from "../../rtfont/DynamicFont";

const RECT_TEMP = new Rect();

export class Particle {
    sprite?: AssetRef<Sprite>;
    text?: string;
    font?: AssetRef<DynamicFont>;
    fontSize = 0;
    // pivot
    px = 0.0;
    py = 0.0;

    time = 0.0;
    timeTotal = 0.0;
    // position
    x = 0.0;
    y = 0.0;

    // velocity
    vx = 0.0;
    vy = 0.0;

    // acceleration
    ax = 0.0;
    ay = 0.0;

    accPhaseX = Math.PI / 2;
    accSpeedX = 0;

// angle state
    angleBase = 0.0;

// rotating and rotation speed
    rotation = 0.0;
    rotationSpeed = 0.0;
    angleVelocityFactor = 0.0;

// initial alpha
    alphaMode = ParticleAlphaMode.None;
    alpha = 1.0;

    readonly color = new Color4(1, 1, 1, 1);
    readonly offset = new Color4(0, 0, 0, 0);

    scaleMode = ParticleScaleMode.None;
    scaleOffTime = 0.0;
    scaleStart = 1.0;
    scaleEnd = 0.0;

    // current state

    // scale
    sx = 1.0;
    sy = 1.0;

    angle = 0.0;

    readonly bounds = new Rect(0, 0, 1, 1);

    //onUpdate?: (particle: Particle) => void = undefined;

    init() {
        this.updateCurrentValues();
    }

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

    updateBounds(): Rect {
        if (this.sprite?.data) {
            this.bounds.copyFrom(this.sprite.data.rect);
        } else if (this.fontSize > 0 && this.text && this.font && this.font.data) {
            const width = this.font.data.getTextSegmentWidth(this.text, this.fontSize, 0, this.text.length);
            this.bounds.set(-0.5 * width, -0.5 * this.fontSize, width, this.fontSize);
        }
        return this.bounds;
    }

    drawCycled(drawer: Drawer) {
        const camera = drawer.state.canvas;
        const width = camera.width;
        const box = RECT_TEMP.copyFrom(this.updateBounds()).scale(this.sx, this.sy);
        box.x += this.x;
        box.y += this.y;
        if (box.right >= camera.x && box.x <= camera.right) {
            this.draw(drawer, 0);
        }
        if (box.right > camera.right && box.right - width >= camera.x && box.x - width <= camera.right) {
            this.draw(drawer, -width);
        }
        if (this.bounds.x < camera.x && box.right + width >= camera.x && box.x + width <= camera.right) {
            this.draw(drawer, width);
        }
    }

    draw(drawer: Drawer, offsetX: number) {
        drawer.state
            .saveTransform()
            .translate(this.x + this.px + offsetX, this.y + this.py)
            .scale(this.sx, this.sy)
            .rotate(this.angle)
            .translate(-this.px, -this.py)
            .combineColor(this.color, this.offset);
        {
            const size = this.fontSize;
            if (this.sprite && this.sprite.data) {
                this.sprite.data.draw(drawer);
            } else if (size > 0 && this.text && this.text.length > 0 && this.font && this.font.data) {
                const width = this.font.data.getTextSegmentWidth(this.text, size, 0, this.text.length);
                this.font.data.draw(this.text, size, -0.5 * width, 0.5 * size, size, 0);
            }
        }
        drawer.state.restoreTransform();
    }
}