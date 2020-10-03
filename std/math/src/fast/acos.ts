const ACOS_TABLE_SIZE = 0x10001;
const ACOS_TABLE_MAX = 0x10000; // include 0 symmetric
const INV_ACOS_STEP = 2.0 / ACOS_TABLE_MAX;
const ACOS_STEP = ACOS_TABLE_MAX >>> 1;
const ACOS_TABLE = new Float32Array(ACOS_TABLE_SIZE);

for (let i = 0; i < ACOS_TABLE_SIZE; ++i) {
  ACOS_TABLE[i] = Math.acos(-1.0 + INV_ACOS_STEP * i);
}

export const acos = (cos: number): number =>
  cos >= -1.0 && cos <= 1.0 ? ACOS_TABLE[((1.0 + cos) * ACOS_STEP) | 0] : NaN;
