import { Filter, NostrEvent } from "nostr-tools";
import { InteropObservable, Observable, OperatorFunction, share, Subject, Subscribable } from "rxjs";

export type RelayFilterMap<T = Filter> = {
  [relay: string]: T[];
};

export type CacheRequest = (filters: Filter[]) => Observable<NostrEvent>;

export interface ILoader<T, R> extends Subscribable<R> {
  next: (value: T) => void;
  pipe: Observable<R>["pipe"];
}

/** Base loader class */
export class Loader<Input, Output> implements ILoader<Input, Output>, InteropObservable<Output> {
  protected subject = new Subject<Input>();

  observable: Observable<Output>;
  pipe: Observable<Output>["pipe"];
  subscribe: Observable<Output>["subscribe"];

  constructor(transform: OperatorFunction<Input, Output>) {
    this.observable = this.subject.pipe(
      transform,
      // only create a single instance of the transformer
      share(),
    );

    // copy pipe function
    this.pipe = this.observable.pipe.bind(this.observable);
    this.subscribe = this.observable.subscribe.bind(this.observable);
  }

  next(value: Input) {
    this.subject.next(value);
  }

  [Symbol.observable]() {
    return this.observable;
  }
}
