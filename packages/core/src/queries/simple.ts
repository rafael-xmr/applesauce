import { Filter, NostrEvent } from "nostr-tools";
import stringify from "json-stringify-deterministic";

import { getEventUID, getReplaceableUID } from "../helpers/event.js";
import { Query } from "../query-store/index.js";

/** Creates a Query that returns a single event or undefined */
export function SingleEventQuery(uid: string): Query<NostrEvent | undefined> {
  return {
    key: uid,
    run: (events) => events.event(uid),
  };
}

/** Creates a Query returning the latest version of a replaceable event */
export function ReplaceableQuery(kind: number, pubkey: string, d?: string): Query<NostrEvent | undefined> {
  return {
    key: getReplaceableUID(kind, pubkey, d),
    run: (events) => events.replaceable(kind, pubkey, d),
  };
}

/** Creates a Query that returns an array of sorted events matching the filters */
export function TimelineQuery(filters: Filter | Filter[]): Query<NostrEvent[]> {
  return {
    key: stringify(filters),
    run: (events) => events.timeline(Array.isArray(filters) ? filters : [filters]),
  };
}

/** Creates a Query that returns a directory of events by their UID */
export function ReplaceableSetQuery(filters: Filter | Filter[]): Query<Record<string, NostrEvent>> {
  return {
    key: stringify(filters),
    run: (events) =>
      events
        .timeline(Array.isArray(filters) ? filters : [filters])
        .map((events) => events.reduce((dir, event) => ({ ...dir, [getEventUID(event)]: event }), {})),
  };
}
