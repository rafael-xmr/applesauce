import { Filter, kinds, NostrEvent } from "nostr-tools";
import { insertEventIntoDescendingList } from "nostr-tools/utils";
import { isParameterizedReplaceableKind } from "nostr-tools/kinds";
import { Observable } from "rxjs";

import { Database } from "./database.js";
import { getEventUID, getReplaceableUID, getTagValue, isReplaceable } from "../helpers/event.js";
import { matchFilters } from "../helpers/filter.js";
import { addSeenRelay } from "../helpers/relays.js";
import { getDeleteCoordinates, getDeleteIds } from "../helpers/delete.js";

export class EventStore {
  database: Database;

  /** Whether to keep old versions of replaceable events */
  keepOldVersions = false;

  constructor() {
    this.database = new Database();
  }

  /** Adds an event to the database */
  add(event: NostrEvent, fromRelay?: string): NostrEvent {
    if (event.kind === kinds.EventDeletion) this.handleDeleteEvent(event);

    // ignore if the event was deleted
    if (this.checkDeleted(event)) return event;

    // insert event into database
    const inserted = this.database.addEvent(event);

    // remove all old version of the replaceable event
    if (!this.keepOldVersions && isReplaceable(event.kind)) {
      const current = this.database.getReplaceable(event.kind, event.pubkey, getTagValue(event, "d"));

      if (current) {
        const older = Array.from(current).filter((e) => e.created_at < event.created_at);
        for (const old of older) this.database.deleteEvent(old);

        // skip inserting this event because its not the newest
        if (current.length !== older.length) return current[0];
      }
    }

    // attach relay this event was from
    if (fromRelay) addSeenRelay(inserted, fromRelay);

    return inserted;
  }

  protected deletedIds = new Set<string>();
  protected deletedCoords = new Map<string, number>();
  protected handleDeleteEvent(deleteEvent: NostrEvent) {
    const ids = getDeleteIds(deleteEvent);
    for (const id of ids) {
      this.deletedIds.add(id);

      // remove deleted events in the database
      const event = this.database.getEvent(id);
      if (event) this.database.deleteEvent(event);
    }

    const coords = getDeleteCoordinates(deleteEvent);
    for (const coord of coords) {
      this.deletedCoords.set(coord, Math.max(this.deletedCoords.get(coord) ?? 0, deleteEvent.created_at));

      // remove deleted events in the database
      const event = this.database.getEvent(coord);
      if (event && event.created_at < deleteEvent.created_at) this.database.deleteEvent(event);
    }
  }
  protected checkDeleted(event: NostrEvent) {
    if (this.deletedIds.has(event.id)) return true;

    if (isParameterizedReplaceableKind(event.kind)) {
      const deleted = this.deletedCoords.get(getEventUID(event));
      if (deleted) return deleted > event.created_at;
    }

    return false;
  }

  /** Add an event to the store and notifies all subscribes it has updated */
  update(event: NostrEvent): NostrEvent {
    return this.database.updateEvent(event);
  }

  getAll(filters: Filter[]): Set<NostrEvent> {
    return this.database.getForFilters(filters);
  }

  hasEvent(uid: string): boolean {
    return this.database.hasEvent(uid);
  }
  getEvent(uid: string): NostrEvent | undefined {
    return this.database.getEvent(uid);
  }

  hasReplaceable(kind: number, pubkey: string, d?: string): boolean {
    return this.database.hasReplaceable(kind, pubkey, d);
  }

  /** Gets the latest version of a replaceable event */
  getReplaceable(kind: number, pubkey: string, d?: string): NostrEvent | undefined {
    return this.database.getReplaceable(kind, pubkey, d)?.[0];
  }

  /** Returns all versions of a replaceable event */
  getAllReplaceable(kind: number, pubkey: string, d?: string): NostrEvent[] | undefined {
    return this.database.getReplaceable(kind, pubkey, d);
  }

  /** Creates an observable that updates a single event */
  event(id: string): Observable<NostrEvent | undefined> {
    return new Observable<NostrEvent | undefined>((observer) => {
      let current = this.database.getEvent(id);

      if (current) {
        observer.next(current);
        this.database.claimEvent(current, observer);
      }

      // subscribe to future events
      const inserted = this.database.inserted.subscribe((event) => {
        if (event.id === id) {
          current = event;
          observer.next(event);
          this.database.claimEvent(event, observer);
        }
      });

      // subscribe to updated events
      const updated = this.database.updated.subscribe((event) => {
        if (event.id === id) observer.next(current);
      });

      // subscribe to deleted events
      const deleted = this.database.deleted.subscribe((event) => {
        if (current?.id === event.id) {
          this.database.removeClaim(current, observer);

          current = undefined;
          observer.next(undefined);
        }
      });

      return () => {
        deleted.unsubscribe();
        updated.unsubscribe();
        inserted.unsubscribe();

        if (current) this.database.removeClaim(current, observer);
      };
    });
  }

  /** Creates an observable that subscribes to multiple events */
  events(ids: string[]): Observable<Map<string, NostrEvent>> {
    return new Observable<Map<string, NostrEvent>>((observer) => {
      const events = new Map<string, NostrEvent>();

      for (const id of ids) {
        const event = this.getEvent(id);
        if (event) {
          events.set(id, event);
          this.database.claimEvent(event, observer);
        }
      }

      observer.next(events);

      // subscribe to future events
      const inserted = this.database.inserted.subscribe((event) => {
        const id = event.id;
        if (ids.includes(id) && !events.has(id)) {
          events.set(id, event);
          observer.next(events);

          // claim new event
          this.database.claimEvent(event, observer);
        }
      });

      // subscribe to updated events
      const updated = this.database.updated.subscribe((event) => {
        if (ids.includes(event.id)) observer.next(events);
      });

      // subscribe to deleted events
      const deleted = this.database.deleted.subscribe((event) => {
        const id = event.id;
        if (ids.includes(id)) {
          const current = events.get(id);

          if (current) {
            this.database.removeClaim(current, observer);

            events.delete(id);
            observer.next(events);
          }
        }
      });

      return () => {
        inserted.unsubscribe();
        deleted.unsubscribe();
        updated.unsubscribe();

        for (const [_uid, event] of events) {
          this.database.removeClaim(event, observer);
        }
      };
    });
  }

  /** Creates an observable with the latest version of a replaceable event */
  replaceable(kind: number, pubkey: string, d?: string): Observable<NostrEvent | undefined> {
    return new Observable<NostrEvent | undefined>((observer) => {
      const uid = getReplaceableUID(kind, pubkey, d);

      // get latest version
      let current = this.database.getReplaceable(kind, pubkey, d)?.[0];

      if (current) {
        observer.next(current);
        this.database.claimEvent(current, observer);
      }

      // subscribe to future events
      const inserted = this.database.inserted.subscribe((event) => {
        if (getEventUID(event) === uid && (!current || event.created_at > current.created_at)) {
          // remove old claim
          if (current) this.database.removeClaim(current, observer);

          current = event;
          observer.next(event);

          // claim new event
          this.database.claimEvent(current, observer);
        }
      });

      // subscribe to updated events
      const updated = this.database.updated.subscribe((event) => {
        if (event === current) observer.next(event);
      });

      // subscribe to deleted events
      const deleted = this.database.deleted.subscribe((event) => {
        if (getEventUID(event) === uid && event === current) {
          this.database.removeClaim(current, observer);

          current = undefined;
          observer.next(undefined);
        }
      });

      return () => {
        inserted.unsubscribe();
        deleted.unsubscribe();
        updated.unsubscribe();

        if (current) this.database.removeClaim(current, observer);
      };
    });
  }

  /** Creates an observable with the latest versions of replaceable events */
  replaceableSet(
    pointers: { kind: number; pubkey: string; identifier?: string }[],
  ): Observable<Map<string, NostrEvent>> {
    return new Observable<Map<string, NostrEvent>>((observer) => {
      const coords = pointers.map((p) => getReplaceableUID(p.kind, p.pubkey, p.identifier));
      const events = new Map<string, NostrEvent>();

      const handleEvent = (event: NostrEvent) => {
        const uid = getEventUID(event);

        const current = events.get(uid);
        if (current) {
          if (event.created_at > current.created_at) {
            this.database.removeClaim(current, observer);
          } else return;
        }

        events.set(uid, event);
        this.database.claimEvent(event, observer);
      };

      // get latest version
      for (const pointer of pointers) {
        const events = this.database.getReplaceable(pointer.kind, pointer.pubkey, pointer.identifier);
        if (events) handleEvent(events[0]);
      }

      observer.next(events);

      // subscribe to future events
      const inserted = this.database.inserted.subscribe((event) => {
        if (isReplaceable(event.kind) && coords.includes(getEventUID(event))) {
          handleEvent(event);
          observer.next(events);
        }
      });

      // subscribe to updated events
      const updated = this.database.updated.subscribe((event) => {
        if (isReplaceable(event.kind) && coords.includes(getEventUID(event))) {
          observer.next(events);
        }
      });

      // subscribe to deleted events
      const deleted = this.database.deleted.subscribe((event) => {
        const uid = getEventUID(event);
        if (events.has(uid)) {
          events.delete(uid);
          this.database.removeClaim(event, observer);
          observer.next(events);
        }
      });

      return () => {
        inserted.unsubscribe();
        deleted.unsubscribe();
        updated.unsubscribe();

        for (const [_id, event] of events) {
          this.database.removeClaim(event, observer);
        }
      };
    });
  }

  /** Creates an observable that streams all events that match the filter */
  stream(filters: Filter[]): Observable<NostrEvent> {
    return new Observable<NostrEvent>((observer) => {
      let claimed = new Set<NostrEvent>();
      let events = this.database.getForFilters(filters);

      for (const event of events) {
        observer.next(event);

        this.database.claimEvent(event, observer);
        claimed.add(event);
      }

      // subscribe to future events
      const sub = this.database.inserted.subscribe((event) => {
        if (matchFilters(filters, event)) {
          observer.next(event);

          this.database.claimEvent(event, observer);
          claimed.add(event);
        }
      });

      return () => {
        sub.unsubscribe();

        // remove all claims
        for (const event of claimed) this.database.removeClaim(event, observer);
        claimed.clear();
      };
    });
  }

  /** Creates an observable that updates with an array of sorted events */
  timeline(filters: Filter[], keepOldVersions = this.keepOldVersions): Observable<NostrEvent[]> {
    return new Observable<NostrEvent[]>((observer) => {
      const seen = new Map<string, NostrEvent>();
      const timeline: NostrEvent[] = [];

      // NOTE: only call this if we know the event is in timeline
      const removeFromTimeline = (event: NostrEvent) => {
        timeline.splice(timeline.indexOf(event), 1);
        if (!keepOldVersions && isReplaceable(event.kind)) seen.delete(getEventUID(event));
        this.database.removeClaim(event, observer);
      };

      // inserts an event into the timeline and handles replaceable events
      const insertIntoTimeline = (event: NostrEvent) => {
        // remove old versions
        if (!keepOldVersions && isReplaceable(event.kind)) {
          const uid = getEventUID(event);
          const old = seen.get(uid);
          if (old) {
            if (event.created_at > old.created_at) removeFromTimeline(old);
            else return;
          }
          seen.set(uid, event);
        }

        // insert into timeline
        insertEventIntoDescendingList(timeline, event);

        this.database.claimEvent(event, observer);
      };

      // build initial timeline
      const events = this.database.getForFilters(filters);
      for (const event of events) insertIntoTimeline(event);
      observer.next([...timeline]);

      // subscribe to future events
      const inserted = this.database.inserted.subscribe((event) => {
        if (matchFilters(filters, event)) {
          insertIntoTimeline(event);

          observer.next([...timeline]);
        }
      });

      // subscribe to updated events
      const updated = this.database.updated.subscribe((event) => {
        if (timeline.includes(event)) {
          observer.next([...timeline]);
        }
      });

      // subscribe to deleted events
      const deleted = this.database.deleted.subscribe((event) => {
        if (timeline.includes(event)) {
          removeFromTimeline(event);

          observer.next([...timeline]);
        }
      });

      return () => {
        inserted.unsubscribe();
        deleted.unsubscribe();
        updated.unsubscribe();

        // remove all claims
        for (const event of timeline) {
          this.database.removeClaim(event, observer);
        }

        // forget seen replaceable events
        seen.clear();
      };
    });
  }
}
