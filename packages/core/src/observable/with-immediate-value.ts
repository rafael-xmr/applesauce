import { Observable, OperatorFunction } from "rxjs";

/** if a synchronous value is not emitted, default is emitted */
export function withImmediateValueOrDefault<Value, Default extends unknown = unknown>(
  defaultValue: Default,
): OperatorFunction<Value, Value | Default> {
  return (source) =>
    new Observable((observer) => {
      let seen = false;

      const sub = source.subscribe({
        next: (v) => {
          seen = true;
          observer.next(v);
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });

      // if a value is not emitted sync, emit default
      if (!seen) observer.next(defaultValue);

      return sub;
    });
}
