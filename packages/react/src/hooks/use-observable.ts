import { useObservableState } from "observable-hooks";
import { EMPTY, type BehaviorSubject, type Observable } from "rxjs";

/** A thing wrapper around useObservableState that allows undefined */
export function useObservable<T extends unknown>(observable?: BehaviorSubject<T>): T;
export function useObservable<T extends unknown>(observable?: Observable<T>): T | undefined;
export function useObservable<T extends unknown>(observable?: Observable<T>): T | undefined {
  return useObservableState(observable ?? EMPTY);
}
