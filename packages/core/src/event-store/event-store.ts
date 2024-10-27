import { Filter, NostrEvent } from "nostr-tools";
import { insertEventIntoDescendingList } from "nostr-tools/utils";
import { Observable } from "rxjs";

import { Database } from "./database.js";
import { getEventUID, getReplaceableUID } from "../helpers/event.js";
import { matchFilters } from "../helpers/filter.js";
import { addSeenRelay } from "../helpers/relays.js";

export class EventStore {
  database: Database;

  constructor() {
    this.database = new Database();
  }

  /** Adds an event to the database */
  add(event: NostrEvent, fromRelay?: string) {
    const inserted = this.database.addEvent(event);

    if (fromRelay) addSeenRelay(inserted, fromRelay);

    return inserted;
  }

  /** Add an event to the store and notifies all subscribes it has updated */
  update(event: NostrEvent) {
    return this.database.updateEvent(event);
  }

  getAll(filters: Filter[]) {
    return this.database.getForFilters(filters);
  }

  hasEvent(uid: string) {
    return this.database.hasEvent(uid);
  }
  getEvent(uid: string) {
    return this.database.getEvent(uid);
  }

  hasReplaceable(kind: number, pubkey: string, d?: string) {
    return this.database.hasReplaceable(kind, pubkey, d);
  }
  getReplaceable(kind: number, pubkey: string, d?: string) {
    return this.database.getReplaceable(kind, pubkey, d);
  }

  /** Creates an observable that updates a single event */
  event(uid: string) {
    return new Observable<NostrEvent | undefined>((observer) => {
      let current = this.database.getEvent(uid);

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

      // subscribe to updates
      const updated = this.database.updated.subscribe((event) => {
        if (event === current) observer.next(event);
      });

      // subscribe to deleted events
      const deleted = this.database.deleted.subscribe((event) => {
        if (getEventUID(event) === uid && current) {
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

  /** Creates an observable that subscribes to multiple events */
  events(uids: string[]) {
    return new Observable<Map<string, NostrEvent>>((observer) => {
      const events = new Map<string, NostrEvent>();

      for (const uid of uids) {
        const e = this.getEvent(uid);
        if (e) {
          events.set(uid, e);
          this.database.claimEvent(e, observer);
        }
      }

      observer.next(events);

      // subscribe to future events
      const inserted = this.database.inserted.subscribe((event) => {
        const uid = getEventUID(event);
        if (uids.includes(uid)) {
          const current = events.get(uid);

          // remove old claim
          if (!current || event.created_at > current.created_at) {
            if (current) this.database.removeClaim(current, observer);

            events.set(uid, event);
            observer.next(events);

            // claim new event
            this.database.claimEvent(event, observer);
          }
        }
      });

      // subscribe to updates
      const updated = this.database.updated.subscribe((event) => {
        const uid = getEventUID(event);
        if (uids.includes(uid)) observer.next(events);
      });

      // subscribe to deleted events
      const deleted = this.database.deleted.subscribe((event) => {
        const uid = getEventUID(event);
        if (uids.includes(uid)) {
          const current = events.get(uid);

          if (current) {
            this.database.removeClaim(current, observer);

            events.delete(uid);
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

  /** Creates an observable that updates a single replaceable event */
  replaceable(kind: number, pubkey: string, d?: string) {
    return this.event(getReplaceableUID(kind, pubkey, d));
  }

  /** Creates an observable that streams all events that match the filter */
  stream(filters: Filter[]) {
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
  timeline(filters: Filter[]) {
    return new Observable<NostrEvent[]>((observer) => {
      const seen = new Map<string, NostrEvent>();
      const timeline: NostrEvent[] = [];

      // build initial timeline
      const events = this.database.getForFilters(filters);
      for (const event of events) {
        insertEventIntoDescendingList(timeline, event);

        this.database.claimEvent(event, observer);
        seen.set(getEventUID(event), event);
      }
      observer.next([...timeline]);

      // subscribe to future events
      const inserted = this.database.inserted.subscribe((event) => {
        if (matchFilters(filters, event)) {
          const uid = getEventUID(event);

          let current = seen.get(uid);
          if (current) {
            if (event.created_at > current.created_at) {
              // replace event
              timeline.splice(timeline.indexOf(current), 1, event);
              observer.next([...timeline]);

              // update the claim
              seen.set(uid, event);
              this.database.removeClaim(current, observer);
              this.database.claimEvent(event, observer);
            }
          } else {
            insertEventIntoDescendingList(timeline, event);
            observer.next([...timeline]);

            // claim new event
            this.database.claimEvent(event, observer);
            seen.set(getEventUID(event), event);
          }
        }
      });

      // subscribe to updates
      const updated = this.database.updated.subscribe((event) => {
        if (seen.has(getEventUID(event))) {
          observer.next([...timeline]);
        }
      });

      // subscribe to removed events
      const deleted = this.database.deleted.subscribe((event) => {
        const uid = getEventUID(event);

        let current = seen.get(uid);
        if (current) {
          // remove the event
          timeline.splice(timeline.indexOf(current), 1);
          observer.next([...timeline]);

          // remove the claim
          seen.delete(uid);
          this.database.removeClaim(current, observer);
        }
      });

      return () => {
        inserted.unsubscribe();
        deleted.unsubscribe();
        updated.unsubscribe();

        // remove all claims
        for (const [_, event] of seen) {
          this.database.removeClaim(event, observer);
        }

        seen.clear();
      };
    });
  }
}
