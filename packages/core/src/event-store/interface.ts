import { Filter, NostrEvent } from "nostr-tools";
import { Observable } from "rxjs";

export interface IEventStore {
  updates: Observable<NostrEvent>;

  // management methods
  add(event: NostrEvent, fromRelay?: string): NostrEvent;
  remove(event: string | NostrEvent): boolean;
  update(event: NostrEvent): NostrEvent;

  // sync get methods
  hasEvent(id: string): boolean;
  hasReplaceable(kind: number, pubkey: string, identifier?: string): boolean;

  getEvent(id: string): NostrEvent | undefined;
  getReplaceable(kind: number, pubkey: string, identifier?: string): NostrEvent | undefined;
  getReplaceableHistory(kind: number, pubkey: string, identifier?: string): NostrEvent[] | undefined;

  getAll(filters: Filter | Filter[]): Set<NostrEvent>;
  getTimeline(filters: Filter | Filter[]): NostrEvent[];

  // observable methods
  filters(filters: Filter | Filter[]): Observable<NostrEvent>;

  updated(id: string | NostrEvent): Observable<NostrEvent>;
  removed(id: string): Observable<never>;

  event(id: string): Observable<NostrEvent | undefined>;
  events(ids: string[]): Observable<Record<string, NostrEvent>>;
  replaceable(kind: number, pubkey: string, identifier?: string): Observable<NostrEvent | undefined>;
  replaceableSet(
    pointers: { kind: number; pubkey: string; identifier?: string }[],
  ): Observable<Record<string, NostrEvent>>;
  timeline(filters: Filter | Filter[], includeOldVersion?: boolean): Observable<NostrEvent[]>;
}
