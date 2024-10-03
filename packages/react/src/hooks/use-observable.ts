import { useState, useEffect } from "react";
import { isStateful } from "applesauce-core/observable";
import Observable from "zen-observable";

/** Subscribe to the value of an observable */
export function useObservable<T extends unknown>(observable?: Observable<T>): T | undefined {
  const [_, forceUpdate] = useState(0);
  const [value, update] = useState<T | undefined>(observable && isStateful(observable) ? observable.value : undefined);

  useEffect(() => {
    if (!observable) return;

    const s = observable.subscribe((v) => {
      update(v);
      forceUpdate(Math.random());
    });
    return () => s.unsubscribe();
  }, [observable]);

  return value;
}
