import { EventPacket, RxNostr } from "rx-nostr";
import { BehaviorSubject, combineLatest, connect, merge, share, tap } from "rxjs";
import { logger } from "applesauce-core";
import { nanoid } from "nanoid";

import { RelayTimelineLoader, TimelessFilter } from "./relay-timeline-loader.js";
import { Loader } from "./loader.js";

export type RelayFilterMap = {
  [relay: string]: TimelessFilter[];
};

export type TimelineLoaderOptions = {
  limit?: number;
};

/** A multi-relay timeline loader that can be used to load a timeline from multiple relays */
export class TimelineLoader extends Loader<number | undefined, EventPacket> {
  id = nanoid(8);
  loading$ = new BehaviorSubject(false);
  get loading() {
    return this.loading$.value;
  }

  requests: RelayFilterMap;

  protected log: typeof logger = logger.extend("TimelineLoader");
  protected loaders: Map<string, RelayTimelineLoader>;

  constructor(rxNostr: RxNostr, requests: RelayFilterMap, opts?: TimelineLoaderOptions) {
    const loaders = new Map<string, RelayTimelineLoader>();

    super((source) => {
      // create loaders
      for (const [relay, filters] of Object.entries(requests)) {
        loaders.set(relay, new RelayTimelineLoader(rxNostr, relay, filters, opts));
      }

      // observable that triggers the loaders based on cursor
      const trigger$ = source.pipe(
        tap((cursor) => {
          for (const [_relay, loader] of loaders) {
            // load the next page if cursor is past loader cursor
            if (!cursor || !Number.isFinite(cursor) || cursor <= loader.cursor) {
              if (!loader.loading && !loader.eose) loader.next();
            }
          }
        }),
      );

      // observable that handles updating the loading state
      const loading$ = combineLatest(Array.from(loaders.values()).map((l) => l.loading$)).pipe(
        // set loading to true as long as one loader is still loading
        tap((loading) => this.loading$.next(loading.some((v) => v === true))),
      );

      // observable that merges all the outputs of the loaders
      const events$ = merge<EventPacket[]>(...Array.from(loaders.values()).map((l) => l.observable));

      // subscribe to all observables but only return the results of events$
      return merge(trigger$, loading$, events$).pipe(
        connect((_shared$) => events$),
        share(),
      );
    });

    this.requests = requests;
    this.loaders = loaders;
    this.log = this.log.extend(this.id);
  }

  static simpleFilterMap(relays: string[], filters: TimelessFilter[]): RelayFilterMap {
    return relays.reduce<RelayFilterMap>((map, relay) => ({ ...map, [relay]: filters }), {});
  }
}
