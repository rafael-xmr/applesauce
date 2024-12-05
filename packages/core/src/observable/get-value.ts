import { BehaviorSubject, Observable } from "rxjs";

/** Subscribes and returns the observables current or next value */
export function getValue<T>(observable: Observable<T>) {
  if (observable instanceof BehaviorSubject) return observable.value as T;
  if (Reflect.has(observable, "value")) return Reflect.get(observable, "value") as T;

  return new Promise<T>((res) => {
    const sub = observable.subscribe((v) => {
      res(v);
      sub.unsubscribe();
    });
  });
}
