const FPS_AVG_PERIOD = 1.0;

export class FPSMeter {
    avg = 0.0;
    accum = 0.0;
    counter = 0;

    calcFPS(deltaTime: number): void {
        // estimate average FPS for some period
        ++this.counter;
        this.accum += deltaTime;
        if (this.accum >= FPS_AVG_PERIOD) {
            this.avg = this.counter / FPS_AVG_PERIOD;
            this.accum -= FPS_AVG_PERIOD;
            this.counter = 0;
        }
    }
}