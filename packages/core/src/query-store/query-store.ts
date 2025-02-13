import { filter, Observable, ReplaySubject, share, startWith, timer } from "rxjs";
import { Filter, NostrEvent } from "nostr-tools";

import { EventStore } from "../event-store/event-store.js";
import { LRU } from "../helpers/lru.js";

import * as Queries from "../queries/index.js";
import { AddressPointer, EventPointer } from "nostr-tools/nip19";
import { getObservableValue } from "../observable/get-observable-value.js";

export type Query<T extends unknown> = {
  /**
   * A unique key for this query. this is used to detect duplicate queries
   */
  key: string;
  /**
   * The meat of the query, this should return an Observables that subscribes to the eventStore in some way
   */
  run: (events: EventStore, store: QueryStore) => Observable<T>;
};
export type QueryConstructor<T extends unknown, Args extends Array<any>> = (...args: Args) => Query<T>;

export class QueryStore {
  static Queries = Queries;

  store: EventStore;
  constructor(store: EventStore) {
    if (!store) throw new Error("EventStore required");
    this.store = store;
  }

  queries = new LRU<Query<any>>();
  observables = new WeakMap<Query<any>, Observable<any>>();

  /** Creates a cached query */
  createQuery<T extends unknown, Args extends Array<any>>(
    queryConstructor: (...args: Args) => { key: string; run: (events: EventStore, store: QueryStore) => Observable<T> },
    ...args: Args
  ): Observable<T | undefined> {
    const tempQuery = queryConstructor(...args);
    const key = queryConstructor.name + "|" + tempQuery.key;

    let query = this.queries.get(key) as Query<T> | undefined;
    if (!query) {
      query = tempQuery;
      this.queries.set(key, tempQuery);
    }

    let observable: Observable<T | undefined> | undefined = this.observables.get(query);
    if (!observable) {
      const observable = query
        .run(this.store, this)
        .pipe(
          startWith(undefined),
          share({ connector: () => new ReplaySubject(1), resetOnComplete: () => timer(60_000) }),
        );

      this.observables.set(query, observable);
      return observable;
    }

    return observable;
  }

  /** Creates a query and waits for the next value */
  async executeQuery<T extends unknown, Args extends Array<any>>(
    queryConstructor: (...args: Args) => { key: string; run: (events: EventStore, store: QueryStore) => Observable<T> },
    ...args: Args
  ): Promise<T> {
    const query = this.createQuery(queryConstructor, ...args).pipe(filter((v) => v !== undefined));

    return getObservableValue(query);
  }

  /** Creates a SingleEventQuery */
  event(id: string) {
    return this.createQuery(Queries.SingleEventQuery, id);
  }

  /** Creates a MultipleEventsQuery */
  events(ids: string[]) {
    return this.createQuery(Queries.MultipleEventsQuery, ids);
  }

  /** Creates a ReplaceableQuery */
  replaceable(kind: number, pubkey: string, d?: string) {
    return this.createQuery(Queries.ReplaceableQuery, kind, pubkey, d);
  }

  /** Creates a ReplaceableSetQuery */
  replaceableSet(pointers: { kind: number; pubkey: string; identifier?: string }[]) {
    return this.createQuery(Queries.ReplaceableSetQuery, pointers);
  }

  /** Creates a TimelineQuery */
  timeline(filters: Filter | Filter[], keepOldVersions?: boolean) {
    return this.createQuery(Queries.TimelineQuery, filters, keepOldVersions);
  }

  /** Creates a ProfileQuery */
  profile(pubkey: string) {
    return this.createQuery(Queries.ProfileQuery, pubkey);
  }

  /** Creates a ReactionsQuery */
  reactions(event: NostrEvent) {
    return this.createQuery(Queries.ReactionsQuery, event);
  }

  /** Creates a MailboxesQuery */
  mailboxes(pubkey: string) {
    return this.createQuery(Queries.MailboxesQuery, pubkey);
  }

  /** Creates a ThreadQuery */
  thread(root: string | EventPointer | AddressPointer) {
    return this.createQuery(Queries.ThreadQuery, root);
  }
}

export { Queries };
