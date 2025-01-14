import { bufferTime, filter, from, map, mergeAll, Observable, OperatorFunction, tap } from "rxjs";
import { createRxOneshotReq, EventPacket, RxNostr } from "rx-nostr";
import { markFromCache } from "applesauce-core/helpers";
import { logger } from "applesauce-core";
import { Filter } from "nostr-tools";
import { nanoid } from "nanoid";

import { CacheRequest, Loader } from "./loader.js";
import { generatorSequence } from "../operators/generator-sequence.js";
import { distinctRelays } from "../operators/distinct-by-relays.js";

export type LoadableEventPointer = {
  id: string;
  /** Relays to load from */
  relays?: string[];
};

export type SingleEventLoaderOptions = {
  /**
   * Time interval to buffer requests in ms
   * @default 1000
   */
  bufferTime?: number;
  /** A method used to load events from a local cache */
  cacheRequest?: CacheRequest;
  /**
   * How long the loader should wait before it allows an event pointer to be refreshed from a relay
   * @default 60000
   */
  refreshTimeout?: number;
};

/** Consolidate a batch of event pointers */
function consolidateLoadableEventPointers(): OperatorFunction<LoadableEventPointer[], LoadableEventPointer[]> {
  return (source) =>
    source.pipe(
      map((pointers) => {
        const ids = new Map<string, LoadableEventPointer>();

        for (const pointer of pointers) {
          const current = ids.get(pointer.id);
          if (current) {
            // merge relays
            if (pointer.relays) {
              if (!current.relays) current.relays = [...pointer.relays];
              else {
                for (const relay of pointer.relays) {
                  if (!current.relays.includes(relay)) current.relays.push(relay);
                }
              }
            }
          } else ids.set(pointer.id, pointer);
        }

        return Array.from(ids.values());
      }),
    );
}

function* cacheFirstSequence(
  rxNostr: RxNostr,
  pointers: LoadableEventPointer[],
  opts: SingleEventLoaderOptions,
  log: typeof logger,
): Generator<Observable<EventPacket>, undefined, EventPacket[]> {
  let remaining = [...pointers];

  const loaded = (packets: EventPacket[]) => {
    const ids = new Set(packets.map((p) => p.event.id));
    remaining = remaining.filter((p) => !ids.has(p.id));
  };

  if (opts?.cacheRequest) {
    let filter: Filter = { ids: remaining.map((e) => e.id) };

    const results = yield opts.cacheRequest([filter]).pipe(
      // mark the event as from the cache
      tap((event) => markFromCache(event)),
      // convert to event packets
      map((e) => ({ event: e, from: "cache", subId: "cache", type: "EVENT" }) as EventPacket),
    );

    if (results.length > 0) {
      log(`Loaded ${results.length} events from cache`);
      loaded(results);
    }
  }

  let byRelay = new Map<string, LoadableEventPointer[]>();
  for (const pointer of remaining) {
    let relays = pointer.relays?.length ? pointer.relays : ["default"];
    for (const relay of relays) {
      if (!byRelay.has(relay)) byRelay.set(relay, [pointer]);
      else byRelay.get(relay)?.push(pointer);
    }
  }

  // load remaining pointers from the relays
  let results = yield from(
    Array.from(byRelay.entries()).map(([relay, pointers]) => {
      let relayLog = log.extend(relay);
      let filter: Filter = { ids: pointers.map((e) => e.id) };

      let count = 0;
      const id = nanoid(8);
      const req = createRxOneshotReq({ filters: [filter], rxReqId: id });

      relayLog(`Requesting ${id}`, filter.ids);

      let sub$: Observable<EventPacket>;
      // don't specify relay if this is the "default" relay
      if (relay === "default") sub$ = rxNostr.use(req);
      else sub$ = rxNostr.use(req, { on: { relays: [relay] } });

      return sub$.pipe(
        tap({
          next: () => count++,
          complete: () => relayLog(`Completed ${id} loaded ${count} events`),
        }),
      );
    }),
  ).pipe(mergeAll());

  loaded(results);

  if (remaining.length > 0) {
    // failed to find remaining
    log(
      "Failed to load",
      remaining.map((p) => p.id),
    );
  }
}

export class SingleEventLoader extends Loader<LoadableEventPointer, EventPacket> {
  log: typeof logger = logger.extend("SingleEventLoader");

  constructor(rxNostr: RxNostr, opts?: SingleEventLoaderOptions) {
    let options = opts || {};

    super((source) =>
      source.pipe(
        distinctRelays((p) => p.id, options.refreshTimeout ?? 60_000),
        // load first from cache
        bufferTime(opts?.bufferTime ?? 1000),
        // ignore empty buffers
        filter((buffer) => buffer.length > 0),
        // ensure there is only one of each event pointer
        consolidateLoadableEventPointers(),
        // run the loader sequence
        generatorSequence<LoadableEventPointer[], EventPacket>((pointers) =>
          cacheFirstSequence(rxNostr, pointers, options, this.log),
        ),
      ),
    );
  }
}
