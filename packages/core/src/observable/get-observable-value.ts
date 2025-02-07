import { BehaviorSubject, firstValueFrom, Observable } from "rxjs";

/** Subscribes and returns the observables current or next value */
export function getObservableValue<T>(observable: Observable<T>) {
  if (observable instanceof BehaviorSubject) return observable.value as T;
  if (Reflect.has(observable, "value")) return Reflect.get(observable, "value") as T;
  return firstValueFrom(observable);
}
