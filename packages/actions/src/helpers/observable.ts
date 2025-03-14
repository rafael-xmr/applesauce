import { Observable } from "rxjs";

/** Subscribes to an observable, send all the values to a method and unsubscribes when complete */
export function play<T extends unknown = unknown>(stream: Observable<T>, method: (value: T) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const sub = stream.subscribe({
      next: (v) => {
        try {
          method(v);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error),
      complete: () => {
        sub.unsubscribe();
        resolve();
      },
    });
  });
}
