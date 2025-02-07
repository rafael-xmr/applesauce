import { tap, from, Observable, OperatorFunction, filter, bufferTime, map, mergeMap } from "rxjs";
import { EventPacket, RxNostr } from "rx-nostr";
import { getEventUID, getReplaceableUID, markFromCache } from "applesauce-core/helpers";
import { logger } from "applesauce-core";
import { nanoid } from "nanoid";

import { CacheRequest, Loader } from "./loader.js";
import { generatorSequence } from "../operators/generator-sequence.js";
import {
  createFiltersFromAddressPointers,
  getAddressPointerId,
  getRelaysFromPointers,
  isLoadableAddressPointer,
} from "../helpers/address-pointer.js";
import { unique } from "../helpers/array.js";
import { getDefaultReadRelays } from "../helpers/rx-nostr.js";
import { distinctRelays } from "../operators/distinct-relays.js";
import { relaysRequest } from "../operators/relay-request.js";

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
  opts?: { cacheRequest?: CacheRequest; lookupRelays?: string[] },
): Generator<Observable<EventPacket>, undefined, EventPacket[]> {
  const id = nanoid(4);

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
  if (opts?.cacheRequest) {
    log(`[${id}] Checking cache`, remaining);
    const results = yield from([remaining]).pipe(
      // convert pointers to filters
      map(createFiltersFromAddressPointers),
      // make requests
      mergeMap((filters) => opts.cacheRequest!(filters)),
      // mark the event as from the cache
      tap((event) => markFromCache(event)),
      // convert to event packets
      map((e) => ({ event: e, from: "", subId: "replaceable-loader", type: "EVENT" }) as EventPacket),
    );

    if (handleResults(results)) return;
  }

  // load from pointer relays and default relays
  const defaultRelays = getDefaultReadRelays(rxNostr);
  const remoteRelays = [...pointerRelays, ...defaultRelays];
  if (remoteRelays.length > 0) {
    log(`[${id}] Requesting`, remoteRelays, remaining);
    const results = yield from([remaining]).pipe(
      // convert pointers to filters
      map(createFiltersFromAddressPointers),
      // make requests
      relaysRequest(rxNostr, id, remoteRelays),
    );

    if (handleResults(results)) return;
  }

  // finally load from lookup relays
  if (opts?.lookupRelays) {
    // make sure we aren't asking a relay twice
    const relays = opts.lookupRelays.filter((r) => !pointerRelays.includes(r));
    if (relays.length > 0) {
      log(`[${id}] Request from lookup`, relays, remaining);
      const results = yield from([remaining]).pipe(
        // convert pointers to filters
        map(createFiltersFromAddressPointers),
        // make requests
        relaysRequest(rxNostr, id, relays),
      );

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
    );
}

export type ReplaceableLoaderOptions = {
  /**
   * Time interval to buffer requests in ms
   * @default 1000
   */
  bufferTime?: number;
  /** A method used to load events from a local cache */
  cacheRequest?: CacheRequest;
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
        // only fetch from each relay once
        distinctRelays((p) => [p.kind, p.pubkey, p.identifier].filter(Boolean).join(":")),
        // batch and filter
        multiRelayBatcher(opts?.bufferTime ?? 1000),
        // check cache, relays, lookup relays in that order
        generatorSequence<LoadableAddressPointer[], EventPacket>(
          (pointers) => cacheFirstSequence(rxNostr, pointers, this.log, opts),
          // there will always be more events, never complete
          false,
        ),
      );
    });
  }
}
