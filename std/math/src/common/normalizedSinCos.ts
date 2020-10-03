
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
