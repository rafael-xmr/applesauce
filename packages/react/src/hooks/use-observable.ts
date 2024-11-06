import { useState, useEffect } from "react";
import { type BehaviorSubject, type Observable } from "rxjs";

/** Subscribe to the value of an observable */
export function useObservable<T extends unknown>(observable?: BehaviorSubject<T>): T;
export function useObservable<T extends unknown>(observable?: Observable<T>): T | undefined;
export function useObservable<T extends unknown>(observable?: Observable<T>): T | undefined {
  const observableValue =
    observable && Reflect.has(observable, "value") ? (Reflect.get(observable, "value") as T | undefined) : undefined;
  const [value, setValue] = useState(observableValue);

  useEffect(() => {
    const sub = observable?.subscribe((v) => setValue(v));
    return () => sub?.unsubscribe();
  }, [observable]);

  return observableValue || value;
}
