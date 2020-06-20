import {Particle} from "./Particle";
import {declTypeID} from "../../util/TypeID";
import {Color32_ARGB, Color4, Rect, RndDefault, Vec2} from "@highduck/math";
import {AssetRef} from "../../util/Resources";
import {Sprite} from "../Sprite";
import {DynamicFont} from "../../rtfont/DynamicFont";

export const enum ParticleScaleMode {
    None = 0,
    CosOut = 1,
    Range = 2,
}

export const enum ParticleAlphaMode {
    None = 0,
    ByScale = 1,
    LifeSine = 2,
    DCBlink = 3,
    QuadOut = 4,
}

export const enum RandomColorMode {
    Continuous = 0,
    RandomLerp = 1,
    RandomElement = 2,
}

export class RandomColorRange {
    // public
    colors: Color4[] = [new Color4(1, 1, 1, 1)];
    mode = RandomColorMode.RandomElement;
    state = 0;

    random(out: Color4): Color4 {
        ++this.state;
        const last = this.colors.length - 1;
        if (this.colors.length === 0) {
            return out.set(1, 1, 1, 1);
        }
        if (this.colors.length === 1) {
            return out.copyFrom(this.colors[0]);
        }
        switch (this.mode) {
            case RandomColorMode.RandomLerp: {
                let t = last * Math.random();
                const i = Math.floor(t);
                t = t - i; // fract
                return out.copyFrom(this.colors[i]).lerp(this.colors[i + 1], t);
            }
            case RandomColorMode.RandomElement:
                return out.copyFrom(RndDefault.element(this.colors)!);
            case RandomColorMode.Continuous:
                return out.copyFrom(this.colors[this.state % this.colors.length]);
        }
        return out.set(1, 1, 1, 1);
    }

    gradient(color1: Color32_ARGB, color2: Color32_ARGB): this {
        this.colors = [Color4.color32(color1), Color4.color32(color2)];
        this.mode = RandomColorMode.RandomLerp;
        return this;
    }

    steps(color1: Color32_ARGB, color2: Color32_ARGB): this {
        this.colors = [Color4.color32(color1), Color4.color32(color2)];
        this.mode = RandomColorMode.Continuous;
        return this;
    }

    solid(color: Color32_ARGB): this {
        this.colors = [Color4.color32(color)];
        this.mode = RandomColorMode.Continuous;
        return this;
    }

    copyFrom(o: RandomColorRange): this {
        this.colors.length = 0;
        for (let i = 0; i < o.colors.length; ++i) {
            this.colors.push(o.colors[i].copy());
        }
        this.mode = o.mode;
        this.state = o.state;
        return this;
    }
}

class RandomFloatRange {
    min: number;
    max: number;

    constructor(min = 0, max?: number) {
        this.min = min;
        this.max = max ?? min;
    }

    value(x: number): this {
        this.min = x;
        this.max = x;
        return this;
    }

    range(min: number, max: number): this {
        this.min = min;
        this.max = max;
        return this;
    }

    random(): number {
        return this.min + (this.max - this.min) * Math.random();
    }

    copyFrom(o: RandomFloatRange): this {
        this.min = o.min;
        this.max = o.max;
        return this;
    }
}

export class ParticleDecl {
    static TYPE_ID = declTypeID();

    sprite?: AssetRef<Sprite>;

    font?: AssetRef<DynamicFont>;
    fontSize = 0;

    scaleMode = ParticleScaleMode.None;
    alphaMode = ParticleAlphaMode.None;
    readonly alphaStart = new RandomFloatRange(1, 1);
    readonly acceleration = new Vec2();

    // @inspect
    readonly lifeTime = new RandomFloatRange(1, 1);

    readonly accPhaseX = new RandomFloatRange(Math.PI / 2, Math.PI / 2);
    readonly accSpeedX = new RandomFloatRange(0);

    scaleOffTime = 0;
    readonly scaleStart = new RandomFloatRange(1, 1);
    readonly scaleEnd = new RandomFloatRange(0, 0);

    readonly color = new RandomColorRange();
    readonly colorOffset = new Color4(0, 0, 0, 0);
    readonly rotation = new RandomFloatRange(0, 0);
    rotationSpeed = 0.0;

    angleVelocityFactor = 0.0;
    angleBase = 0.0;

    onUpdate?: (particle: Particle) => void = undefined;

    copyFrom(other: ParticleDecl) {
        this.sprite = other.sprite;
        this.font = other.font;
        this.fontSize = other.fontSize;
        this.scaleMode = other.scaleMode;
        this.alphaMode = other.alphaMode;
        this.alphaStart.copyFrom(other.alphaStart);
        this.acceleration.copyFrom(other.acceleration);
        this.lifeTime.copyFrom(other.lifeTime);
        this.accPhaseX.copyFrom(other.accPhaseX);
        this.accSpeedX.copyFrom(other.accSpeedX);
        this.scaleOffTime = other.scaleOffTime;
        this.scaleStart.copyFrom(other.scaleStart);
        this.scaleEnd.copyFrom(other.scaleEnd);
        this.color.copyFrom(other.color);
        this.colorOffset.copyFrom(other.colorOffset);
        this.rotation.copyFrom(other.rotation);
        this.rotationSpeed = other.rotationSpeed;
        this.angleVelocityFactor = other.angleVelocityFactor;
        this.angleBase = other.angleBase;
        this.onUpdate = other.onUpdate;
    }

    clone(): ParticleDecl {
        const c = new ParticleDecl();
        c.copyFrom(this);
        return c;
    }
}

export class EmitterData {
    interval = 0.5;
    burst = 1;
    readonly rect = new Rect();
    readonly offset = new Vec2();

    burstRotationDelta = new RandomFloatRange(1, 1.5);
    speed = new RandomFloatRange(10, 100);
    acc = new RandomFloatRange(0, 0);
    dir = new RandomFloatRange(0, 2 * Math.PI);
    particle?: AssetRef<ParticleDecl>;
    velocity?: Vec2;

    onSpawn?: (p: Particle) => void;
}
