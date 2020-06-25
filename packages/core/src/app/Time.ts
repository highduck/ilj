export class TimeLayer {
    dt = 0;
    total = 0;
    scale = 1;

    update(dt: number) {
        dt *= this.scale;
        this.dt = dt;
        this.total += dt;
    }
}

class FrameRateMeter {
    // fps
    avg = 0;
    frame = 0;
    counter = 0;
    accum = 0;

    // fps constants
    avgPeriod = 1.0;
    maxFrames = 1000;

    calcFPS(deltaTime: number) {
        // estimate average FPS for some period
        this.counter += 1.0;
        this.accum += deltaTime;
        if (this.accum >= this.avgPeriod) {
            this.avg = this.counter / this.avgPeriod;
            this.accum -= this.avgPeriod;
            this.counter = 0;
        }

        // update immediate frame FPS count
        this.frame = deltaTime > (1.0 / this.maxFrames) ? (1.0 / deltaTime) : this.maxFrames;
    }
}

export class Time {
    // system frame timestamp in seconds
    ts = 0;
    index = 0;
    raw = 0; // better name..

    total = 0;
    delta = 0; // elapsed?

    // user settings
    scale = 1;
    maxDelta = 0.3;

    static readonly ROOT = new TimeLayer();
    static readonly GAME = new TimeLayer();
    static readonly HUD = new TimeLayer();
    static readonly UI = new TimeLayer();

    readonly fps = new FrameRateMeter();

    updateTime(timestamp: number) {
        ++this.index;
        this.raw = timestamp - this.ts;
        this.delta = Math.min(this.raw, this.maxDelta) * this.scale;
        this.total += this.delta;
        this.ts = timestamp;

        if (process.env.NODE_ENV === 'development') {
            this.fps.calcFPS(this.raw);
        }

        Time.ROOT.update(this.delta);
        Time.GAME.update(Time.ROOT.dt);
        Time.HUD.update(Time.ROOT.dt);
        Time.UI.update(Time.ROOT.dt);
    }
}