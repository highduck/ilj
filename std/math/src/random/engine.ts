export interface RandomEngine {
  readonly max: number;
  seed: number;

  next(): number;
}
