export class TimeLayer {
    dt = NaN;
    total = NaN;
    scale = NaN;

    constructor() {
        this.dt = 0.0;
        this.total = 0.0;
        this.scale = 1.0;
    }

    update(dt: number): number {
        const dt1 = dt * this.scale;
        this.dt = dt1;
        this.total += dt1;
        return dt1;
    }
}

const MAX_DELTA_TIME = 0.3;

export class Time {
    static readonly ROOT = new TimeLayer();
    static readonly GAME = new TimeLayer();
    static readonly HUD = new TimeLayer();
    static readonly UI = new TimeLayer();

    // system frame timestamp in seconds
    ts = NaN;
    raw = NaN; // better name..
    total = NaN;
    delta = NaN; // elapsed?

    // incremental frame index
    index = 0;

    constructor() {
        this.ts = 0.0;
        this.raw = 0.0;
        this.total = 0.0;
        this.delta = 0.0;
    }

    updateTime(timestamp: number) {
        this.raw = timestamp - this.ts;
        this.delta = Math.min(this.raw, MAX_DELTA_TIME);
        this.total += this.delta;
        this.ts = timestamp;
        ++this.index;
    }
}

export const updateTimers = (deltaTime: number) => {
    const root = Time.ROOT.update(deltaTime);
    Time.GAME.update(root);
    Time.HUD.update(root);
    Time.UI.update(root);
};