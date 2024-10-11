import Observable from "zen-observable";
import { isStateful } from "./stateful.js";

export function getValue<T>(observable: Observable<T>) {
  if (isStateful(observable) && observable.value !== undefined) return observable.value as T;

  return new Promise<T>((res) => {
    const sub = observable.subscribe((v) => {
      res(v);
      sub.unsubscribe();
    });
  });
}
