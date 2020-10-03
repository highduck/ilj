export const ceil = (x: number): number => {
  return ~~x === x ? x : x > 0 ? ~~x + 1 : ~~x;
};

export const floor = (x: number): number => {
  return ~~x === x ? x : x > 0 ? ~~x : ~~x - 1;
};

export const round = (x: number): number => {
  return (x + (x < 0 ? -0.5 : 0.5)) | 0;
};

export const abs = (x: number): number => {
  return x < 0 ? -x : x;
};

export const sign = (x: number): -1 | 0 | 1 => {
  return x ? (x < 0 ? -1 : 1) : 0;
};
