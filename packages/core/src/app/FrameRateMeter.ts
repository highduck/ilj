export class FrameRateMeter {
    // fps
    avg = 0;
    frame = 0;
    counter = 0;
    accum = 0;

    // fps constants
    avgPeriod = 1.0;
    maxFrames = 1000;

    update(deltaTime: number) {
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
