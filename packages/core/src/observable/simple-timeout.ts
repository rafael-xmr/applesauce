import { MonoTypeOperatorFunction, throwError, timeout } from "rxjs";

export class TimeoutError extends Error {}

export function simpleTimeout<T extends unknown>(first: number, message?: string): MonoTypeOperatorFunction<T> {
  return timeout({ first, with: () => throwError(() => new TimeoutError(message ?? "Timeout")) });
}
