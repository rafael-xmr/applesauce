import { share, tap, from, Observable, filter, map, mergeAll, bufferTime } from "rxjs";
import { createRxOneshotReq, EventPacket, RxNostr } from "rx-nostr";
import { markFromCache } from "applesauce-core/helpers";
import { logger } from "applesauce-core";
import { nanoid } from "nanoid";

import { CacheRequest, Loader } from "./loader.js";
import { generatorSequence } from "../operators/generator-sequence.js";
import { consolidateAddressPointers, createFiltersFromAddressPointers } from "../helpers/address-pointer.js";
import { groupByRelay } from "../helpers/pointer.js";
import { distinctRelays } from "../operators/distinct-by-relays.js";

export type LoadableSetPointer = {
  /** A replaceable kind >= 30000 & < 40000 */
  kind: number;
  pubkey: string;
  /** Relays to load from */
  relays?: string[];
  /** Load the sets even if it has already been loaded */
  force?: boolean;
};

/** A generator that tries to load the address pointers from the cache first, then tries the relays */
function* cacheFirstSequence(
  rxNostr: RxNostr,
  pointers: LoadableSetPointer[],
  log: typeof logger,
  opts?: { cacheRequest?: CacheRequest },
): Generator<Observable<EventPacket>, undefined, EventPacket[]> {
  const id = nanoid(8);
  log = log.extend(id);

  // first attempt, load from cache relays
  if (opts?.cacheRequest) {
    log(`Checking cache`);
    const filters = createFiltersFromAddressPointers(pointers);
    const results = yield opts.cacheRequest(filters).pipe(
      // mark the event as from the cache
      tap((event) => markFromCache(event)),
      // convert to event packets
      map((e) => ({ event: e, from: "", subId: "user-sets-loader", type: "EVENT" }) as EventPacket),
    );

    if (results.length > 0) {
      log(`Loaded ${results.length} events from cache`);
    }
  }

  let byRelay = groupByRelay(pointers, "default");

  // load sets from relays
  yield from(
    Array.from(byRelay.entries()).map(([relay, pointers]) => {
      let filters = createFiltersFromAddressPointers(pointers);

      let count = 0;
      const req = createRxOneshotReq({ filters, rxReqId: id });

      log(`Requesting from ${relay}`, pointers);

      let sub$: Observable<EventPacket>;
      // don't specify relay if this is the "default" relay
      if (relay === "default") sub$ = rxNostr.use(req);
      else sub$ = rxNostr.use(req, { on: { relays: [relay] } });

      return sub$.pipe(
        tap({
          next: () => count++,
          complete: () => log(`Completed ${relay}, loaded ${count} events`),
        }),
      );
    }),
  ).pipe(mergeAll());
}

export type UserSetsLoaderOptions = {
  /**
   * Time interval to buffer requests in ms
   * @default 1000
   */
  bufferTime?: number;
  /** A method used to load events from a local cache */
  cacheRequest?: CacheRequest;
  /**
   * How long the loader should wait before it allows an event pointer to be refreshed from a relay
   * @default 120000
   */
  refreshTimeout?: number;
};

/** A loader that can be used to load users NIP-51 sets events ( kind >= 30000 < 40000) */
export class UserSetsLoader extends Loader<LoadableSetPointer, EventPacket> {
  log: typeof logger = logger.extend("UserSetsLoader");

  constructor(rxNostr: RxNostr, opts?: UserSetsLoaderOptions) {
    let options = opts || {};

    super((source) =>
      source.pipe(
        distinctRelays((p) => p.kind + ":" + p.pubkey, options.refreshTimeout ?? 120_000),
        // load first from cache
        bufferTime(options?.bufferTime ?? 1000),
        // ignore empty buffers
        filter((buffer) => buffer.length > 0),
        // deduplicate address pointers
        map(consolidateAddressPointers),
        // check cache, relays, lookup relays in that order
        generatorSequence<LoadableSetPointer[], EventPacket>((pointers) =>
          cacheFirstSequence(rxNostr, pointers, this.log, options),
        ),
        // share the response with all subscribers
        share(),
      ),
    );
  }
}
