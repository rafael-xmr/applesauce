import { BehaviorSubject, Observable } from "rxjs";
import { Filter, NostrEvent } from "nostr-tools";

import { EventStore } from "../event-store/event-store.js";
import { LRU } from "../helpers/lru.js";

import * as Queries from "../queries/index.js";
import { AddressPointer, EventPointer } from "nostr-tools/nip19";
import { shareLatestValue } from "../observable/share-latest-value.js";

export type Query<T extends unknown> = { key: string; run: (events: EventStore, store: QueryStore) => Observable<T> };
export type QueryConstructor<T extends unknown, Args extends Array<any>> = (...args: Args) => Query<T>;

export class QueryStore {
  static Queries = Queries;

  store: EventStore;
  constructor(store: EventStore) {
    this.store = store;
  }

  queries = new LRU<BehaviorSubject<any> | Observable<any>>();

  /** Creates a cached query */
  runQuery<T extends unknown, Args extends Array<any>>(
    queryConstructor: (...args: Args) => { key: string; run: (events: EventStore, store: QueryStore) => Observable<T> },
  ) {
    return (...args: Args) => {
      const query = queryConstructor(...args);
      const key = `${queryConstructor.name}|${query.key}`;

      if (!this.queries.has(key)) {
        const observable = query.run(this.store, this).pipe(shareLatestValue()) as Observable<T>;

        this.queries.set(key, observable);
        return observable;
      }

      return this.queries.get(key)! as Observable<T>;
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
