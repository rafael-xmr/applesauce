import { BehaviorSubject, Observable } from "rxjs";
import { Filter, NostrEvent } from "nostr-tools";

import { EventStore } from "../event-store/event-store.js";
import { LRU } from "../helpers/lru.js";

import * as Queries from "../queries/index.js";
import { AddressPointer, EventPointer } from "nostr-tools/nip19";
import { shareLatestValue } from "../observable/share-latest-value.js";

export type Query<T extends unknown> = {
  /**
   * A unique key for this query. this is used to detect duplicate queries
   */
  key: string;
  /** The args array this query was created with. This is mostly for debugging */
  args?: Array<any>;
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
    this.store = store;
  }

  queries = new LRU<Query<any>>();
  observables = new WeakMap<Query<any>, BehaviorSubject<any> | Observable<any>>();

  /** Creates a cached query */
  runQuery<T extends unknown, Args extends Array<any>>(
    queryConstructor: (...args: Args) => { key: string; run: (events: EventStore, store: QueryStore) => Observable<T> },
  ): (...args: Args) => Observable<T> {
    return (...args: Args) => {
      const tempQuery = queryConstructor(...args);
      const key = `${queryConstructor.name}|${tempQuery.key}`;

      let query = this.queries.get(key);
      if (!query) {
        query = tempQuery;
        this.queries.set(key, tempQuery);
      }

      if (!this.observables.has(query)) {
        query.args = args;
        const observable = query.run(this.store, this).pipe(shareLatestValue()) as Observable<T>;
        this.observables.set(query, observable);
        return observable;
      }

      return this.observables.get(query)! as Observable<T>;
    };
  }

  /** Returns a single event */
  event(id: string) {
    return this.runQuery(Queries.SingleEventQuery)(id);
  }

  /** Returns a single event */
  events(ids: string[]) {
    return this.runQuery(Queries.MultipleEventsQuery)(ids);
  }

  /** Returns the latest version of a replaceable event */
  replaceable(kind: number, pubkey: string, d?: string) {
    return this.runQuery(Queries.ReplaceableQuery)(kind, pubkey, d);
  }

  /** Returns a directory of events by their UID */
  replaceableSet(pointers: { kind: number; pubkey: string; identifier?: string }[]) {
    return this.runQuery(Queries.ReplaceableSetQuery)(pointers);
  }

  /** Returns an array of events that match the filter */
  timeline(filters: Filter | Filter[], keepOldVersions?: boolean) {
    return this.runQuery(Queries.TimelineQuery)(filters, keepOldVersions);
  }

  /** Returns the parsed profile (0) for a pubkey */
  profile(pubkey: string) {
    return this.runQuery(Queries.ProfileQuery)(pubkey);
  }

  /** Returns all reactions for an event (supports replaceable events) */
  reactions(event: NostrEvent) {
    return this.runQuery(Queries.ReactionsQuery)(event);
  }

  /** Returns the parsed relay list (10002) for the pubkey */
  mailboxes(pubkey: string) {
    return this.runQuery(Queries.MailboxesQuery)(pubkey);
  }

  thread(root: string | EventPointer | AddressPointer) {
    return this.runQuery(Queries.ThreadQuery)(root);
  }
}

export { Queries };
