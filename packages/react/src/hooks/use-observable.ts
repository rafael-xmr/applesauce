import { useState, useEffect } from "react";
import { BehaviorSubject, Observable } from "rxjs";

/** Subscribe to the value of an observable */
export function useObservable<T extends unknown>(observable?: BehaviorSubject<T>): T;
export function useObservable<T extends unknown>(observable?: Observable<T>): T | undefined;
export function useObservable<T extends unknown>(observable?: Observable<T>): T | undefined {
  const [_count, update] = useState(0);
  const [value, setValue] = useState(observable instanceof BehaviorSubject ? observable.value : undefined);

  useEffect(() => {
    const sub = observable?.subscribe((v) => {
      setValue(v);
      update((c) => c + 1);
    });

    return () => sub?.unsubscribe();
  }, [observable]);

  return value;
}
