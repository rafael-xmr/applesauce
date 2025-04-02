import { tap, Observable, filter, bufferTime, map } from "rxjs";
import { getEventUID, markFromCache } from "applesauce-core/helpers";
import { logger } from "applesauce-core";
import { nanoid } from "nanoid";
import { NostrEvent } from "nostr-tools";

import { CacheRequest, Loader, NostrRequest, NostrResponse } from "./loader.js";
import { generatorSequence } from "../operators/generator-sequence.js";
import {
  consolidateAddressPointers,
  createFiltersFromAddressPointers,
  getAddressPointerId,
  getRelaysFromPointers,
  isLoadableAddressPointer,
  LoadableAddressPointer,
} from "../helpers/address-pointer.js";
import { distinctRelaysBatch } from "../operators/distinct-relays.js";
import { completeOnEOSE } from "../operators/complete-on-eose.js";

/** A generator that tries to load the address pointers from the cache first, then tries the relays */
function* cacheFirstSequence(
  request: NostrRequest,
  pointers: LoadableAddressPointer[],
  log: typeof logger,
  opts?: { cacheRequest?: CacheRequest; lookupRelays?: string[] },
): Generator<Observable<NostrEvent>, undefined, NostrEvent[]> {
  const id = nanoid(4);

  let remaining = Array.from(pointers);
  const pointerRelays = Array.from(getRelaysFromPointers(pointers));

  // handle previous step results and decide if to exit
  const handleResults = (results: NostrEvent[]) => {
    if (results.length) {
      const coordinates = new Set(results.map((event) => getEventUID(event)));

      // if there where results, filter out any pointers that where found
      remaining = remaining.filter((pointer) => {
        const found = coordinates.has(getAddressPointerId(pointer));
        if (found && pointer.force !== true) return false;
        else return true;
      });

      // If there are none left, complete
      if (remaining.length === 0) {
        log(`[${id}] Complete`);
        return true;
      }
    }

    return false;
  };

  // first attempt, load from cache relays
  if (opts?.cacheRequest) {
    log(`[${id}] Checking cache`, remaining);

    const filters = createFiltersFromAddressPointers(remaining);
    const results = yield opts.cacheRequest(filters).pipe(
      // mark the event as from the cache
      tap((event) => markFromCache(event)),
    );

    if (handleResults(results)) return;
  }

  // load from pointer relays
  if (pointerRelays.length > 0) {
    log(`[${id}] Requesting`, pointerRelays, remaining);

    const filters = createFiltersFromAddressPointers(remaining);
    const results = yield request(pointerRelays, filters).pipe(completeOnEOSE());

    if (handleResults(results)) return;
  }

  // finally load from lookup relays
  if (opts?.lookupRelays) {
    // make sure we aren't asking a relay twice
    const relays = opts.lookupRelays.filter((r) => !pointerRelays.includes(r));
    if (relays.length > 0) {
      log(`[${id}] Request from lookup`, relays, remaining);

      const filters = createFiltersFromAddressPointers(remaining);
      const results = yield request(relays, filters).pipe(completeOnEOSE());

      if (handleResults(results)) return;
    }
  }
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

export class ReplaceableLoader extends Loader<LoadableAddressPointer, NostrEvent> {
  log: typeof logger = logger.extend("ReplaceableLoader");

  /** A method used to load events from a local cache */
  cacheRequest?: CacheRequest;
  /** Fallback lookup relays to check when event cant be found */
  lookupRelays?: string[];

  constructor(request: NostrRequest, opts?: ReplaceableLoaderOptions) {
    super((source) => {
      return source.pipe(
        // filter out invalid pointers
        filter(isLoadableAddressPointer),
        // buffer on time
        bufferTime(opts?.bufferTime ?? 1000),
        // ignore empty buffers
        filter((buffer) => buffer.length > 0),
        // only fetch from each relay once
        distinctRelaysBatch(getAddressPointerId),
        // consolidate buffered pointers
        map(consolidateAddressPointers),
        // ignore empty buffer
        filter((buffer) => buffer.length > 0),
        // check cache, relays, lookup relays in that order
        generatorSequence<LoadableAddressPointer[], NostrEvent>(
          (pointers) =>
            cacheFirstSequence(request, pointers, this.log, {
              cacheRequest: this.cacheRequest,
              lookupRelays: this.lookupRelays,
            }),
          // there will always be more events, never complete
          false,
        ),
      );
    });

    // set options
    this.cacheRequest = opts?.cacheRequest;
    this.lookupRelays = opts?.lookupRelays;
  }
}
