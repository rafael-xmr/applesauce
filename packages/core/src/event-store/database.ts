import { Filter, NostrEvent } from "nostr-tools";
import { binarySearch, insertEventIntoDescendingList } from "nostr-tools/utils";
import PushStream from "zen-push";

import { getEventUID, getIndexableTags, getReplaceableUID } from "../helpers/event.js";
import { INDEXABLE_TAGS } from "./common.js";
import { logger } from "../logger.js";
import { LRU } from "../utils/lru.js";

/**
 * An in-memory database for nostr events
 */
export class Database {
  log = logger.extend("Database");

  /** Indexes */
  protected kinds = new Map<number, Set<NostrEvent>>();
  protected authors = new Map<string, Set<NostrEvent>>();
  protected tags = new LRU<Set<NostrEvent>>();
  protected created_at: NostrEvent[] = [];

  /** LRU cache of last events touched */
  events = new LRU<NostrEvent>();

  private insertedSignal = new PushStream<NostrEvent>();
  private deletedSignal = new PushStream<NostrEvent>();

  /** A stream of events inserted into the database */
  inserted = this.insertedSignal.observable;

  /** A stream of events removed of the database */
  deleted = this.deletedSignal.observable;

  protected claims = new WeakMap<NostrEvent, any>();

  /** Index helper methods */
  protected getKindIndex(kind: number) {
    if (!this.kinds.has(kind)) this.kinds.set(kind, new Set());
    return this.kinds.get(kind)!;
  }
  protected getAuthorsIndex(author: string) {
    if (!this.authors.has(author)) this.authors.set(author, new Set());
    return this.authors.get(author)!;
  }
  protected getTagIndex(tagAndValue: string) {
    if (!this.tags.has(tagAndValue)) {
      // build new tag index from existing events
      const events = new Set<NostrEvent>();

      const ts = Date.now();
      for (const event of this.events.values()) {
        if (getIndexableTags(event).has(tagAndValue)) {
          events.add(event);
        }
      }
      const took = Date.now() - ts;
      if (took > 100) this.log(`Built index ${tagAndValue} took ${took}ms`);

      this.tags.set(tagAndValue, events);
    }
    return this.tags.get(tagAndValue)!;
  }

  /** Moves an event to the top of the LRU cache */
  touch(event: NostrEvent) {
    this.events.set(getEventUID(event), event);
  }

  hasEvent(uid: string) {
    return this.events.get(uid);
  }
  getEvent(uid: string) {
    return this.events.get(uid);
  }

  /** Checks if the database contains a replaceable event without touching it */
  hasReplaceable(kind: number, pubkey: string, d?: string) {
    return this.events.has(getReplaceableUID(kind, pubkey, d));
  }
  /** Gets a replaceable event and touches it */
  getReplaceable(kind: number, pubkey: string, d?: string) {
    return this.events.get(getReplaceableUID(kind, pubkey, d));
  }

  addEvent(event: NostrEvent) {
    const uid = getEventUID(event);

    const current = this.events.get(uid);
    if (current && event.created_at <= current.created_at) return current;

    this.events.set(uid, event);
    this.getKindIndex(event.kind).add(event);
    this.getAuthorsIndex(event.pubkey).add(event);

    for (const tag of getIndexableTags(event)) {
      if (this.tags.has(tag)) {
        this.getTagIndex(tag).add(event);
      }
    }

    insertEventIntoDescendingList(this.created_at, event);

    this.insertedSignal.next(event);

    return event;
  }

  deleteEvent(eventOrUID: string | NostrEvent) {
    let event = typeof eventOrUID === "string" ? this.events.get(eventOrUID) : eventOrUID;
    if (!event) throw new Error("Missing event");

    const uid = getEventUID(event);

    // only remove events that are known
    if (!this.events.has(uid)) return false;

    this.getAuthorsIndex(event.pubkey).delete(event);
    this.getKindIndex(event.kind).delete(event);

    for (const tag of getIndexableTags(event)) {
      if (this.tags.has(tag)) {
        this.getTagIndex(tag).delete(event);
      }
    }

    // remove from created_at index
    const i = this.created_at.indexOf(event);
    this.created_at.splice(i, 1);

    this.events.delete(uid);

    this.deletedSignal.next(event);

    return true;
  }

  /** Sets the claim on the event and touches it */
  claimEvent(event: NostrEvent, claim: any) {
    if (!this.claims.has(event)) {
      this.claims.set(event, claim);
    }

    // always touch event
    this.touch(event);
  }
  /** Checks if an event is claimed by anything */
  isClaimed(event: NostrEvent) {
    return this.claims.has(event);
  }
  /** Removes a claim from an event */
  removeClaim(event: NostrEvent, claim: any) {
    const current = this.claims.get(event);
    if (current === claim) this.claims.delete(event);
  }
  /** Removes all claims on an event */
  clearClaim(event: NostrEvent) {
    this.claims.delete(event);
  }

  *iterateAuthors(authors: Iterable<string>) {
    for (const author of authors) {
      const events = this.authors.get(author);

      if (events) {
        for (const event of events) yield event;
      }
    }
  }

  *iterateTag(tag: string, values: Iterable<string>) {
    for (const value of values) {
      const events = this.getTagIndex(tag + ":" + value);

      if (events) {
        for (const event of events) yield event;
      }
    }
  }

  *iterateKinds(kinds: Iterable<number>) {
    for (const kind of kinds) {
      const events = this.kinds.get(kind);

      if (events) {
        for (const event of events) yield event;
      }
    }
  }

  *iterateTime(since: number | undefined, until: number | undefined) {
    let untilIndex = 0;
    let sinceIndex = this.created_at.length - 1;

    let start = until
      ? binarySearch(this.created_at, (mid) => {
          if (mid.created_at === until) return -1;
          return mid.created_at - until;
        })
      : undefined;

    if (start && start[1]) untilIndex = start[0];

    const end = since
      ? binarySearch(this.created_at, (mid) => {
          if (mid.created_at === since) return 1;
          return since - mid.created_at;
        })
      : undefined;

    if (end && end[1]) sinceIndex = end[0];

    const events = new Set<NostrEvent>();

    for (let i = untilIndex; i <= sinceIndex; i++) {
      events.add(this.created_at[i]);
    }

    return events;
  }

  *iterateIds(ids: Iterable<string>) {
    for (const id of ids) {
      if (this.events.has(id)) yield this.events.get(id)!;
    }
  }

  /** Returns all events that match the filter */
  getEventsForFilter(filter: Filter): Set<NostrEvent> {
    // search is not supported, return an empty set
    if (filter.search) return new Set();

    let first = true;
    let events = new Set<NostrEvent>();
    const and = (iterable: Iterable<NostrEvent>) => {
      const set = iterable instanceof Set ? iterable : new Set(iterable);
      if (first) {
        events = set;
        first = false;
      } else {
        for (const event of events) {
          if (!set.has(event)) events.delete(event);
        }
      }
      return events;
    };

    if (filter.ids) and(this.iterateIds(filter.ids));

    let time: NostrEvent[] | null = null;

    // query for time first if since is set
    if (filter.since !== undefined) {
      time = Array.from(this.iterateTime(filter.since, filter.until));
      and(time);
    }

    for (const t of INDEXABLE_TAGS) {
      const key = `#${t}`;
      const values = filter[key as `#${string}`];
      if (values?.length) and(this.iterateTag(t, values));
    }

    if (filter.authors) and(this.iterateAuthors(filter.authors));
    if (filter.kinds) and(this.iterateKinds(filter.kinds));

    // query for time last if only until is set
    if (filter.since === undefined && filter.until !== undefined) {
      time = Array.from(this.iterateTime(filter.since, filter.until));
      and(time);
    }

    // if the filter queried on time and has a limit. truncate the events now
    if (filter.limit && time) {
      const limited = new Set<NostrEvent>();
      for (const event of time) {
        if (limited.size >= filter.limit) break;
        if (events.has(event)) limited.add(event);
      }
      return limited;
    }

    return events;
  }

  getForFilters(filters: Filter[]) {
    if (filters.length === 0) throw new Error("No Filters");

    let events = new Set<NostrEvent>();

    for (const filter of filters) {
      const filtered = this.getEventsForFilter(filter);
      for (const event of filtered) events.add(event);
    }

    return events;
  }

  /** Remove the oldest events that are not claimed */
  prune(limit = 1000) {
    let removed = 0;

    let cursor = this.events.first;
    while (cursor) {
      const event = cursor.value;

      if (!this.isClaimed(event)) {
        this.deleteEvent(event);
        removed++;

        if (removed >= limit) break;
      }

      cursor = cursor.next;
    }

    return removed;
  }
}