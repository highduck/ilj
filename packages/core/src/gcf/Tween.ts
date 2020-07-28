import {saturate} from "@highduck/math";
import {ComponentTypeA, getComponentEntities, getComponents, Signal, Time} from "..";
import {Entity} from "../ecs";

export class TweenData {
    delay = 0.0;
    time = 0.0;
    duration = 1.0;
    autoDestroy = true;
    readonly advanced = new Signal<number>();

    // utility methods
    timer = Time.ROOT;

    onAdvance(cb: (t: number) => void): this {
        this.advanced.on(cb);
        return this;
    }

    onComplete(cb: (t: number) => void): this {
        this.advanced.on((t) => {
            if (t >= 1) {
                cb(t);
            }
        });
        return this;
    }

    setOptions(duration: number = 1, delay: number = 0): this {
        this.duration = duration;
        this.delay = delay;
        return this;
    }
}

function updateFrame(tween: TweenData) {
    const t = saturate(tween.time / tween.duration);
    tween.advanced.emit(t);
}

export function updateTweens() {
    const tweens = getComponents(Tween);
    const entities = getComponentEntities(Tween);
    for (let i = 0; i < tweens.length; ++i) {
        const tween = tweens[i];
        const dt = tween.timer.dt;
        if (tween.delay > 0) {
            tween.delay -= dt;
            continue;
        }
        tween.time += dt;

        updateFrame(tween);

        if (tween.time >= tween.duration) {
            tween.advanced.clear();
            if (tween.autoDestroy) {
                Tween.unbind(entities[i]);
            }
        }
    }
}

export const Tween = new ComponentTypeA(TweenData);

export function resetTween(e: Entity): TweenData {
    const tween = e.getOrCreate(Tween);
    if (tween.time > 0 && tween.time < tween.duration) {
        tween.time = tween.duration;
        updateFrame(tween);
        tween.advanced.clear();
    }
    tween.time = 0;
    return tween;
}