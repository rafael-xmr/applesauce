import Observable from "zen-observable";

/** Wraps an observable and makes it stateful */
export function stateful<T extends unknown>(observable: Observable<T>) {
  let value: T | undefined = undefined;
  let error: any;
  let complete = false;

  let subscription: ZenObservable.Subscription | undefined = undefined;
  let observers: ZenObservable.SubscriptionObserver<T>[] = [];

  return new Observable<T>((observer) => {
    // add observer to list
    observers.push(observer);

    // pass any cached values
    if (value) observer.next(value);
    if (error) observer.error(error);
    if (complete) observer.complete();

    // subscribe if not already
    if (!subscription) {
      subscription = observable.subscribe({
        next: (value) => {
          for (const observer of observers) observer.next(value);
        },
        error: (err) => {
          for (const observer of observers) observer.error(err);
        },
        complete: () => {
          complete = true;
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
          value = undefined;
          error = undefined;
          complete = false;
        }
      }
    };
  });
}
