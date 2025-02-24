import { createRxOneshotReq, EventPacket, RxNostr } from "rx-nostr";
import { bufferTime, filter, map, merge, mergeMap, tap } from "rxjs";
import { Filter } from "nostr-tools";
import { markFromCache } from "applesauce-core/helpers";
import { logger } from "applesauce-core";

import { CacheRequest, Loader, RelayFilterMap } from "./loader.js";
import { distinctRelaysBatch } from "../operators/distinct-relays.js";
import { getDefaultReadRelays } from "../helpers/rx-nostr.js";
import { unique } from "../helpers/array.js";

export type TabValuePointer = {
  /** The value of the tag to load */
  value: string;
  /** The relays to load from */
  relays?: string[];
  /** bypass the cache */
  force?: boolean;
};

export type TagValueLoaderOptions = {
  /** the name of this loader (for debugging) */
  name?: string;
  /**
   * Time interval to buffer requests in ms
   * @default 1000
   */
  bufferTime?: number;

  /** Restrict queries to specific kinds */
  kinds?: number[];
  /** Restrict queries to specific authors */
  authors?: string[];
  /** Restrict queries since */
  since?: number;

  /** Method used to load from the cache */
  cacheRequest?: CacheRequest;
};

export class TagValueLoader extends Loader<TabValuePointer, EventPacket> {
  name: string;
  protected log: typeof logger = logger.extend("TagValueLoader");

  constructor(rxNostr: RxNostr, tagName: string, opts?: TagValueLoaderOptions) {
    const filterTag: `#${string}` = `#${tagName}`;

    super((source) =>
      source.pipe(
        // batch the pointers
        bufferTime(opts?.bufferTime ?? 1000),
        // filter out empty batches
        filter((pointers) => pointers.length > 0),
        // only request from each relay once
        distinctRelaysBatch((m) => m.value),
        // batch pointers into requests
        mergeMap((pointers) => {
          const baseFilter: Filter = {};
          if (opts?.kinds) baseFilter.kinds = opts.kinds;
          if (opts?.since) baseFilter.since = opts.since;
          if (opts?.authors) baseFilter.authors = opts.authors;

          // build request map for relays
          const requestMap = pointers.reduce<RelayFilterMap>((map, pointer) => {
            const relays = pointer.relays ?? getDefaultReadRelays(rxNostr);
            for (const relay of relays) {
              if (!map[relay]) {
                // create new filter for relay
                const filter: Filter = { ...baseFilter, [filterTag]: [pointer.value] };
                map[relay] = [filter];
              } else {
                // map for relay already exists, add the tag value
                const filter = map[relay][0];
                filter[filterTag]!.push(pointer.value);
              }
            }
            return map;
          }, {});

          let fromCache = 0;
          const cacheRequest = opts
            ?.cacheRequest?.([{ ...baseFilter, [filterTag]: unique(pointers.map((p) => p.value)) }])
            .pipe(
              // mark the event as from the cache
              tap({
                next: (event) => {
                  markFromCache(event);
                  fromCache++;
                },
                complete: () => {
                  if (fromCache > 0) this.log(`Loaded ${fromCache} from cache`);
                },
              }),
              // convert to event packets
              map((e) => ({ event: e, from: "", subId: "replaceable-loader", type: "EVENT" }) as EventPacket),
            );

          const requests = Object.entries(requestMap).map(([relay, filters]) => {
            const req = createRxOneshotReq({ filters });
            return rxNostr.use(req, { on: { relays: [relay] } });
          });

          this.log(`Requesting ${pointers.length} tag values from ${requests.length} relays`);

          return cacheRequest ? merge(cacheRequest, ...requests) : merge(...requests);
        }),
      ),
    );

    // create a unique logger for this instance
    this.name = opts?.name ?? "";
    this.log = this.log.extend(
      opts?.kinds ? `${this.name} ${filterTag} (${opts?.kinds?.join(",")})` : `${this.name} ${filterTag}`,
    );
  }
}
