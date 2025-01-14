import { Filter, NostrEvent } from "nostr-tools";
import { Observable, OperatorFunction, Subject, Subscribable } from "rxjs";

export type CacheRequest = (filters: Filter[]) => Observable<NostrEvent>;

export interface ILoader<T, R> extends Subscribable<R> {
  next: (value: T) => void;
  pipe: Observable<R>["pipe"];
}

/** Base loader class */
export class Loader<T, R> implements ILoader<T, R> {
  protected subject = new Subject<T>();
  protected observable: Observable<R>;
  pipe: Observable<R>["pipe"];
  subscribe: Observable<R>["subscribe"];

  constructor(transform: OperatorFunction<T, R>) {
    this.observable = this.subject.pipe(transform);

    // copy pipe function
    this.pipe = this.observable.pipe.bind(this.observable);
    this.subscribe = this.observable.subscribe.bind(this.observable);
  }

  next(value: T) {
    this.subject.next(value);
  }
}
