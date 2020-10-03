export class Timer {

    static now(): number {
        return performance.now() / 1000.0;
    }

    constructor(public current: number = Timer.now()) {
    }

    reset(now: number = Timer.now()): number {
        const delta = now - this.current;
        this.current = now;
        return delta;
    }

    delta(now: number = Timer.now()): number {
        return now - this.current;
    }
}
