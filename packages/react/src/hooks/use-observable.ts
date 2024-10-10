import { useState, useEffect, useRef } from "react";
import { isStateful } from "applesauce-core/observable";
import Observable from "zen-observable";

/** Subscribe to the value of an observable */
export function useObservable<T extends unknown>(observable?: Observable<T>): T | undefined {
  const [count, update] = useState(0);
  const init = useRef(true);
  const value = useRef<T | undefined>(observable && isStateful(observable) ? observable.value : undefined);

  const prev = useRef(observable);
  const sub = useRef<ZenObservable.Subscription>();

  // This intentionally does not use useEffect
  // because we want the value to be returned on the first render
  if (!sub.current || prev.current !== observable) {
    prev.current = observable;
    if (sub.current) sub.current.unsubscribe();

    sub.current = observable?.subscribe((v) => {
      value.current = v;

      // only explicitly update if its not the first render
      if (!init.current) update(count + 1);
      init.current = false;
    });
  }

  // unsubscribe when unmount
  useEffect(() => {
    return () => {
      if (sub.current) sub.current.unsubscribe();
    };
  }, []);

  return value.current;
}
