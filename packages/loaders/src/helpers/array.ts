/** Does not preserve order */
export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
