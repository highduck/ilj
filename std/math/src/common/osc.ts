// maybe to easing/animation?
export function scalarReduce(x: number, period: number, offset: number): number {
  period = Math.abs(period);
  return x - period * Math.floor((x - offset) / period) - offset;
}

export function oscSine(time: number, min: number, max: number, frequency: number) {
  const t = 0.5 + 0.5 * Math.sin(Math.PI * 2 * (frequency * time - 0.25));
  return min + (max - min) * t;
}

export function oscCircle(time: number, min: number, max: number, frequency: number) {
  const x = 2 * scalarReduce(time * frequency, 1, 0) - 1;
  const t = Math.sqrt(1.0 - x * x);
  return min + (max - min) * t;
}
