import { useState, useEffect } from "react";
import { type BehaviorSubject, type Observable } from "rxjs";

export function getCurrentValue<T extends unknown>(observable: BehaviorSubject<T>): T;
export function getCurrentValue<T extends unknown>(observable: Observable<T>): T | undefined;
export function getCurrentValue<T extends unknown>(observable: Observable<T>): T | undefined {
  if (Reflect.has(observable, "value")) return Reflect.get(observable, "value") as T | undefined;
  return undefined;
}

/** Subscribe to the value of an observable */
export function useObservable<T extends unknown>(observable?: BehaviorSubject<T>): T;
export function useObservable<T extends unknown>(observable?: Observable<T>): T | undefined;
export function useObservable<T extends unknown>(observable?: Observable<T>): T | undefined {
  const current = observable && getCurrentValue(observable);
  const [_count, setCount] = useState(0);
  const [value, setValue] = useState(current);

  useEffect(() => {
    // Reset the state, the method passed to subscribe will NOT always be called
    setValue(observable && getCurrentValue(observable));

    const sub = observable?.subscribe((v) => {
      setValue(v);
      setCount((c) => c + 1);
    });
    return () => sub?.unsubscribe();
  }, [observable, setValue, setCount]);

  return current || value;
}
