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

export function integrateExp(k: number, dt: number, fps = 60): number {
  const c = Math.log(1 - k) * fps;
  return 1 - Math.exp(c * dt);
}
