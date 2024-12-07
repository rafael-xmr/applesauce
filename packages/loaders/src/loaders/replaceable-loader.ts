import { share, tap, from, Observable, OperatorFunction, filter, bufferTime, map } from "rxjs";
import { EventPacket, RxNostr } from "rx-nostr";
import { getEventUID, getReplaceableUID, markFromCache } from "applesauce-core/helpers";
import { logger } from "applesauce-core";
import { nanoid } from "nanoid";

import { Loader } from "./loader.js";
import { generatorSequence } from "../operators/generator-sequence.js";
import { replaceableRequest } from "../operators/address-pointers-request.js";
import { getAddressPointerId, getRelaysFromPointers, isLoadableAddressPointer } from "../helpers/address-pointer.js";
import { unique } from "../helpers/array.js";

export type LoadableAddressPointer = {
  kind: number;
  pubkey: string;
  /** Optional "d" tag for paramaritized replaceable */
  identifier?: string;
  /** Relays to load from */
  relays?: string[];
  /** Load this address pointer even if it has already been loaded */
  force?: boolean;
};

/** deep clone a loadable pointer to ensure its safe to modify */
function cloneLoadablePointer(pointer: LoadableAddressPointer): LoadableAddressPointer {
  const clone = { ...pointer };
  if (pointer.relays) clone.relays = [...pointer.relays];
  return clone;
}

/** A generator that tries to load the address pointers from the cache first, then tries the relays */
function* cacheFirstSequence(
  rxNostr: RxNostr,
  pointers: LoadableAddressPointer[],
  log: typeof logger,
  opts?: { cacheRelays?: string[]; lookupRelays?: string[] },
): Generator<Observable<EventPacket>, undefined, EventPacket[]> {
  const id = nanoid(8);
  log = log.extend(id);

  let remaining = Array.from(pointers);
  const pointerRelays = Array.from(getRelaysFromPointers(pointers));

  // handle previous step results and decide if to exit
  const handleResults = (results: EventPacket[]) => {
    if (results.length) {
      const coordinates = new Set(results.map((p) => getEventUID(p.event)));

      // if there where results, filter out any pointers that where found
      remaining = remaining.filter((pointer) => {
        const found = coordinates.has(getReplaceableUID(pointer.kind, pointer.pubkey, pointer.identifier));
        if (found && pointer.force !== true) return false;
        else return true;
      });
      if (remaining.length === 0) return true;
    }

    return false;
  };

  // first attempt, load from cache relays
  if (opts?.cacheRelays && opts?.cacheRelays.length > 0) {
    log(`Checking cache`, opts.cacheRelays, remaining);
    const results = yield from([remaining]).pipe(
      replaceableRequest(rxNostr, opts.cacheRelays, id),
      // mark the event as from the cache
      tap((p) => markFromCache(p.event)),
    );

    if (handleResults(results)) return;
  }

  // finished loading from the cache, load from pointer relays
  if (pointerRelays.length > 0) {
    log(`Requesting`, pointerRelays, remaining);
    const results = yield from([remaining]).pipe(replaceableRequest(rxNostr, pointerRelays, id));

    if (handleResults(results)) return;
  }

  // finally load from lookup relays
  if (opts?.lookupRelays) {
    // make sure we aren't asking a relay twice
    const relays = opts.lookupRelays.filter((r) => !pointerRelays.includes(r));
    if (relays.length > 0) {
      log(`Request from lookup`, relays, remaining);
      const results = yield from([remaining]).pipe(replaceableRequest(rxNostr, relays, id));

      if (handleResults(results)) return;
    }
  }
}

/** Batches address pointers and consolidates them */
function multiRelayBatcher(buffer: number): OperatorFunction<LoadableAddressPointer, LoadableAddressPointer[]> {
  return (source) =>
    source.pipe(
      // buffer on time
      bufferTime(buffer),
      // ignore empty buffers
      filter((buffer) => buffer.length > 0),
      // consolidate buffered pointers
      map((pointers) => {
        const byId = new Map<string, LoadableAddressPointer>();

        for (const pointer of pointers) {
          const id = getAddressPointerId(pointer);
          if (byId.has(id)) {
            // duplicate, merge pointers
            const current = byId.get(id)!;

            // merge relays
            if (pointer.relays) {
              if (current.relays) current.relays = unique([...current.relays, ...pointer.relays]);
              else current.relays = pointer.relays;
            }

            // merge force flag
            if (pointer.force !== undefined) {
              current.force = current.force || pointer.force;
            }
          } else byId.set(id, cloneLoadablePointer(pointer));
        }

        // return consolidated pointers
        return Array.from(byId.values());
      }),
      // ignore empty buffer
      filter((buffer) => buffer.length > 0),
      // ensure pointers are only requested from each relay once
      map((pointers) => {
        const requestedFrom = new Map<string, Set<string>>();

        return pointers.filter((pointer) => {
          // if this pointer does not have any relays or is forced, skip
          if (!pointer.relays) return true;
          if (pointer.force) return true;

          const id = getAddressPointerId(pointer);
          let set = requestedFrom.get(id);
          if (!set) {
            set = new Set<string>();
            requestedFrom.set(id, set);
          }

          // remove any relays that have already been used
          pointer.relays = pointer.relays.filter((relay) => !set.has(relay));

          // remember used relays
          for (const relay of pointer.relays) set.add(relay);

          // if there are no new relays, ignore pointer
          return pointer.relays.length > 0;
        });
      }),
      // ignore empty buffer
      filter((buffer) => buffer.length > 0),
    );
}

export type ReplaceableLoaderOptions = {
  /**
   * Time interval to buffer requests in ms
   * @default 1000
   */
  bufferTime?: number;
  /** The cache relays to check first */
  cacheRelays?: string[];
  /** Fallback lookup relays to check when event cant be found */
  lookupRelays?: string[];
};

export class ReplaceableLoader extends Loader<LoadableAddressPointer, EventPacket> {
  log: typeof logger = logger.extend("ReplaceableLoader");

  constructor(rxNostr: RxNostr, opts?: ReplaceableLoaderOptions) {
    super((source) => {
      return source.pipe(
        // filter out invalid pointers
        filter(isLoadableAddressPointer),
        // TODO: needs a new batching method that takes the multiple relays (and force) into account

        // batch and filter
        multiRelayBatcher(opts?.bufferTime ?? 1000),
        // check cache, relays, lookup relays in that order
        generatorSequence<LoadableAddressPointer[], EventPacket>((pointers) =>
          cacheFirstSequence(rxNostr, pointers, this.log, opts),
        ),
        // share the response with all subscribers
        share(),
      );
    });
  }
}
