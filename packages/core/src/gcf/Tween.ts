import {saturate} from "@highduck/math";
import {declTypeID, Engine, Entity, Signal, Time} from "..";
import {getComponents} from "../ecs/World";

export class Tween {
    static TYPE_ID = declTypeID();
    readonly entity!: Entity;

    delay = 0;
    time = 0;
    duration = 1;
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


function handleEnd(tween: Tween) {
    tween.advanced.clear();
    if (tween.autoDestroy) {
        tween.entity.delete(Tween);
    }
}

function updateFrame(tween: Tween) {
    const t = saturate(tween.time / tween.duration);
    tween.advanced.emit(t);
}

export function updateTweens() {
    const tweens = getComponents(Tween);
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
            handleEnd(tween);
        }
    }
}

export function resetTween(e: Entity): Tween {
    const tween = e.getOrCreate(Tween);
    if (tween.time > 0 && tween.time < tween.duration) {
        tween.time = tween.duration;
        updateFrame(tween);
        tween.advanced.clear();
    }
    tween.time = 0;
    return tween;
}