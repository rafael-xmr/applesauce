import { filter, finalize, Observable, ReplaySubject, share, startWith, timer } from "rxjs";
import { Filter, NostrEvent } from "nostr-tools";
import hash_sum from "hash-sum";
import type { AddressPointer, EventPointer } from "nostr-tools/nip19";

import { EventStore } from "../event-store/event-store.js";

import * as Queries from "../queries/index.js";
import { getObservableValue } from "../observable/get-observable-value.js";

export type Query<T extends unknown> = {
  /** A unique key for this query. this is used to detect duplicate queries */
  key: string;
  /** The meat of the query, this should return an Observables that subscribes to the eventStore in some way */
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

  /** A directory of all active queries */
  queries = new Map<QueryConstructor<any, any[]>, Map<string, Observable<any>>>();

  /** How long a query should be kept "warm" while nothing is subscribed to it */
  queryKeepWarmTimeout = 60_000;

  /** Creates a cached query */
  createQuery<T extends unknown, Args extends Array<any>>(
    queryConstructor: QueryConstructor<T, Args>,
    ...args: Args
  ): Observable<T | undefined> {
    let observables = this.queries.get(queryConstructor);
    if (!observables) {
      observables = new Map();
      this.queries.set(queryConstructor, observables);
    }

    const key = hash_sum(args);
    let observable: Observable<T | undefined> | undefined = observables.get(key);
    if (!observable) {
      const cleanup = () => {
        if (observables.get(key) === observable) observables.delete(key);
      };

      observable = queryConstructor(...args)
        .run(this.store, this)
        .pipe(
          // always emit undefined so the observable is sync
          startWith(undefined),
          // remove the observable when its subscribed
          finalize(cleanup),
          // only create a single observable for all components
          share({ connector: () => new ReplaySubject(1), resetOnComplete: () => timer(this.queryKeepWarmTimeout) }),
        );

      // set debug fields
      Reflect.set(observable, "queryArgs", args);

      observables.set(key, observable);
    }

    return observable;
  }

  /** Creates a query and waits for the next value */
  async executeQuery<T extends unknown, Args extends Array<any>>(
    queryConstructor: QueryConstructor<T, Args>,
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

  /** Creates a query for a users blossom servers */
  blossomServers(pubkey: string) {
    return this.createQuery(Queries.UserBlossomServersQuery, pubkey);
  }

  /** Creates a ThreadQuery */
  thread(root: string | EventPointer | AddressPointer) {
    return this.createQuery(Queries.ThreadQuery, root);
  }
}

export { Queries };
