export class FrameTime {
    // system frame timestamp in seconds
    ts = 0;

    total = 0;
    index = 0;
    delta = 0; // elapsed?
    raw = 0; // better name..

    // user settings
    scale = 1;
    maxDelta = 0.3;

    update(ts: number) {
        ++this.index;
        this.raw = ts - this.ts;
        this.delta = Math.min(this.raw, this.maxDelta) * this.scale;
        this.total += this.delta;
        this.ts = ts;
    }
}
