import { tap, Observable, filter, bufferTime, map } from "rxjs";
import { createRxOneshotReq, EventPacket, RxNostr } from "rx-nostr";
import { getEventUID, markFromCache, mergeRelaySets } from "applesauce-core/helpers";
import { logger } from "applesauce-core";
import { nanoid } from "nanoid";

import { CacheRequest, Loader } from "./loader.js";
import { generatorSequence } from "../operators/generator-sequence.js";
import {
  consolidateAddressPointers,
  createFiltersFromAddressPointers,
  getAddressPointerId,
  getRelaysFromPointers,
  isLoadableAddressPointer,
  LoadableAddressPointer,
} from "../helpers/address-pointer.js";
import { getDefaultReadRelays } from "../helpers/rx-nostr.js";
import { distinctRelays } from "../operators/distinct-relays.js";

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
      // convert to event packets
      map((e) => ({ event: e, from: "", subId: "replaceable-loader", type: "EVENT" }) as EventPacket),
    );

    if (handleResults(results)) return;
  }

  // load from pointer relays and default relays
  const defaultRelays = getDefaultReadRelays(rxNostr);
  const remoteRelays = mergeRelaySets(pointerRelays, defaultRelays);
  if (remoteRelays.length > 0) {
    log(`[${id}] Requesting`, remoteRelays, remaining);

    const filters = createFiltersFromAddressPointers(remaining);
    const req = createRxOneshotReq({ filters, rxReqId: id });
    const results = yield rxNostr.use(req, { on: { relays: remoteRelays } });

    if (handleResults(results)) return;
  }

  // finally load from lookup relays
  if (opts?.lookupRelays) {
    // make sure we aren't asking a relay twice
    const relays = opts.lookupRelays.filter((r) => !pointerRelays.includes(r));
    if (relays.length > 0) {
      log(`[${id}] Request from lookup`, relays, remaining);

      const filters = createFiltersFromAddressPointers(remaining);
      const req = createRxOneshotReq({ filters, rxReqId: id });
      const results = yield rxNostr.use(req, { on: { relays } });

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

export class ReplaceableLoader extends Loader<LoadableAddressPointer, EventPacket> {
  log: typeof logger = logger.extend("ReplaceableLoader");

  /** A method used to load events from a local cache */
  cacheRequest?: CacheRequest;
  /** Fallback lookup relays to check when event cant be found */
  lookupRelays?: string[];

  constructor(rxNostr: RxNostr, opts?: ReplaceableLoaderOptions) {
    super((source) => {
      return source.pipe(
        // filter out invalid pointers
        filter(isLoadableAddressPointer),
        // only fetch from each relay once
        distinctRelays(getAddressPointerId),
        // buffer on time
        bufferTime(opts?.bufferTime ?? 1000),
        // ignore empty buffers
        filter((buffer) => buffer.length > 0),
        // consolidate buffered pointers
        map(consolidateAddressPointers),
        // ignore empty buffer
        filter((buffer) => buffer.length > 0),
        // check cache, relays, lookup relays in that order
        generatorSequence<LoadableAddressPointer[], EventPacket>(
          (pointers) =>
            cacheFirstSequence(rxNostr, pointers, this.log, {
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
