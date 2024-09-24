import Observable from "zen-observable";

export function throttle<T>(source: Observable<T>, interval: number): Observable<T> {
  return new Observable<T>((observer) => {
    let lastEmissionTime = 0;
    let subscription = source.subscribe({
      next(value) {
        const currentTime = Date.now();
        if (currentTime - lastEmissionTime >= interval) {
          lastEmissionTime = currentTime;
          observer.next(value);
        }
      },
      error(err) {
        observer.error(err);
      },
      complete() {
        observer.complete();
      },
    });

    return () => subscription.unsubscribe();
  });
}
