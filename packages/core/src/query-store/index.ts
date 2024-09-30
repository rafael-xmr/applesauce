import Observable from "zen-observable";
import { Filter, NostrEvent } from "nostr-tools";

import { EventStore } from "../event-store/event-store.js";
import { stateful } from "../observable/stateful.js";
import { LRU } from "../utils/lru.js";

import * as Queries from "../queries/index.js";
import { AddressPointer, EventPointer } from "nostr-tools/nip19";

export type Query<T extends unknown> = { key: string; run: (events: EventStore, store: QueryStore) => Observable<T> };
export type QueryConstructor<T extends unknown, Args extends Array<any>> = (...args: Args) => Query<T>;

export class QueryStore {
  static Queries = Queries;

  store: EventStore;
  constructor(store: EventStore) {
    this.store = store;
  }

  queries = new LRU<Observable<any>>();

  /** Creates a cached query */
  runQuery<T extends unknown, Args extends Array<any>>(
    queryConstructor: (...args: Args) => { key: string; run: (events: EventStore, store: QueryStore) => Observable<T> },
  ) {
    return (...args: Args) => {
      const query = queryConstructor(...args);
      const key = `${queryConstructor.name}|${query.key}`;

      if (!this.queries.has(key)) {
        const observable = stateful(query.run(this.store, this));
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

  /** Returns the latest version of a replaceable event */
  replaceable(kind: number, pubkey: string, d?: string) {
    return this.runQuery(Queries.ReplaceableQuery)(kind, pubkey, d);
  }

  /** Returns an array of events that match the filter */
  timeline(filters: Filter | Filter[]) {
    return this.runQuery(Queries.TimelineQuery)(filters);
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

  /** Returns the parsed mute list for the pubkey */
  mute(pubkey: string) {
    return this.runQuery(Queries.UserMuteQuery)(pubkey);
  }

  thread(root: string | EventPointer | AddressPointer) {
    return this.runQuery(Queries.ThreadQuery)(root);
  }
}

export { Queries };
