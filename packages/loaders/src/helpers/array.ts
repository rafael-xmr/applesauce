/** Does not preserve order */
export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/** split array into a set of arrays no larger than batchSize */
export function reduceToBatches<T>(arr: T[], batchSize: number): T[][] {
  const batches: T[][] = [];

  for (const value of arr) {
    if (batches.length === 0) {
      batches.push([value]);
      continue;
    }

    const current = batches[batches.length - 1];
    if (current.length <= batchSize) {
      current.push(value);
    } else batches.push([value]);
  }

  return batches;
}
