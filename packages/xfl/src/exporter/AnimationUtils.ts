import {Color4, Vec2} from "@highduck/math";
import {Element, Frame} from "../xfl/types";
import {SgMovieFrame, SgMovieLayer} from "../anif/SgModel";
import {RotationDirection, SymbolType} from "../xfl/dom";

function sign(a: number): number {
    return a > 0 ? 1 : (a < 0 ? -1 : 0);
}

export class KeyframeTransform {
    readonly position = new Vec2();
    readonly scale = new Vec2(1, 1);
    readonly skew = new Vec2();
    readonly pivot = new Vec2();
    readonly colorMultiplier = new Color4(0, 0, 0, 0);
    readonly colorOffset = new Color4(0, 0, 0, 0);

    constructor() {

    }

    copyFromElement(el: Element): this {
        const m = el.matrix;
        this.pivot.copyFrom(el.transformationPoint);
        this.position.copyFrom(el.transformationPoint).transform(m);
        m.extractScale(this.scale);
        m.extractSkew(this.skew);
        this.colorMultiplier.copyFrom(el.colorMultiplier);
        this.colorOffset.copyFrom(el.colorOffset);
        return this;
    }

    diffWithPrev(v: KeyframeTransform): this {
        this.position.subtract(v.position);
        this.pivot.subtract(v.pivot);
        this.scale.subtract(v.scale);
        this.skew.subtract(v.skew);
        this.colorMultiplier.subtract(v.colorMultiplier);
        this.colorOffset.subtract(v.colorOffset);
        return this;
    }

    add(v: KeyframeTransform): this {
        this.position.add(v.position);
        this.pivot.add(v.pivot);
        this.scale.add(v.scale);
        this.skew.add(v.skew);
        this.colorMultiplier.add(v.colorMultiplier);
        this.colorOffset.add(v.colorOffset);
        return this;
    }
}

export function extractTweenDelta(frame: Frame, el0: Element, el1: Element) {
    const t0 = new KeyframeTransform().copyFromElement(el0);
    const t1 = new KeyframeTransform().copyFromElement(el1);
    fixRotation2(t0, t1);
    addRotation2(frame, t0, t1);
    return t1.diffWithPrev(t0);
}

export function setupFrameFromElement(target: SgMovieFrame, el: Element) {
    const m = el.matrix;
    target.pivot.copyFrom(el.transformationPoint);
    target.position.copyFrom(el.transformationPoint).transform(m);
    m.extractScale(target.scale);
    m.extractSkew(target.skew);
    target.colorMultiplier.copyFrom(el.colorMultiplier);
    target.colorOffset.copyFrom(el.colorOffset);
    target.visible = el.isVisible;
    if (el.symbolType === SymbolType.graphic) {
        target.loopMode = el.loop;
        target.firstFrame = el.firstFrame;
    }
}

function fixRotation2(t0: KeyframeTransform, t1: KeyframeTransform) {
    if (t0.skew.x + Math.PI < t1.skew.x) {
        t1.skew.x -= 2 * Math.PI;
    } else if (t0.skew.x - Math.PI > t1.skew.x) {
        t1.skew.x += 2 * Math.PI;
    }
    if (t0.skew.y + Math.PI < t1.skew.y) {
        t1.skew.y -= 2 * Math.PI;
    } else if (t0.skew.y - Math.PI > t1.skew.y) {
        t1.skew.y += 2 * Math.PI;
    }
}

function addRotation2(frame: Frame, t0: KeyframeTransform, t1: KeyframeTransform) {
    let additionalRotation = 0;
    const rotate = frame.motionTweenRotate;
    const times = frame.motionTweenRotateTimes;
    // If a direction is specified, take it into account
    if (rotate !== RotationDirection.none) {
        let direction = (rotate === RotationDirection.cw ? 1 : -1);
        // negative scales affect rotation direction
        direction *= sign(t1.scale.x) * sign(t1.scale.y);

        while (direction < 0 && t0.skew.x < t1.skew.x) {
            t1.skew.x -= 2 * Math.PI;
        }
        while (direction > 0 && t0.skew.x > t1.skew.x) {
            t1.skew.x += 2 * Math.PI;
        }
        while (direction < 0 && t0.skew.y < t1.skew.y) {
            t1.skew.y -= 2 * Math.PI;
        }
        while (direction > 0 && t0.skew.y > t1.skew.y) {
            t1.skew.y += 2 * Math.PI;
        }

        // additional rotations specified?
        additionalRotation += times * 2 * Math.PI * direction;
    }

    t1.skew.x += additionalRotation;
    t1.skew.y += additionalRotation;
}