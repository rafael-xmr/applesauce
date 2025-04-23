import { filter, OperatorFunction } from "rxjs";

/** Filters out undefined and null values */
export function defined<T>(): OperatorFunction<T | undefined, NonNullable<T>> {
  return (source) => source.pipe(filter((v) => v !== undefined && v !== null));
}
