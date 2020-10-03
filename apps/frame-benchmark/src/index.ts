import { abs, absSMI, acos, ceil, cos, floor, round, sign, signSMI, sin } from '@highduck/math';

let acc = NaN;
const N = 1000000;

function run1_cos() {
  let a = 0.0;
  for (let i = 0; i < N; ++i) {
    a += cos(i);
  }
  return a;
}

function run1_sin() {
  let a = 0.0;
  for (let i = 0; i < N; ++i) {
    a += sin(i);
  }
  return a;
}

function run1_acos() {
  let a = 0.0;
  for (let i = 0; i < N; ++i) {
    a += acos(i);
  }
  return a;
}

function run1_sin_cos() {
  let a = 0.0;
  for (let i = 0; i < N; ++i) {
    a += sin(i) + cos(i);
  }
  return a;
}

function sign_Math() {
  let a = 0.0;
  for (let i = 0; i < N; ++i) {
    a += Math.sign(i);
  }
  return a;
}

function sign_fast() {
  let a = 0.0;
  for (let i = 0; i < N; ++i) {
    a += sign(i);
  }
  return a;
}

function sign_smi() {
  let a = 0.0;
  for (let i = 0; i < N; ++i) {
    a += signSMI(i);
  }
  return a;
}

function ceil_Math() {
  let a = 0.0;
  for (let i = 0; i < N; ++i) {
    a += Math.ceil(i);
  }
  return a;
}

function ceil_fast() {
  let a = 0.0;
  for (let i = 0; i < N; ++i) {
    a += ceil(i);
  }
  return a;
}

function floor_Math() {
  let a = 0.0;
  for (let i = 0; i < N; ++i) {
    a += Math.floor(i);
  }
  return a;
}

function floor_fast() {
  let a = 0.0;
  for (let i = 0; i < N; ++i) {
    a += floor(i);
  }
  return a;
}

function round_Math() {
  let a = 0.0;
  for (let i = 0; i < N; ++i) {
    a += Math.round(i);
  }
  return a;
}

function round_fast() {
  let a = 0.0;
  for (let i = 0; i < N; ++i) {
    a += round(i);
  }
  return a;
}

function abs_Math() {
  let a = 0.0;
  for (let i = 0; i < N; ++i) {
    a += Math.abs(i);
  }
  return a;
}

function abs_fast() {
  let a = 0.0;
  for (let i = 0; i < N; ++i) {
    a += abs(i);
  }
  return a;
}

function abs_smi() {
  let a = 0.0;
  for (let i = 0; i < N; ++i) {
    a += absSMI(i);
  }
  return a;
}

function run2_cos() {
  let a = 0.0;
  for (let i = 0; i < N; ++i) {
    a += Math.cos(i);
  }
  return a;
}

function run2_sin() {
  let a = 0.0;
  for (let i = 0; i < N; ++i) {
    a += Math.sin(i);
  }
  return a;
}

function run2_acos() {
  let a = 0.0;
  for (let i = 0; i < N; ++i) {
    a += Math.acos(i);
  }
  return a;
}

type Dict<T> = { [key: string]: T };

const intervals: Dict<Dict<number>> = {};
const cache: Dict<number> = {};

function run(id: string, variant: string, fn: () => number) {
  const t = performance.now();
  acc = fn();
  let m = intervals[id];
  if (!m) {
    m = {};
    intervals[id] = m;
  }
  m[variant] = (performance.now() - t) | 0;
  cache[variant] = acc;
}

function test1() {
  run('sin', 'fast', run1_sin);
  run('cos', 'fast', run1_cos);
  run('acos', 'fast', run1_acos);
  run('sin-cos', 'fast', run1_sin_cos);
}

function test2() {
  run('sin', 'Math', run2_sin);
  run('cos', 'Math', run2_cos);
  run('acos', 'Math', run2_acos);
}

function createContext2D() {
  const canvas = document.createElement('canvas');
  document.body.append(canvas);
  canvas.width = (window.innerWidth * window.devicePixelRatio) | 0;
  canvas.height = (window.innerHeight * window.devicePixelRatio) | 0;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error();
  ctx.font = 'bold 24px serif';
  return ctx;
}

const ctx = createContext2D();

const colors: Dict<string> = {
  Math: '#f00',
  smi: '#0f0',
  fast: '#00f',
};

function loop(ts: number) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  test1();
  test2();
  run('sign', 'fast', sign_fast);
  run('sign', 'smi', sign_smi);
  run('sign', 'Math', sign_Math);

  run('abs', 'fast', abs_fast);
  run('abs', 'smi', abs_smi);
  run('abs', 'Math', abs_Math);

  run('ceil', 'fast', ceil_fast);
  run('ceil', 'Math', ceil_Math);
  run('floor', 'fast', floor_fast);
  run('floor', 'Math', floor_Math);
  run('round', 'fast', round_fast);
  run('round', 'Math', round_Math);

  ctx.fillText(N.toString(), 0, 20, 200);
  let y = 40;
  for (const k of Object.keys(intervals)) {
    const variantsMap = intervals[k];
    ctx.fillText(k, 0, y + 20, 200);
    //ctx.fillText(t, 600, y + 20, 200);
    let yOffset = 0.0;
    for (const variant of Object.keys(variantsMap)) {
      const t = variantsMap[variant];
      ctx.fillStyle = colors[variant];
      ctx.fillRect(200, y + 10 + yOffset, t * 10, 10);
      yOffset += 10;
    }
    ctx.fillStyle = '#000';
    y += 40;
  }

  for (let i = 0; i < 2.0 * Math.PI; i += 0.1) {
    const a = i + 0.1 * (ts / 1000.0);
    ctx.fillRect(200 + 200 * cos(a), 600 + 200 * sin(a), 4, 4);
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
