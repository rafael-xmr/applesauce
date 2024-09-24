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

  constructor() {
    this.events = new Database();
  }

  add(event: NostrEvent, fromRelay?: string) {
    const inserted = this.events.addEvent(event);

    if (inserted === event) {
      // forward to single event requests
      const eventUID = getEventUID(event);
      for (const [control, uid] of this.singles) {
        if (eventUID === uid) control.next(event);
      }

      // forward to streams
      for (const [control, filters] of this.streams) {
        if (matchFilters(filters, event)) control.next(event);
      }
    }

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
    return new Observable<NostrEvent>((control) => {
      const event = this.events.getEvent(uid);

      if (event) control.next(event);

      this.singles.set(control, uid);

      return () => {
        this.singles.delete(control);
      };
    });
  }

  /** Creates an observable that streams all events that match the filter */
  stream(filters: Filter[]) {
    return new Observable<NostrEvent>((control) => {
      const events = this.events.getForFilters(filters);

      for (const event of events) control.next(event);

      this.streams.set(control, filters);

      return () => {
        this.streams.delete(control);
      };
    });
  }

  /** Creates an observable that updates with an array of sorted events */
  timeline(filters: Filter[]) {
    let events: NostrEvent[] = [];

    return this.stream(filters).map((event) => {
      insertEventIntoDescendingList(events, event);

      return events;
    });
  }
}
