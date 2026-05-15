// Iterative min/max that avoids the spread-operator stack-overflow that
// Math.min(...arr) / Math.max(...arr) hit at roughly 100k–200k elements in V8.

export function iterMin(values: ArrayLike<number>): number {
  let min = Infinity;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v < min) min = v;
  }
  return min;
}

export function iterMax(values: ArrayLike<number>): number {
  let max = -Infinity;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v > max) max = v;
  }
  return max;
}

/** One-pass min and max. */
export function iterMinMax(values: ArrayLike<number>): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max };
}
