import {Component, Engine, Time} from "..";
import {ADSREnvelope, atADSR} from "@highduck/math";
import {getComponents} from "../ecs/World";

export class SlowMotion extends Component() {
    readonly envelope: ADSREnvelope = {
        level: 1,
        attackLevel: 0,
        attackTime: 0.1,
        decayTime: 0.1,
        sustainLevel: 0.1,
        releaseTime: 0.4
    };

    time = 0;
    playing = false;
    releaseTime = 0;
    pauseLevel = 0;
    paused = false;

    noteTime = 0;

    timer = Time.GAME;

    addNote(duration: number) {
        if (duration < 0) {
            this.noteTime = 0;
            // note off
            this.releaseTime = this.time;
        } else { // duration >= 0
            // note on
            this.releaseTime = -1;
            if (duration >= this.noteTime) {
                this.noteTime = duration;
            }
            this.playing = true;
        }
    }

}

export function updateSlowMotion() {
    const rootDeltaTime = Engine.current.time.delta;
    const components = getComponents(SlowMotion);
    for (let i = 0; i < components.length; ++i) {
        const sm = components[i];
        // const max = sm.duration + sm.envelope.releaseTime;
        let scale = sm.envelope.level;
        if (sm.paused) {
            scale = sm.pauseLevel;
        } else if (sm.playing) {
            sm.time += rootDeltaTime;
            if (sm.noteTime > 0) {
                sm.noteTime -= rootDeltaTime;
                if (sm.noteTime <= 0) {
                    sm.releaseTime = sm.time;
                }
            }
            scale = atADSR(sm.envelope, sm.time, sm.releaseTime);
            if (sm.releaseTime >= 0 && sm.time >= sm.releaseTime + sm.envelope.releaseTime) {
                sm.playing = false;
                sm.releaseTime = -1;
            }
        }
        sm.timer.scale = scale;
    }
}