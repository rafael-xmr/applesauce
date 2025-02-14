import { Filter, kinds, NostrEvent } from "nostr-tools";
import { insertEventIntoDescendingList } from "nostr-tools/utils";
import { isParameterizedReplaceableKind } from "nostr-tools/kinds";
import {
  defer,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  EMPTY,
  endWith,
  filter,
  finalize,
  from,
  map,
  merge,
  mergeMap,
  mergeWith,
  Observable,
  of,
  repeat,
  scan,
  take,
  takeUntil,
  tap,
} from "rxjs";

import { Database } from "./database.js";
import {
  getEventUID,
  getReplaceableIdentifier,
  getReplaceableUID,
  getTagValue,
  isReplaceable,
} from "../helpers/event.js";
import { matchFilters } from "../helpers/filter.js";
import { addSeenRelay, getSeenRelays } from "../helpers/relays.js";
import { getDeleteCoordinates, getDeleteIds } from "../helpers/delete.js";
import { claimEvents } from "../observable/claim-events.js";
import { claimLatest } from "../observable/claim-latest.js";

export class EventStore {
  database: Database;

  /** Enable this to keep old versions of replaceable events */
  keepOldVersions = false;

  /** A method used to verify new events before added them */
  verifyEvent?: (event: NostrEvent) => boolean;

  constructor() {
    this.database = new Database();

    this.database.onBeforeInsert = (event) => {
      // reject events that are invalid
      if (this.verifyEvent && this.verifyEvent(event) === false) throw new Error("Invalid event");
    };
  }

  // delete state
  protected deletedIds = new Set<string>();
  protected deletedCoords = new Map<string, number>();
  protected checkDeleted(event: string | NostrEvent) {
    if (typeof event === "string") return this.deletedIds.has(event);
    else {
      if (this.deletedIds.has(event.id)) return true;

      if (isParameterizedReplaceableKind(event.kind)) {
        const deleted = this.deletedCoords.get(getEventUID(event));
        if (deleted) return deleted > event.created_at;
      }

      return false;
    }
  }

  // handling delete events
  protected handleDeleteEvent(deleteEvent: NostrEvent) {
    const ids = getDeleteIds(deleteEvent);
    for (const id of ids) {
      this.deletedIds.add(id);

      // remove deleted events in the database
      const event = this.database.getEvent(id);
      if (event) this.database.removeEvent(event);
    }

    const coords = getDeleteCoordinates(deleteEvent);
    for (const coord of coords) {
      this.deletedCoords.set(coord, Math.max(this.deletedCoords.get(coord) ?? 0, deleteEvent.created_at));

      // remove deleted events in the database
      const event = this.database.getEvent(coord);
      if (event && event.created_at < deleteEvent.created_at) this.database.removeEvent(event);
    }
  }

  /** Copies important metadata from and identical event to another */
  static mergeDuplicateEvent(source: NostrEvent, dest: NostrEvent) {
    const relays = getSeenRelays(source);
    if (relays) {
      for (const relay of relays) addSeenRelay(dest, relay);
    }
  }

  /**
   * Adds an event to the database and update subscriptions
   * @throws
   */
  add(event: NostrEvent, fromRelay?: string): NostrEvent {
    if (event.kind === kinds.EventDeletion) this.handleDeleteEvent(event);

    // Ignore if the event was deleted
    if (this.checkDeleted(event)) return event;

    // Insert event into database
    const inserted = this.database.addEvent(event);

    // Copy cached data if its a duplicate event
    if (event !== inserted) EventStore.mergeDuplicateEvent(event, inserted);

    // attach relay this event was from
    if (fromRelay) addSeenRelay(inserted, fromRelay);

    // remove all old version of the replaceable event
    if (!this.keepOldVersions && isReplaceable(event.kind)) {
      const existing = this.database.getReplaceable(event.kind, event.pubkey, getTagValue(event, "d"));

      if (existing) {
        const older = Array.from(existing).filter((e) => e.created_at < event.created_at);
        for (const old of older) this.database.removeEvent(old);

        // return the newest version of the replaceable event
        // most of the time this will be === event, but not always
        if (existing.length !== older.length) return existing[0];
      }
    }

    return inserted;
  }

  /** Removes an event from the database and updates subscriptions */
  remove(event: string | NostrEvent): boolean {
    return this.database.removeEvent(event);
  }

  /** Removes any event that is not being used by a subscription */
  prune(max?: number): number {
    return this.database.prune(max);
  }

  /** Add an event to the store and notifies all subscribes it has updated */
  update(event: NostrEvent): NostrEvent {
    return this.database.updateEvent(event);
  }

  /** Get all events matching a filter */
  getAll(filters: Filter[]): Set<NostrEvent> {
    return this.database.getForFilters(filters);
  }

  /** Check if the store has an event */
  hasEvent(uid: string): boolean {
    return this.database.hasEvent(uid);
  }
  getEvent(uid: string): NostrEvent | undefined {
    return this.database.getEvent(uid);
  }

  /** Check if the store has a replaceable event */
  hasReplaceable(kind: number, pubkey: string, d?: string): boolean {
    return this.database.hasReplaceable(kind, pubkey, d);
  }

  /** Gets the latest version of a replaceable event */
  getReplaceable(kind: number, pubkey: string, d?: string): NostrEvent | undefined {
    return this.database.getReplaceable(kind, pubkey, d)?.[0];
  }

  /** Returns all versions of a replaceable event */
  getReplaceableHistory(kind: number, pubkey: string, d?: string): NostrEvent[] | undefined {
    return this.database.getReplaceable(kind, pubkey, d);
  }

  /**
   * Creates an observable that streams all events that match the filter and remains open
   * @param filters
   * @param [onlyNew=false] Only subscribe to new events
   */
  filters(filters: Filter | Filter[], onlyNew = false): Observable<NostrEvent> {
    filters = Array.isArray(filters) ? filters : [filters];

    return merge(
      // merge existing events
      onlyNew ? EMPTY : from(this.getAll(filters)),
      // subscribe to future events
      this.database.inserted.pipe(filter((e) => matchFilters(filters, e))),
    );
  }

  /** Returns an observable that completes when an event is removed */
  removed(id: string): Observable<never> {
    const deleted = this.checkDeleted(id);
    if (deleted) return EMPTY;

    return this.database.removed.pipe(
      // listen for removed events
      filter((e) => e.id === id),
      // complete as soon as we find a matching removed event
      take(1),
      // switch to empty
      mergeMap(() => EMPTY),
    );
  }

  /** Creates an observable that emits when event is updated */
  updated(id: string): Observable<NostrEvent> {
    return this.database.updated.pipe(filter((e) => e.id === id));
  }

  /** Creates an observable that subscribes to a single event */
  event(id: string): Observable<NostrEvent | undefined> {
    return merge(
      // get current event and ignore if there is none
      defer(() => {
        let event = this.getEvent(id);
        return event ? of(event) : EMPTY;
      }),
      // subscribe to updates
      this.database.inserted.pipe(filter((e) => e.id === id)),
      // subscribe to updates
      this.updated(id),
      // emit undefined when deleted
      this.removed(id).pipe(endWith(undefined)),
    ).pipe(
      // claim all events
      claimEvents(this.database),
    );
  }

  /** Creates an observable that subscribes to multiple events */
  events(ids: string[]): Observable<Record<string, NostrEvent>> {
    return merge(
      // lazily get existing events
      defer(() => from(ids.map((id) => this.getEvent(id)))),
      // subscribe to new events
      this.database.inserted.pipe(filter((e) => ids.includes(e.id))),
      // subscribe to updates
      this.database.updated.pipe(filter((e) => ids.includes(e.id))),
    ).pipe(
      // ignore empty messages
      filter((e) => !!e),
      // claim all events until cleanup
      claimEvents(this.database),
      // watch for removed events
      mergeWith(
        this.database.removed.pipe(
          filter((e) => ids.includes(e.id)),
          map((e) => e.id),
        ),
      ),
      // merge all events into a directory
      scan(
        (dir, event) => {
          if (typeof event === "string") {
            // delete event by id
            const clone = { ...dir };
            delete clone[event];
            return clone;
          } else {
            // add even to directory
            return { ...dir, [event.id]: event };
          }
        },
        {} as Record<string, NostrEvent>,
      ),
    );
  }

  /** Creates an observable that subscribes to the latest version of a replaceable event */
  replaceable(kind: number, pubkey: string, d?: string): Observable<NostrEvent | undefined> {
    let current: NostrEvent | undefined = undefined;

    return merge(
      // lazily get current event
      defer(() => {
        let event = this.getReplaceable(kind, pubkey, d);
        return event ? of(event) : EMPTY;
      }),
      // subscribe to new events
      this.database.inserted.pipe(
        filter(
          (e) => e.pubkey == pubkey && e.kind === kind && (d !== undefined ? getReplaceableIdentifier(e) === d : true),
        ),
      ),
    ).pipe(
      // only update if event is newer
      distinctUntilKeyChanged("created_at"),
      // Hacky way to extract the current event so takeUntil can access it
      tap((event) => (current = event)),
      // complete when event is removed
      takeUntil(this.database.removed.pipe(filter((e) => e.id === current?.id))),
      // emit undefined when removed
      endWith(undefined),
      // keep the observable hot
      repeat(),
      // claim latest event
      claimLatest(this.database),
    );
  }

  /** Creates an observable that subscribes to the latest version of an array of replaceable events*/
  replaceableSet(
    pointers: { kind: number; pubkey: string; identifier?: string }[],
  ): Observable<Record<string, NostrEvent>> {
    const uids = new Set(pointers.map((p) => getReplaceableUID(p.kind, p.pubkey, p.identifier)));

    return merge(
      // start with existing events
      defer(() => from(pointers.map((p) => this.getReplaceable(p.kind, p.pubkey, p.identifier)))),
      // subscribe to new events
      this.database.inserted.pipe(filter((e) => isReplaceable(e.kind) && uids.has(getEventUID(e)))),
    ).pipe(
      // filter out undefined
      filter((e) => !!e),
      // claim all events
      claimEvents(this.database),
      // convert events to add commands
      map((e) => ["add", e] as const),
      // watch for removed events
      mergeWith(
        this.database.removed.pipe(
          filter((e) => isReplaceable(e.kind) && uids.has(getEventUID(e))),
          map((e) => ["remove", e] as const),
        ),
      ),
      // reduce events into directory
      scan(
        (dir, [action, event]) => {
          const uid = getEventUID(event);

          if (action === "add") {
            // add event to dir if its newer
            if (!dir[uid] || event.created_at > dir[uid].created_at) return { ...dir, [uid]: event };
          } else if (action === "remove" && dir[uid] === event) {
            // remove event from dir
            let newDir = { ...dir };
            delete newDir[uid];
            return newDir;
          }

          return dir;
        },
        {} as Record<string, NostrEvent>,
      ),
      // ignore changes that do not modify the dir
      distinctUntilChanged(),
    );
  }

  /** Creates an observable that updates with an array of sorted events */
  timeline(filters: Filter | Filter[], keepOldVersions = false): Observable<NostrEvent[]> {
    filters = Array.isArray(filters) ? filters : [filters];

    const seen = new Map<string, NostrEvent>();

    return merge(
      // get current events
      defer(() => from(this.getAll(filters))),
      // subscribe to newer events
      this.database.inserted.pipe(filter((e) => matchFilters(filters, e))),
    ).pipe(
      // remove duplicate events
      distinctUntilKeyChanged("id"),
      // claim all seen events
      claimEvents(this.database),
      // subscribe to delete events
      mergeWith(
        this.database.removed.pipe(
          filter((e) => matchFilters(filters, e)),
          map((e) => e.id),
        ),
      ),
      // build a timeline
      scan((timeline, event) => {
        // filter out removed events from timeline
        if (typeof event === "string") return timeline.filter((e) => e.id !== event);

        // add event into timeline
        const arr = insertEventIntoDescendingList([...timeline], event);

        // remove old replaceable events if enabled
        if (keepOldVersions && isReplaceable(event.kind)) {
          const uid = getEventUID(event);
          const old = seen.get(uid);
          // remove old event from timeline
          if (old) arr.slice(arr.indexOf(old), 1);
          // update latest version
          seen.set(uid, event);
        }

        return arr;
      }, [] as NostrEvent[]),
      // hacky hack to clear seen on unsubscribe
      finalize(() => seen.clear()),
    );
  }
}
