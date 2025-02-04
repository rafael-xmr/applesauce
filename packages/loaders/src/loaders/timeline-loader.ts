import { EventPacket, RxNostr } from "rx-nostr";
import { BehaviorSubject, combineLatest, connect, merge, share, tap } from "rxjs";
import { logger } from "applesauce-core";
import { mergeFilters } from "nostr-tools";
import { nanoid } from "nanoid";

import { RelayTimelineLoader, TimelessFilter } from "./relay-timeline-loader.js";
import { CacheRequest, Loader, RelayFilterMap } from "./loader.js";
import { CacheTimelineLoader } from "./cache-timeline-loader.js";

export type TimelineLoaderOptions = {
  limit?: number;
  cacheRequest?: CacheRequest;
};

/** A multi-relay timeline loader that can be used to load a timeline from multiple relays */
export class TimelineLoader extends Loader<number | undefined, EventPacket> {
  id = nanoid(8);
  loading$ = new BehaviorSubject(false);
  get loading() {
    return this.loading$.value;
  }

  requests: RelayFilterMap<TimelessFilter>;

  protected log: typeof logger = logger.extend("TimelineLoader");
  protected cache?: CacheTimelineLoader;
  protected loaders: Map<string, RelayTimelineLoader>;

  constructor(rxNostr: RxNostr, requests: RelayFilterMap<TimelessFilter>, opts?: TimelineLoaderOptions) {
    const loaders = new Map<string, RelayTimelineLoader>();
    const cache = opts?.cacheRequest
      ? new CacheTimelineLoader(opts.cacheRequest, [mergeFilters(...Object.values(requests).flat())], opts)
      : undefined;
    const allLoaders = cache ? [cache, ...loaders.values()] : Array.from(loaders.values());

    super((source) => {
      // create loaders
      for (const [relay, filters] of Object.entries(requests)) {
        loaders.set(relay, new RelayTimelineLoader(rxNostr, relay, filters, opts));
      }

      // observable that triggers the loaders based on cursor
      const trigger$ = source.pipe(
        tap((cursor) => {
          for (const loader of allLoaders) {
            // load the next page if cursor is past loader cursor
            if (!cursor || !Number.isFinite(cursor) || cursor <= loader.cursor) {
              if (!loader.loading && !loader.eose) loader.next();
            }
          }
        }),
      );

      // observable that handles updating the loading state
      const loading$ = combineLatest(allLoaders.map((l) => l.loading$)).pipe(
        // set loading to true as long as one loader is still loading
        tap((loading) => this.loading$.next(loading.some((v) => v === true))),
      );

      // observable that merges all the outputs of the loaders
      const events$ = merge<EventPacket[]>(...allLoaders.map((l) => l.observable));

      // subscribe to all observables but only return the results of events$
      return merge(trigger$, loading$, events$).pipe(
        connect((_shared$) => events$),
        share(),
      );
    });

    this.requests = requests;
    this.cache = cache;
    this.loaders = loaders;
    this.log = this.log.extend(this.id);
  }

  static simpleFilterMap(relays: string[], filters: TimelessFilter[]): RelayFilterMap<TimelessFilter> {
    return relays.reduce<RelayFilterMap<TimelessFilter>>((map, relay) => ({ ...map, [relay]: filters }), {});
  }
}
