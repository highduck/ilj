export const lerp = (begin: number, end: number, t: number): number =>
    // a + (b - a) * t;
    (1 - t) * begin + t * end;

export const saturate = (x: number): number =>
    x < 0 ? 0 : (x > 1 ? 1 : x);

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
    if (current < target && delta_up > 0) {
        current += delta_up;
        if (current > target) {
            current = target;
        }
    } else if (current > target && delta_down < 0) {
        current += delta_down;
        if (current < target) {
            current = target;
        }
    }
    return current;
}

// normalized parameter sin/cos: (0 ... 1) => (-1 ~ 1 ~ -1)
export const normSin = (x: number) => Math.sin(2 * Math.PI * x);
export const normCos = (x: number) => Math.cos(2 * Math.PI * x);

// unit sin/cos: (0 ... 1) => (0 ~ 1 ~ 0)
export const unitSin = (x: number) => (0.5 + 0.5 * normSin(x));
export const unitCos = (x: number) => (0.5 + 0.5 * normCos(x));


export function integrateExp(k: number, dt: number, fps = 60): number {
    const c = Math.log(1 - k) * fps;
    return 1 - Math.exp(c * dt);
}