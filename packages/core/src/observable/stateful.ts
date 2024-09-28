import Observable from "zen-observable";

export type StatefulObservable<T> = Observable<T> & {
  _stateful?: true;
  value?: T;
  error?: Error;
  complete?: boolean;
};

/** Wraps an {@link Observable} and makes it stateful */
export function stateful<T extends unknown>(observable: Observable<T>, cleanup = false) {
  let subscription: ZenObservable.Subscription | undefined = undefined;
  let observers: ZenObservable.SubscriptionObserver<T>[] = [];

  const self: StatefulObservable<T> = new Observable<T>((observer) => {
    // add observer to list
    observers.push(observer);

    // pass any cached values
    if (self.value) observer.next(self.value);
    if (self.error) observer.error(self.error);
    if (self.complete) observer.complete();

    // subscribe if not already
    if (!subscription) {
      subscription = observable.subscribe({
        next: (v) => {
          self.value = v;
          for (const observer of observers) observer.next(v);
        },
        error: (err) => {
          self.error = err;
          for (const observer of observers) observer.error(err);
        },
        complete: () => {
          self.complete = true;
          for (const observer of observers) observer.complete();
        },
      });
    }

    return () => {
      let i = observers.indexOf(observer);
      if (i !== -1) {
        // remove observer from list
        observers.splice(i, 1);

        if (subscription && observers.length === 0) {
          subscription.unsubscribe();
          subscription = undefined;

          // reset cached values
          if (cleanup) {
            delete self.value;
            delete self.error;
            delete self.complete;
          }
        }
      }
    };
  });

  self._stateful = true;

  return self;
}

export function isStateful<T extends unknown>(
  observable: Observable<T> | StatefulObservable<T>,
): observable is StatefulObservable<T> {
  // @ts-expect-error
  return observable._stateful;
}
