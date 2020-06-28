export class TimeStep {
    dt = 0; // time step
    inv_dt = 0; // inverse time step (0 if dt == 0)
    velocityIterations = 0;
    positionIterations = 0;
    warmStarting = false;
    blockSolve = true;

    // timestep ratio for variable timestep
    inv_dt0 = 0.0;
    dtRatio = 1; // dt * inv_dt0
    
    reset(dt: number) {
        if (this.dt > 0.0) {
            this.inv_dt0 = this.inv_dt;
        }
        this.dt = dt;
        this.inv_dt = dt == 0 ? 0 : 1 / dt;
        this.dtRatio = dt * this.inv_dt0;
    }
}