// const assert = (cond: unknown, message: string) => {
//   if (!cond) throw new Error(message);
// };
//
// const isSMI = (x: number) => Number.isInteger(x) && x >= -(2 ** 30) && x < 2 ** 30;

export const absSMI = (x: number): number => {
  // TODO: runtime type-checking
  /* process.env.DEBUG && assert(isSMI(x), 'not SMI'); */
  return x < 0 ? -x : x;
};

export const signSMI = (x: number): -1 | 0 | 1 => {
  // TODO: runtime type-checking
  /* process.env.DEBUG && assert(isSMI(x), 'not SMI'); */
  return x ? (x < 0 ? -1 : 1) : 0;
};
