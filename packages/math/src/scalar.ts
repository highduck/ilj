export function lerp(begin: number, end: number, t: number): number {
    // a + (b - a) * t;
    return (1 - t) * begin + t * end;
}

export function saturate(x: number): number {
    return x < 0 ? 0 : (x > 1 ? 1 : x);
}

export function clamp(x: number, min: number, max: number): number {
    return x < min ? min : (x > max ? max : x);
}

export function reach(current: number, target: number, step: number): number {
    if (current < target) {
        current += Math.abs(step);
        if (current > target) {
            current = target;
        }
    } else if (current > target) {
        current -= Math.abs(step);
        if (current < target) {
            current = target;
        }
    }
    return current;
}

export function reachDelta(current: number, target: number, delta_up: number, delta_down: number): number {
    if (current < target && delta_up > 0.0) {
        current += delta_up;
        if (current > target) {
            current = target;
        }
    } else if (current > target && delta_down < 0.0) {
        current += delta_down;
        if (current < target) {
            current = target;
        }
    }
    return current;
}

// normalized parameter sin/cos: (0 ... 1) => (-1 ~ 1 ~ -1)
export function normSin(x: number) {
    return Math.sin(2 * Math.PI * x);
}

export function normCos(x: number) {
    return Math.cos(2 * Math.PI * x);
}

// unit sin/cos: (0 ... 1) => (0 ~ 1 ~ 0)
export function unitSin(x: number) {
    return (0.5 + 0.5 * normSin(x));
}

export function unitCos(x: number) {
    return (0.5 + 0.5 * normCos(x));
}


export function integrateExp(k: number, dt: number, fps = 60): number {
    const c = Math.log(1 - k) * fps;
    return 1 - Math.exp(c * dt);
}

export function scalarReduce(x: number, period: number, offset: number): number {
    period = Math.abs(period);
    return x - period * Math.floor((x - offset) / period) - offset;
}


// maybe to easing/animation
export function oscSine(time: number, min: number, max: number, frequency: number) {
    const t = 0.5 + 0.5 * Math.sin(Math.PI * 2 * (frequency * time - 0.25));
    return min + (max - min) * t;
}

export function oscCircle(time: number, min: number, max: number, frequency: number) {
    const x = 2 * scalarReduce(time * frequency, 1, 0) - 1;
    const t = Math.sqrt(1.0 - x * x);
    return min + (max - min) * t;
}