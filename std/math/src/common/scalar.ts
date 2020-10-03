export function lerp(begin: number, end: number, t: number): number {
    // a + (b - a) * t;
    return (1.0 - t) * begin + t * end;
}

// clamp to [0; 1] range
export function saturate(x: number): number {
    return x < 0 ? 0 : (x > 1 ? 1 : x);
}

export function clamp(x: number, min: number, max: number): number {
    return x < min ? min : (x > max ? max : x);
}
