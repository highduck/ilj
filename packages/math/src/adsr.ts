import {lerp} from './scalar';

// Attack, Decay, Sustain, Release
export interface ADSREnvelope {
    level: number; // 0
    attackTime: number; // 0.01;
    attackLevel: number; // 1;
    // from attack to sustain
    decayTime: number; //0.3;
    sustainLevel: number; //0.5;
    releaseTime: number;// 0.5;
}

export function atADSR(envelope: ADSREnvelope, time: number, releasedAt: number): number {
    if (releasedAt >= 0 && time >= releasedAt) {
        const tt = time - releasedAt;
        if (tt < envelope.releaseTime) {
            return lerp(envelope.sustainLevel, envelope.level, (time - releasedAt) / envelope.releaseTime);
        }
        return envelope.level;
    }
    let t = time;
    if (t < envelope.attackTime) {
        return lerp(envelope.level, envelope.attackLevel, t / envelope.attackTime);
    }
    t -= envelope.attackTime;
    if (t < envelope.decayTime) {
        return lerp(envelope.attackLevel, envelope.sustainLevel, t / envelope.decayTime);
    }
    return envelope.sustainLevel;
}