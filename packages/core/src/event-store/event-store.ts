import { Filter, NostrEvent } from "nostr-tools";
import { insertEventIntoDescendingList } from "nostr-tools/utils";
import Observable from "zen-observable";

import { Database } from "./database.js";
import { getEventUID } from "../helpers/event.js";
import { matchFilters } from "../helpers/filter.js";
import { addSeenRelay } from "../helpers/relays.js";

export class EventStore {
  events: Database;

  private singles = new Map<ZenObservable.SubscriptionObserver<NostrEvent>, string>();
  private streams = new Map<ZenObservable.SubscriptionObserver<NostrEvent>, Filter[]>();
  private timelines = new Map<ZenObservable.SubscriptionObserver<NostrEvent[]>, Filter[]>();

  constructor() {
    this.events = new Database();
  }

  add(event: NostrEvent, fromRelay?: string) {
    const inserted = this.events.addEvent(event);

    if (fromRelay) addSeenRelay(inserted, fromRelay);

    return inserted;
  }

  getAll(filters: Filter[]) {
    return this.events.getForFilters(filters);
  }

  hasEvent(uid: string) {
    return this.events.hasEvent(uid);
  }
  getEvent(uid: string) {
    return this.events.getEvent(uid);
  }

  hasReplaceable(kind: number, pubkey: string, d?: string) {
    return this.events.hasReplaceable(kind, pubkey, d);
  }
  getReplaceable(kind: number, pubkey: string, d?: string) {
    return this.events.getReplaceable(kind, pubkey, d);
  }

  /** Creates an observable that updates a single event */
  single(uid: string) {
    return new Observable<NostrEvent | undefined>((observer) => {
      let current = this.events.getEvent(uid);

      if (current) {
        observer.next(current);
        this.events.claimEvent(current, observer);
      }

      // subscribe to future events
      const inserted = this.events.inserted.subscribe((event) => {
        if (getEventUID(event) === uid && (!current || event.created_at > current.created_at)) {
          // remove old claim
          if (current) this.events.removeClaim(current, observer);

          current = event;
          observer.next(event);

          // claim new event
          this.events.claimEvent(current, observer);
        }
      });

      // subscribe to deleted events
      const deleted = this.events.deleted.subscribe((event) => {
        if (getEventUID(event) === uid && current) {
          this.events.removeClaim(current, observer);

          current = undefined;
          observer.next(undefined);
        }
      });

      this.singles.set(observer, uid);

      return () => {
        inserted.unsubscribe();
        deleted.unsubscribe();

        this.singles.delete(observer);
        if (current) this.events.removeClaim(current, observer);
      };
    });
  }

  /** Creates an observable that streams all events that match the filter */
  stream(filters: Filter[]) {
    return new Observable<NostrEvent>((observer) => {
      let claimed = new Set<NostrEvent>();
      let events = this.events.getForFilters(filters);

      for (const event of events) {
        observer.next(event);

        this.events.claimEvent(event, observer);
        claimed.add(event);
      }

      // subscribe to future events
      const sub = this.events.inserted.subscribe((event) => {
        if (matchFilters(filters, event)) {
          observer.next(event);

          this.events.claimEvent(event, observer);
          claimed.add(event);
        }
      });

      this.streams.set(observer, filters);

      return () => {
        sub.unsubscribe();
        this.streams.delete(observer);

        // remove all claims
        for (const event of claimed) this.events.removeClaim(event, observer);
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
      const events = this.events.getForFilters(filters);
      for (const event of events) {
        insertEventIntoDescendingList(timeline, event);

        this.events.claimEvent(event, observer);
        seen.set(getEventUID(event), event);
      }
      observer.next([...timeline]);

      // subscribe to future events
      const inserted = this.events.inserted.subscribe((event) => {
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
              this.events.removeClaim(current, observer);
              this.events.claimEvent(event, observer);
            }
          } else {
            insertEventIntoDescendingList(timeline, event);
            observer.next([...timeline]);

            // claim new event
            this.events.claimEvent(event, observer);
            seen.set(getEventUID(event), event);
          }
        }
      });

      // subscribe to removed events
      const deleted = this.events.deleted.subscribe((event) => {
        const uid = getEventUID(event);

        let current = seen.get(uid);
        if (current) {
          // remove the event
          timeline.splice(timeline.indexOf(current), 1);
          observer.next([...timeline]);

          // remove the claim
          seen.delete(uid);
          this.events.removeClaim(current, observer);
        }
      });

      this.timelines.set(observer, filters);

      return () => {
        this.timelines.delete(observer);
        inserted.unsubscribe();
        deleted.unsubscribe();

        // remove all claims
        for (const [_, event] of seen) {
          this.events.removeClaim(event, observer);
        }

        seen.clear();
      };
    });
  }
}
