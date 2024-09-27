import { Filter, NostrEvent } from "nostr-tools";
import stringify from "json-stringify-deterministic";

import { getReplaceableUID } from "../../helpers/event.js";
import { Query } from "../index.js";

export function SingleEventQuery(uid: string): Query<NostrEvent | undefined> {
  return {
    key: uid,
    run: (events) => events.event(uid),
  };
}
export function ReplaceableQuery(kind: number, pubkey: string, d?: string): Query<NostrEvent | undefined> {
  return {
    key: getReplaceableUID(kind, pubkey, d),
    run: (events) => events.replaceable(kind, pubkey, d),
  };
}

export function TimelineQuery(filters: Filter | Filter[]): Query<NostrEvent[]> {
  return {
    key: stringify(filters),
    run: (events) => events.timeline(Array.isArray(filters) ? filters : [filters]),
  };
}
