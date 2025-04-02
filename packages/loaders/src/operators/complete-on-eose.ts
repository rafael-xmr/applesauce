import { Observable, OperatorFunction, takeWhile } from "rxjs";

/** Completes the observable when an EOSE message is received */
export function completeOnEOSE<T extends unknown>(): OperatorFunction<T | "EOSE", T> {
  return (source) => source.pipe(takeWhile((m) => m !== "EOSE", false)) as Observable<T>;
}
