import { Filter, NostrEvent } from "nostr-tools";
import { LRU } from "tiny-lru";

import { binarySearch, getEventUID, insertSorted } from "../helpers/event.js";
import { INDEXABLE_TAGS } from "./common.js";

export class Database {
  /** Max number of events to hold */
  max?: number;

  /** Indexes */
  kinds = new Map<number, Set<NostrEvent>>();
  authors = new Map<string, Set<NostrEvent>>();
  tags = new Map<string, Set<NostrEvent>>();
  created_at: NostrEvent[] = [];

  /** LRU cache of last events touched */
  events = new LRU<NostrEvent>();

  constructor(max?: number) {
    this.max = max;
  }

  /** Index helper methods */
  private getKindIndex(kind: number) {
    if (!this.kinds.has(kind)) this.kinds.set(kind, new Set());
    return this.kinds.get(kind)!;
  }
  private getAuthorsIndex(author: string) {
    if (!this.authors.has(author)) this.authors.set(author, new Set());
    return this.authors.get(author)!;
  }
  private getTagIndex(tag: string) {
    if (!this.tags.has(tag)) this.tags.set(tag, new Set());
    return this.tags.get(tag)!;
  }

  touch(event: NostrEvent) {
    this.events.set(getEventUID(event), event);
  }

  getEvent(uid: string) {
    return this.events.get(uid);
  }

  addEvent(event: NostrEvent) {
    const uid = getEventUID(event);

    this.events.set(uid, event);
    this.getKindIndex(event.kind).add(event);
    this.getAuthorsIndex(event.pubkey).add(event);

    for (const tag of event.tags) {
      if (INDEXABLE_TAGS.has(tag[0]) && tag[1]) {
        this.getTagIndex(tag[0] + ":" + tag[1]).add(event);
      }
    }

    insertSorted(this.created_at, event);
  }

  deleteEvent(eventOrId: string | NostrEvent) {
    let event = typeof eventOrId === "string" ? this.events.get(eventOrId) : eventOrId;
    if (!event) throw new Error("Missing event");

    const uid = getEventUID(event);

    // only remove events that are known
    if (!this.events.has(uid)) return false;

    this.getAuthorsIndex(event.pubkey).delete(event);
    this.getKindIndex(event.kind).delete(event);

    for (const tag of event.tags) {
      if (INDEXABLE_TAGS.has(tag[0]) && tag[1]) {
        this.getTagIndex(tag[0] + ":" + tag[1]).delete(event);
      }
    }

    // remove from created_at index
    const i = this.created_at.indexOf(event);
    this.created_at.splice(i, 1);

    this.events.delete(uid);

    return true;
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
      const events = this.tags.get(tag + ":" + value);

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
    const start = until ? binarySearch(this.created_at, until) : 0;
    const end = since ? binarySearch(this.created_at, since) : this.created_at.length - 1;

    const events = new Set<NostrEvent>();

    for (let i = start; i <= end; i++) {
      events.add(this.created_at[i]);
    }

    return events;
  }

  *iterateIds(ids: Iterable<string>) {
    for (const id of ids) {
      if (this.events.has(id)) yield this.events.get(id)!;
    }
  }

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

  prune() {
    if (!this.max) return;

    let removed = 0;

    while (this.events.size > this.max) {
      const event = this.events.first;

      if (event) {
        this.deleteEvent(event);
        removed++;
      }
    }

    return removed;
  }
}
