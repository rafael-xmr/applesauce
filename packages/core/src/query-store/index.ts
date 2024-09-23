import Observable from "zen-observable";
import { LRU } from "tiny-lru";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import stringify from "json-stringify-deterministic";

import { EventStore } from "../event-store/event-store.js";
import { stateful } from "../observable/stateful.js";
import { getProfileContent, ProfileContent } from "../helpers/profile.js";
import { getReplaceableUID } from "../helpers/event.js";

export class QueryCache {
  store: EventStore;
  constructor(store: EventStore) {
    this.store = store;
  }

  singleEvents = new LRU<Observable<NostrEvent>>();
  getEvent(id: string) {
    if (!this.singleEvents.has(id)) {
      const observable = stateful(this.store.single(id));
      this.singleEvents.set(id, observable);
    }

    return this.singleEvents.get(id)!;
  }

  getReplaceable(kind: number, pubkey: string, d?: string) {
    return this.getEvent(getReplaceableUID(kind, pubkey, d));
  }

  timelines = new LRU<Observable<NostrEvent[]>>();
  getTimeline(filters: Filter[], key = stringify(filters)) {
    if (!this.singleEvents.has(key)) {
      const observable = stateful(this.store.timeline(filters));
      this.timelines.set(key, observable);
    }

    return this.timelines.get(key)!;
  }

  profiles = new LRU<Observable<ProfileContent>>();
  getProfile(pubkey: string) {
    if (!this.profiles.has(pubkey)) {
      const observable = stateful(this.getReplaceable(kinds.Metadata, pubkey).map((event) => getProfileContent(event)));
      this.profiles.set(pubkey, observable);
    }

    return this.profiles.get(pubkey)!;
  }

  reactions = new LRU<Observable<NostrEvent[]>>();
  getEventReactions(id: string) {
    if (!this.reactions.has(id)) {
      const observable = this.getTimeline([{ kinds: [kinds.Reaction], "#e": [id] }]);
      this.reactions.set(id, observable);
    }

    return this.reactions.get(id)!;
  }
}
